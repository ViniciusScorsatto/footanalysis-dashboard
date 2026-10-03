import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import Database from 'better-sqlite3';

export const projectRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
export const dataDir = process.env.FOOT_ANALYSIS_ONLINE === '1'
  ? path.resolve(process.env.FOOT_ANALYSIS_DATA_DIR || path.join(projectRoot, 'data', 'online'))
  : path.join(projectRoot, 'data');
export const sqliteFile = process.env.FOOT_ANALYSIS_DB_PATH
  ? path.resolve(projectRoot, process.env.FOOT_ANALYSIS_DB_PATH)
  : path.join(dataDir, 'foot-analysis.sqlite');

let connection;

export const jsonStringify = (value) => `${JSON.stringify(value ?? null)}`;
export const jsonParse = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const stableJson = (value) => {
  const normalize = (item) => {
    if (Array.isArray(item)) return item.map(normalize);
    if (item && typeof item === 'object') {
      return Object.fromEntries(
        Object.keys(item)
          .sort()
          .map((key) => [key, normalize(item[key])])
      );
    }
    return item;
  };

  return JSON.stringify(normalize(value ?? {}));
};

export const hashJson = (value) =>
  crypto.createHash('sha1').update(stableJson(value)).digest('hex');

const columnExists = (db, tableName, columnName) =>
  db.prepare(`PRAGMA table_info(${tableName})`).all().some((column) => column.name === columnName);

