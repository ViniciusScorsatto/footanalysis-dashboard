import crypto from 'node:crypto';

import {getDb, jsonParse, jsonStringify} from '../../scripts/lib/db.mjs';

const now = () => new Date().toISOString();

const ensureSchema = () => {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS prediction_requests (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      league_id INTEGER NOT NULL,
      league_name TEXT NOT NULL,
      season INTEGER NOT NULL,
      round TEXT NOT NULL,
      fixtures_json TEXT NOT NULL,
      prediction_edits_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDENTE',
      video_job_id INTEGER,
      output_name TEXT,
      render_path TEXT,
      download_token_hash TEXT,
      download_expires_at TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_prediction_requests_status
      ON prediction_requests(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_prediction_requests_email
      ON prediction_requests(email, created_at DESC);
  `);
};

const parseRequest = (row) =>
  row
    ? {
        ...row,
        fixtures: jsonParse(row.fixtures_json, []),
        predictionEdits: jsonParse(row.prediction_edits_json, []),
      }
    : null;

export const createPredictionRequest = ({email, leagueId, leagueName, season, round, fixtures, predictionEdits}) => {
  ensureSchema();
  const id = crypto.randomUUID();
  const timestamp = now();
  getDb()
    .prepare(`
      INSERT INTO prediction_requests (
        id, email, league_id, league_name, season, round, fixtures_json,
        prediction_edits_json, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?, ?)
    `)
    .run(
      id,
      email,
      leagueId,
      leagueName,
      season,
      round,
      jsonStringify(fixtures),
      jsonStringify(predictionEdits),
      timestamp,
      timestamp
    );
  return getPredictionRequest(id);
};

export const getPredictionRequest = (id) => {
  ensureSchema();
  return parseRequest(getDb().prepare('SELECT * FROM prediction_requests WHERE id = ?').get(id));
};

export const listPredictionRequests = ({status, limit = 50} = {}) => {
  ensureSchema();
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const rows = status
    ? getDb().prepare('SELECT * FROM prediction_requests WHERE status = ? ORDER BY created_at DESC LIMIT ?').all(status, safeLimit)
    : getDb().prepare('SELECT * FROM prediction_requests ORDER BY created_at DESC LIMIT ?').all(safeLimit);
  return rows.map(parseRequest);
};

export const updatePredictionRequest = (id, updates) => {
  ensureSchema();
  const allowed = ['status', 'video_job_id', 'output_name', 'render_path', 'download_token_hash', 'download_expires_at', 'error_message'];
  const entries = Object.entries(updates).filter(([key, value]) => allowed.includes(key) && value !== undefined);
  if (!entries.length) return getPredictionRequest(id);
  const assignments = entries.map(([key]) => `${key} = @${key}`).join(', ');
  getDb()
    .prepare(`UPDATE prediction_requests SET ${assignments}, updated_at = @updated_at WHERE id = @id`)
    .run(Object.fromEntries([...entries, ['updated_at', now()], ['id', id]]));
  return getPredictionRequest(id);
};

export const setDownloadToken = (id, token, expiresAt) =>
  updatePredictionRequest(id, {
    download_token_hash: crypto.createHash('sha256').update(token).digest('hex'),
    download_expires_at: expiresAt,
  });

export const getRequestByDownloadToken = (token) => {
  ensureSchema();
  const hash = crypto.createHash('sha256').update(String(token ?? '')).digest('hex');
  return parseRequest(
    getDb()
      .prepare('SELECT * FROM prediction_requests WHERE download_token_hash = ? AND download_expires_at > ?')
      .get(hash, now())
  );
};
