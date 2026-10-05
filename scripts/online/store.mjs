import crypto from 'node:crypto';

export const RETENTION_MS = 48 * 60 * 60 * 1000;
export function createOnlineStore(db, now = () => Date.now()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS online_schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS online_previews (id TEXT PRIMARY KEY, snapshot TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS online_sessions (token_hash TEXT PRIMARY KEY, subject TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS online_oauth (state_hash TEXT PRIMARY KEY, nonce TEXT NOT NULL, verifier TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS online_auth_epoch (id INTEGER PRIMARY KEY CHECK(id=1), epoch INTEGER NOT NULL);
    INSERT OR IGNORE INTO online_auth_epoch VALUES (1,0);
    CREATE TABLE IF NOT EXISTS online_renders (
      id TEXT PRIMARY KEY, snapshot TEXT NOT NULL, state TEXT NOT NULL,
      progress REAL NOT NULL DEFAULT 0, created_at INTEGER NOT NULL,
      started_at INTEGER, completed_at INTEGER, expires_at INTEGER,
      error TEXT, cancel_requested INTEGER NOT NULL DEFAULT 0, deleted_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS online_render_queue ON online_renders(state, created_at);
  `);
  db.prepare('INSERT OR IGNORE INTO online_schema_migrations VALUES (1,?)').run(now());
  db.prepare('INSERT OR IGNORE INTO online_schema_migrations VALUES (2,?)').run(now());
  const authEpoch = () => db.prepare('SELECT epoch FROM online_auth_epoch WHERE id=1').get().epoch;
  const digest = (token) => crypto.createHash('sha256').update(token).digest('hex');
  const get = (id) => db.prepare('SELECT * FROM online_renders WHERE id=?').get(id);
  return {
    preview(snapshot) {
      const id = crypto.randomUUID();
      db.prepare('INSERT INTO online_previews VALUES (?,?,?)').run(id, JSON.stringify(snapshot), now());
      return id;
    },
    getPreview(id) {
      const row = db.prepare('SELECT snapshot FROM online_previews WHERE id=?').get(id);
      return row ? JSON.parse(row.snapshot) : null;
    },
    createSession(subject, expectedEpoch = authEpoch()) {
      const token = crypto.randomBytes(32).toString('base64url');
      db.transaction(() => {
        if (expectedEpoch !== authEpoch()) throw new Error('Login revoked; start again');
        db.prepare('INSERT INTO online_sessions VALUES (?,?,?)').run(digest(token), subject, now() + 7 * 86400000);
      })();
      return token;
    },
    session(token) {
      if (!token) return null;
      return db.prepare('SELECT subject FROM online_sessions WHERE token_hash=? AND expires_at>?').get(digest(token), now()) ?? null;
    },
    logout(token) { if (token) db.prepare('DELETE FROM online_sessions WHERE token_hash=?').run(digest(token)); },
    logoutAll() {
      db.transaction(() => {
        db.prepare('UPDATE online_auth_epoch SET epoch=epoch+1 WHERE id=1').run();
        db.prepare('DELETE FROM online_sessions').run();
        db.prepare('DELETE FROM online_oauth').run();
      })();
    },
    startOAuth() {
      const state = crypto.randomBytes(32).toString('base64url');
      const nonce = crypto.randomBytes(32).toString('base64url');
      const verifier = crypto.randomBytes(48).toString('base64url');
      db.transaction(() => {
        db.prepare('DELETE FROM online_oauth WHERE expires_at<=?').run(now());
        if (db.prepare('SELECT count(*) AS n FROM online_oauth').get().n >= 100) {
          const error = new Error('Login capacity reached');
          error.code = 'OAUTH_CAPACITY';
          throw error;
        }
        db.prepare('INSERT INTO online_oauth VALUES (?,?,?,?)').run(digest(state), nonce, verifier, now() + 600000);
      })();
      return {state, nonce, verifier};
    },
    consumeOAuth(state) {
      return db.transaction(() => {
        const record = db.prepare('SELECT * FROM online_oauth WHERE state_hash=? AND expires_at>?').get(digest(state), now());
        db.prepare('DELETE FROM online_oauth WHERE state_hash=?').run(digest(state));
        return record ? {...record, epoch: authEpoch()} : undefined;
      })();
    },
    enqueue(snapshot) {
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO online_renders(id,snapshot,state,created_at) VALUES (?,?,'queued',?)").run(id, JSON.stringify(snapshot), now());
      return get(id);
    },
    get,
    activeCount() { return db.prepare("SELECT count(*) AS count FROM online_renders WHERE state IN ('queued','rendering')").get().count; },
    list(offset = 0) { return db.prepare('SELECT * FROM online_renders ORDER BY created_at DESC, rowid DESC LIMIT 100 OFFSET ?').all(offset); },
    storedVideos() { return db.prepare("SELECT id FROM online_renders WHERE state='completed' AND deleted_at IS NULL").all(); },
    claim() {
      return db.transaction(() => {
        if (db.prepare("SELECT id FROM online_renders WHERE state='rendering'").get()) return null;
        const next = db.prepare("SELECT id FROM online_renders WHERE state='queued' ORDER BY created_at, rowid LIMIT 1").get();
        if (!next) return null;
        db.prepare("UPDATE online_renders SET state='rendering',started_at=? WHERE id=?").run(now(), next.id);
        return get(next.id);
      })();
    },
    progress(id, value) { db.prepare("UPDATE online_renders SET progress=? WHERE id=? AND state='rendering'").run(Math.max(0, Math.min(1, value)), id); },
    finish(id, error = null) {
      const row = get(id);
      if (!row || row.state !== 'rendering') return;
      const state = row.cancel_requested ? 'cancelled' : error ? 'failed' : 'completed';
      db.prepare('UPDATE online_renders SET state=?,progress=?,completed_at=?,expires_at=?,error=? WHERE id=?')
        .run(state, state === 'completed' ? 1 : row.progress, now(), state === 'completed' ? now() + RETENTION_MS : null, state === 'cancelled' ? null : error, id);
    },
    cancel(id) {
      db.prepare("UPDATE online_renders SET cancel_requested=1,state=CASE WHEN state='queued' THEN 'cancelled' ELSE state END WHERE id=? AND state IN ('queued','rendering')").run(id);
      return get(id);
    },
    retry(id) {
      const row = get(id);
      if (!row || ['queued', 'rendering'].includes(row.state)) throw new Error('Job cannot be retried');
      return this.enqueue(JSON.parse(row.snapshot));
    },
    recover() { db.prepare("UPDATE online_renders SET state=CASE WHEN cancel_requested=1 THEN 'cancelled' ELSE 'failed' END,error='Render interrupted by server restart' WHERE state='rendering'").run(); },
    expired() { return db.prepare("SELECT id FROM online_renders WHERE state='completed' AND expires_at<=? AND deleted_at IS NULL").all(now()); },
    markDeleted(id) { db.prepare('UPDATE online_renders SET deleted_at=? WHERE id=?').run(now(), id); },
    pruneAuth() {
      db.prepare('DELETE FROM online_sessions WHERE expires_at<=?').run(now());
      db.prepare('DELETE FROM online_oauth WHERE expires_at<=?').run(now());
    },
  };
}