const addColumn = (db, tableName, definition) => {
  const columnName = definition.trim().split(/\s+/)[0];
  if (!columnExists(db, tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  }
};

export const migrateDatabase = (db = getDb()) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS video_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sport TEXT NOT NULL DEFAULT 'football',
      template TEXT NOT NULL,
      composition_id TEXT NOT NULL,
      league_id INTEGER,
      season INTEGER,
      league_name TEXT,
      channel_profile TEXT,
      language_profile TEXT,
      output_name TEXT,
      payload_json TEXT NOT NULL,
      is_current INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_video_jobs_template_updated
      ON video_jobs(template, updated_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_video_jobs_current
      ON video_jobs(is_current)
      WHERE is_current = 1;

    CREATE TABLE IF NOT EXISTS render_outputs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_job_id INTEGER,
      composition_id TEXT NOT NULL,
      output_name TEXT,
      render_path TEXT NOT NULL,
      payload_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(video_job_id) REFERENCES video_jobs(id)
    );

    CREATE TABLE IF NOT EXISTS api_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL DEFAULT 'api-sports',
      endpoint TEXT NOT NULL,
      params_json TEXT NOT NULL,
      params_hash TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      UNIQUE(provider, endpoint, params_hash)
    );

    CREATE TABLE IF NOT EXISTS history_cache (
      competition_id TEXT NOT NULL,
      generator_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(competition_id, generator_id)
    );

    CREATE TABLE IF NOT EXISTS leagues (
      api_league_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      country TEXT,
      type TEXT,
      primary_channel TEXT,
      logo_url TEXT,
      payload_json TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seasons (
      league_id INTEGER NOT NULL,
      season INTEGER NOT NULL,
      label TEXT,
      status TEXT,
      payload_json TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(league_id, season)
    );

    CREATE TABLE IF NOT EXISTS teams (
      api_team_id INTEGER PRIMARY KEY,
      canonical_name TEXT NOT NULL,
      country TEXT,
      logo_url TEXT,
      logo_path TEXT,
      aliases_json TEXT,
      accent_color TEXT,
      payload_json TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(canonical_name);

    CREATE TABLE IF NOT EXISTS players (
      api_player_id INTEGER PRIMARY KEY,
      canonical_name TEXT NOT NULL,
      nationality TEXT,
      birthdate TEXT,
      photo_url TEXT,
      payload_json TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_players_name ON players(canonical_name);

    CREATE TABLE IF NOT EXISTS fixtures (
      api_fixture_id INTEGER PRIMARY KEY,
      league_id INTEGER NOT NULL,
      season INTEGER NOT NULL,
      round TEXT,
      fixture_date TEXT,
      status_short TEXT,
      status_long TEXT,
      venue_name TEXT,
      home_team_id INTEGER,
      away_team_id INTEGER,
      home_score INTEGER,
      away_score INTEGER,
      payload_json TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_fixtures_league_season
      ON fixtures(league_id, season, round, fixture_date);

    CREATE TABLE IF NOT EXISTS standings_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      league_id INTEGER NOT NULL,
      season INTEGER NOT NULL,
      snapshot_key TEXT NOT NULL,
      round TEXT,
      team_id INTEGER,
      team_name TEXT NOT NULL,
      rank INTEGER NOT NULL,
      played INTEGER NOT NULL DEFAULT 0,
      points INTEGER NOT NULL DEFAULT 0,
      goals_for INTEGER NOT NULL DEFAULT 0,
      goals_against INTEGER NOT NULL DEFAULT 0,
      goal_difference INTEGER NOT NULL DEFAULT 0,
      form TEXT,
      payload_json TEXT,
      captured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(league_id, season, snapshot_key, team_id, team_name)
    );

    CREATE INDEX IF NOT EXISTS idx_standings_latest
      ON standings_snapshots(league_id, season, snapshot_key, rank);

    CREATE TABLE IF NOT EXISTS player_season_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER,
      player_name TEXT NOT NULL,
      team_id INTEGER,
      team_name TEXT,
      league_id INTEGER NOT NULL,
      season INTEGER NOT NULL,
      position TEXT,
      goals INTEGER NOT NULL DEFAULT 0,
      assists INTEGER,
      rating REAL,
      minutes INTEGER,
      appearances INTEGER,
      payload_json TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, player_name, team_id, league_id, season)
    );

    CREATE INDEX IF NOT EXISTS idx_player_stats_league_goals
      ON player_season_stats(league_id, season, goals DESC);

    CREATE TABLE IF NOT EXISTS fixture_team_stats (
      fixture_id INTEGER NOT NULL,
      team_id INTEGER,
      team_name TEXT NOT NULL,
      stats_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(fixture_id, team_id, team_name)
    );

    CREATE TABLE IF NOT EXISTS fixture_player_stats (
      fixture_id INTEGER NOT NULL,
      player_id INTEGER,
      player_name TEXT NOT NULL,
      team_id INTEGER,
      team_name TEXT,
      stats_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(fixture_id, player_id, player_name)
    );

    CREATE TABLE IF NOT EXISTS football_stories (
      id TEXT PRIMARY KEY,
      competition_id INTEGER NOT NULL,
      competition_name TEXT NOT NULL,
      season INTEGER NOT NULL,
      round TEXT NOT NULL,
      story_type TEXT NOT NULL,
      score INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      justification TEXT NOT NULL,
      teams_json TEXT NOT NULL,
      players_json TEXT NOT NULL,
      evidence_json TEXT NOT NULL,
      related_ids_json TEXT NOT NULL,
      recommended_format TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DETECTADA',
      fingerprint TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(competition_id, season, round, fingerprint)
    );

    CREATE INDEX IF NOT EXISTS idx_football_stories_round
      ON football_stories(competition_id, season, round, score DESC);

    CREATE TABLE IF NOT EXISTS short_contents (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      competition_id INTEGER,
      season INTEGER,
      round TEXT,
      format TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'GERADO',
      content_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(story_id, version),
      FOREIGN KEY(story_id) REFERENCES football_stories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_short_contents_story
      ON short_contents(story_id, version DESC);

    CREATE TABLE IF NOT EXISTS short_visual_compositions (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      template TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      fps INTEGER NOT NULL,
      duration_in_frames INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'COMPOSICAO_GERADA',
      composition_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(content_id, version),
      FOREIGN KEY(content_id) REFERENCES short_contents(id)
    );

    CREATE INDEX IF NOT EXISTS idx_short_visual_compositions_content
      ON short_visual_compositions(content_id, version DESC);
  `);

  addColumn(db, 'video_jobs', 'league_name TEXT');
  addColumn(db, 'video_jobs', 'updated_at TEXT');
};

export const getDb = () => {
  if (!connection) {
    fs.mkdirSync(path.dirname(sqliteFile), {recursive: true});
    connection = new Database(sqliteFile);
    connection.pragma('journal_mode = WAL');
    connection.pragma('foreign_keys = ON');
    connection.pragma('busy_timeout = 5000');
    migrateDatabase(connection);
  }

  return connection;
};

export const closeDb = () => {
  if (connection) {
    connection.close();
    connection = undefined;
  }
};

export const transaction = (callback) => {
  const db = getDb();
  return db.transaction(callback)();
};
