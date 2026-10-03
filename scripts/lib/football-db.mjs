import {getDb, hashJson, jsonParse, jsonStringify, stableJson} from './db.mjs';

const now = () => new Date().toISOString();
const toNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const parsePayload = (row) =>
  row
    ? {
        ...row,
        payload: jsonParse(row.payload_json),
      }
    : null;

export const saveApiSnapshot = ({provider = 'api-sports', endpoint, params, payload, expiresAt}) => {
  const params_json = stableJson(params ?? {});
  const params_hash = hashJson(params ?? {});
  getDb()
    .prepare(
      `INSERT INTO api_snapshots (
        provider, endpoint, params_json, params_hash, payload_json, fetched_at, expires_at
      ) VALUES (
        @provider, @endpoint, @params_json, @params_hash, @payload_json, @fetched_at, @expires_at
      )
      ON CONFLICT(provider, endpoint, params_hash) DO UPDATE SET
        payload_json = excluded.payload_json,
        fetched_at = excluded.fetched_at,
        expires_at = excluded.expires_at`
    )
    .run({
      provider,
      endpoint,
      params_json,
      params_hash,
      payload_json: jsonStringify(payload),
      fetched_at: now(),
      expires_at: expiresAt ?? null,
    });
};

export const getApiSnapshot = ({provider = 'api-sports', endpoint, params}) => {
  const row = getDb()
    .prepare(
      `SELECT * FROM api_snapshots
       WHERE provider = ? AND endpoint = ? AND params_hash = ?`
    )
    .get(provider, endpoint, hashJson(params ?? {}));
  return parsePayload(row);
};

export const saveVideoJob = (job, {markCurrent = true} = {}) => {
  const db = getDb();
  const run = db.transaction(() => {
    if (markCurrent) {
      db.prepare('UPDATE video_jobs SET is_current = 0 WHERE is_current = 1').run();
    }

    const result = db
      .prepare(
        `INSERT INTO video_jobs (
          sport, template, composition_id, league_id, season, league_name, channel_profile,
          language_profile, output_name, payload_json, is_current, created_at, updated_at
        ) VALUES (
          @sport, @template, @composition_id, @league_id, @season, @league_name, @channel_profile,
          @language_profile, @output_name, @payload_json, @is_current, @created_at, @updated_at
        )`
      )
      .run({
        sport: job.sport ?? 'football',
        template: job.template,
        composition_id: job.compositionId,
        league_id: toNumberOrNull(job.leagueId),
        season: toNumberOrNull(job.season),
        league_name: job.leagueName ?? job.competitionName ?? null,
        channel_profile: job.channelProfile ?? null,
        language_profile: job.languageProfile ?? null,
        output_name: job.outputName ?? null,
        payload_json: jsonStringify(job),
        is_current: markCurrent ? 1 : 0,
        created_at: now(),
        updated_at: now(),
      });

    return Number(result.lastInsertRowid);
  });

  return run();
};

export const loadCurrentVideoJob = () => {
  const row = getDb()
    .prepare('SELECT payload_json FROM video_jobs WHERE is_current = 1 ORDER BY updated_at DESC LIMIT 1')
    .get();
  return jsonParse(row?.payload_json);
};

export const loadLatestVideoJobByTemplate = (template) => {
  const row = getDb()
    .prepare('SELECT payload_json FROM video_jobs WHERE template = ? ORDER BY updated_at DESC, id DESC LIMIT 1')
    .get(template);
  return jsonParse(row?.payload_json);
};

export const listVideoJobs = ({limit = 25} = {}) =>
  getDb()
    .prepare(
      `SELECT id, sport, template, composition_id, league_id, season, league_name,
        channel_profile, language_profile, output_name, is_current, created_at, updated_at
       FROM video_jobs
       ORDER BY updated_at DESC, id DESC
       LIMIT ?`
    )
    .all(limit);

export const saveRenderOutput = ({jobId, compositionId, outputName, renderPath, payload}) =>
  getDb()
    .prepare(
      `INSERT INTO render_outputs (
        video_job_id, composition_id, output_name, render_path, payload_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(jobId ?? null, compositionId, outputName ?? null, renderPath, jsonStringify(payload), now());

export const saveLeague = ({league, country, season, payload}) => {
  const leaguePayload = league ?? payload?.league ?? {};
  const countryPayload = country ?? payload?.country ?? {};
  const leagueId = toNumberOrNull(leaguePayload.id ?? payload?.leagueId);
  if (!leagueId) return;

  getDb()
    .prepare(
      `INSERT INTO leagues (
        api_league_id, name, country, type, primary_channel, logo_url, payload_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(api_league_id) DO UPDATE SET
        name = excluded.name,
        country = excluded.country,
        type = excluded.type,
        logo_url = excluded.logo_url,
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at`
    )
    .run(
      leagueId,
      leaguePayload.name ?? `League ${leagueId}`,
      countryPayload.name ?? payload?.country ?? null,
      leaguePayload.type ?? null,
      null,
      leaguePayload.logo ?? null,
      jsonStringify(payload ?? {league, country}),
      now()
    );

  if (Number.isFinite(Number(season))) {
    getDb()
      .prepare(
        `INSERT INTO seasons (league_id, season, label, status, payload_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(league_id, season) DO UPDATE SET
           label = excluded.label,
           status = excluded.status,
           payload_json = excluded.payload_json,
           updated_at = excluded.updated_at`
      )
      .run(leagueId, Number(season), String(season), null, jsonStringify(payload ?? {}), now());
  }
};

export const saveTeam = ({team, logoPath, aliases, accentColor, payload}) => {
  const teamId = toNumberOrNull(team?.id ?? payload?.team?.id);
  const name = team?.name ?? payload?.team?.name;
  if (!teamId || !name) return;

  getDb()
    .prepare(
      `INSERT INTO teams (
        api_team_id, canonical_name, country, logo_url, logo_path, aliases_json,
        accent_color, payload_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(api_team_id) DO UPDATE SET
        canonical_name = excluded.canonical_name,
        country = COALESCE(excluded.country, teams.country),
        logo_url = COALESCE(excluded.logo_url, teams.logo_url),
        logo_path = COALESCE(excluded.logo_path, teams.logo_path),
        aliases_json = COALESCE(excluded.aliases_json, teams.aliases_json),
        accent_color = COALESCE(excluded.accent_color, teams.accent_color),
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at`
    )
    .run(
      teamId,
      name,
      team.country ?? payload?.team?.country ?? null,
      team.logo ?? payload?.team?.logo ?? null,
      logoPath ?? null,
      aliases ? jsonStringify(aliases) : null,
      accentColor ?? null,
      jsonStringify(payload ?? {team}),
      now()
    );
};

export const savePlayer = ({player, payload}) => {
  const playerId = toNumberOrNull(player?.id ?? payload?.player?.id);
  const name = player?.name ?? payload?.player?.name;
  if (!playerId || !name) return;

  getDb()
    .prepare(
      `INSERT INTO players (
        api_player_id, canonical_name, nationality, birthdate, photo_url, payload_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(api_player_id) DO UPDATE SET
        canonical_name = excluded.canonical_name,
        nationality = COALESCE(excluded.nationality, players.nationality),
        birthdate = COALESCE(excluded.birthdate, players.birthdate),
        photo_url = COALESCE(excluded.photo_url, players.photo_url),
        payload_json = excluded.payload_json,
        updated_at = excluded.updated_at`
    )
    .run(
      playerId,
      name,
      player.nationality ?? null,
      player.birth?.date ?? null,
      player.photo ?? null,
      jsonStringify(payload ?? {player}),
      now()
    );
};

export const saveFixturesFromApi = ({leagueId, season, fixtures = []}) => {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO fixtures (
      api_fixture_id, league_id, season, round, fixture_date, status_short, status_long,
      venue_name, home_team_id, away_team_id, home_score, away_score, payload_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(api_fixture_id) DO UPDATE SET
      league_id = excluded.league_id,
      season = excluded.season,
      round = excluded.round,
      fixture_date = excluded.fixture_date,
      status_short = excluded.status_short,
      status_long = excluded.status_long,
      venue_name = excluded.venue_name,
      home_team_id = excluded.home_team_id,
      away_team_id = excluded.away_team_id,
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      payload_json = excluded.payload_json,
      updated_at = excluded.updated_at`
  );

  db.transaction(() => {
    for (const item of fixtures) {
      saveLeague({league: item.league, season: item.league?.season ?? season, payload: item});
      saveTeam({team: item.teams?.home, payload: {team: item.teams?.home}});
      saveTeam({team: item.teams?.away, payload: {team: item.teams?.away}});
      insert.run(
        item.fixture?.id,
        Number(item.league?.id ?? leagueId),
        Number(item.league?.season ?? season),
        item.league?.round ?? null,
        item.fixture?.date ?? null,
        item.fixture?.status?.short ?? null,
        item.fixture?.status?.long ?? null,
        item.fixture?.venue?.name ?? null,
        toNumberOrNull(item.teams?.home?.id),
        toNumberOrNull(item.teams?.away?.id),
        toNumberOrNull(item.goals?.home ?? item.score?.fulltime?.home),
        toNumberOrNull(item.goals?.away ?? item.score?.fulltime?.away),
        jsonStringify(item),
        now()
      );
    }
  })();
};

const flattenStandingsGroups = (standingsGroups) => {
  if (!Array.isArray(standingsGroups)) return [];
  if (standingsGroups.length === 1 && Array.isArray(standingsGroups[0])) return standingsGroups[0];
  return standingsGroups.flatMap((group) => (Array.isArray(group) ? group : []));
};

export const saveStandingsFromApi = ({leagueId, season, payload, snapshotKey = 'latest'}) => {
  const league = payload?.response?.[0]?.league;
  const rows = flattenStandingsGroups(league?.standings);
  saveLeague({league, season: league?.season ?? season, payload: payload?.response?.[0]});

  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO standings_snapshots (
      league_id, season, snapshot_key, round, team_id, team_name, rank, played, points,
      goals_for, goals_against, goal_difference, form, payload_json, captured_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(league_id, season, snapshot_key, team_id, team_name) DO UPDATE SET
      rank = excluded.rank,
      played = excluded.played,
      points = excluded.points,
      goals_for = excluded.goals_for,
      goals_against = excluded.goals_against,
      goal_difference = excluded.goal_difference,
      form = excluded.form,
      payload_json = excluded.payload_json,
      captured_at = excluded.captured_at`
  );

  db.transaction(() => {
    for (const row of rows) {
      saveTeam({team: row.team, payload: {team: row.team}});
      insert.run(
        Number(league?.id ?? leagueId),
        Number(league?.season ?? season),
        snapshotKey,
        row.group ?? null,
        toNumberOrNull(row.team?.id),
        row.team?.name ?? 'Unknown',
        Number(row.rank ?? 0),
        Number(row.all?.played ?? 0),
        Number(row.points ?? 0),
        Number(row.all?.goals?.for ?? 0),
        Number(row.all?.goals?.against ?? 0),
        Number(row.goalsDiff ?? 0),
        row.form ?? null,
        jsonStringify(row),
        now()
      );
    }
  })();
};

export const saveTopScorersFromApi = ({leagueId, season, payload}) => {
  const rows = Array.isArray(payload?.response) ? payload.response : [];
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO player_season_stats (
      player_id, player_name, team_id, team_name, league_id, season, position,
      goals, assists, rating, minutes, appearances, payload_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id, player_name, team_id, league_id, season) DO UPDATE SET
      position = excluded.position,
      goals = excluded.goals,
      assists = excluded.assists,
      rating = excluded.rating,
      minutes = excluded.minutes,
      appearances = excluded.appearances,
      payload_json = excluded.payload_json,
      updated_at = excluded.updated_at`
  );

  db.transaction(() => {
    for (const row of rows) {
      const stat = Array.isArray(row.statistics) ? row.statistics[0] : {};
      const league = stat?.league ?? {};
      const team = stat?.team ?? {};
      saveLeague({league, season: league.season ?? season, payload: row});
      saveTeam({team, payload: {team}});
      savePlayer({player: row.player, payload: row});
      insert.run(
        toNumberOrNull(row.player?.id),
        row.player?.name ?? 'Unknown',
        toNumberOrNull(team.id),
        team.name ?? null,
        Number(league.id ?? leagueId),
        Number(league.season ?? season),
        stat?.games?.position ?? null,
        Number(stat?.goals?.total ?? 0),
        toNumberOrNull(stat?.goals?.assists),
        toNumberOrNull(stat?.games?.rating),
        toNumberOrNull(stat?.games?.minutes),
        toNumberOrNull(stat?.games?.appearences ?? stat?.games?.appearances),
        jsonStringify(row),
        now()
      );
    }
  })();
};

export const listLeagues = () =>
  getDb()
    .prepare(
      `SELECT api_league_id AS leagueId, name, country, type, primary_channel AS primaryChannel,
        logo_url AS logoUrl, updated_at AS updatedAt
       FROM leagues
       ORDER BY name`
    )
    .all();

export const searchTeams = ({query = '', limit = 25} = {}) => {
  const term = `%${String(query).trim()}%`;
  return getDb()
    .prepare(
      `SELECT api_team_id AS teamId, canonical_name AS name, country, logo_url AS logoUrl,
        logo_path AS logoPath, accent_color AS accentColor
       FROM teams
       WHERE ? = '%%' OR canonical_name LIKE ?
       ORDER BY canonical_name
       LIMIT ?`
    )
    .all(term, term, limit);
};

export const getStandings = ({leagueId, season, snapshotKey = 'latest'} = {}) =>
  getDb()
    .prepare(
      `SELECT s.rank, s.team_id AS teamId, s.team_name AS team, s.played, s.points,
        s.goals_for AS goalsFor, s.goals_against AS goalsAgainst,
        s.goal_difference AS goalDifference, s.form,
        t.logo_path AS logoPath, t.logo_url AS logoUrl, t.accent_color AS accentColor
       FROM standings_snapshots s
       LEFT JOIN teams t ON t.api_team_id = s.team_id
       WHERE s.league_id = ? AND s.season = ? AND s.snapshot_key = ?
       ORDER BY s.rank`
    )
    .all(Number(leagueId), Number(season), snapshotKey);

export const getTopScorers = ({leagueId, season, limit = 20} = {}) =>
  getDb()
    .prepare(
      `SELECT pss.player_id AS playerId, pss.player_name AS playerName,
        pss.team_id AS teamId, pss.team_name AS team, pss.league_id AS leagueId,
        pss.season, pss.position, pss.goals, pss.assists, pss.rating, pss.minutes,
        t.logo_path AS logoPath, t.logo_url AS logoUrl, t.accent_color AS accentColor
       FROM player_season_stats pss
       LEFT JOIN teams t ON t.api_team_id = pss.team_id
       WHERE pss.league_id = ? AND pss.season = ?
       ORDER BY pss.goals DESC, COALESCE(pss.assists, 0) DESC, pss.player_name
       LIMIT ?`
    )
    .all(Number(leagueId), Number(season), Number(limit));

export const listDbRounds = ({leagueId, season} = {}) =>
  getDb()
    .prepare(
      `SELECT round, COUNT(*) AS fixtureCount,
        SUM(CASE WHEN status_short IN ('FT', 'AET', 'PEN') THEN 1 ELSE 0 END) AS finishedCount,
        MIN(fixture_date) AS firstDate, MAX(fixture_date) AS lastDate
       FROM fixtures
       WHERE league_id = ? AND season = ?
       GROUP BY round
       ORDER BY MIN(fixture_date), round`
    )
    .all(Number(leagueId), Number(season));

export const getRoundFixtures = ({leagueId, season, round} = {}) =>
  getDb()
    .prepare(
      `SELECT f.api_fixture_id AS fixtureId, f.league_id AS leagueId, f.season, f.round,
        f.fixture_date AS fixtureDate, f.status_short AS statusShort,
        f.home_team_id AS homeTeamId, COALESCE(ht.canonical_name, 'Mandante') AS homeTeam,
        f.away_team_id AS awayTeamId, COALESCE(at.canonical_name, 'Visitante') AS awayTeam,
        f.home_score AS homeScore, f.away_score AS awayScore, f.payload_json AS payloadJson
       FROM fixtures f
       LEFT JOIN teams ht ON ht.api_team_id = f.home_team_id
       LEFT JOIN teams at ON at.api_team_id = f.away_team_id
       WHERE f.league_id = ? AND f.season = ? AND f.round = ?
       ORDER BY f.fixture_date, f.api_fixture_id`
    )
    .all(Number(leagueId), Number(season), String(round));

export const getSeasonFixtures = ({leagueId, season} = {}) =>
  getDb()
    .prepare(
      `SELECT f.api_fixture_id AS fixtureId, f.league_id AS leagueId, f.season, f.round,
        f.fixture_date AS fixtureDate, f.status_short AS statusShort,
        f.home_team_id AS homeTeamId, COALESCE(ht.canonical_name, 'Mandante') AS homeTeam,
        f.away_team_id AS awayTeamId, COALESCE(at.canonical_name, 'Visitante') AS awayTeam,
        f.home_score AS homeScore, f.away_score AS awayScore, f.payload_json AS payloadJson
       FROM fixtures f
       LEFT JOIN teams ht ON ht.api_team_id = f.home_team_id
       LEFT JOIN teams at ON at.api_team_id = f.away_team_id
       WHERE f.league_id = ? AND f.season = ?
       ORDER BY f.fixture_date, f.api_fixture_id`
    )
    .all(Number(leagueId), Number(season));

const mapStoryRow = (row) => ({
  ...row,
  teams: jsonParse(row.teams_json, []),
  players: jsonParse(row.players_json, []),
  evidence: jsonParse(row.evidence_json, []),
  relatedIds: jsonParse(row.related_ids_json, []),
  tipo: row.story_type,
  pontuacao: row.score,
  titulo: row.title,
  resumo: row.summary,
  justificativa: row.justification,
  formatoRecomendado: row.recommended_format,
  status: row.status,
});

export const saveFootballStories = ({competitionId, competitionName, season, round, stories = []} = {}) => {
  const db = getDb();
  const upsert = db.prepare(
    `INSERT INTO football_stories (
      id, competition_id, competition_name, season, round, story_type, score, title,
      summary, justification, teams_json, players_json, evidence_json, related_ids_json,
      recommended_format, status, fingerprint, created_at, updated_at
    ) VALUES (@id, @competitionId, @competitionName, @season, @round, @storyType, @score, @title,
      @summary, @justification, @teams, @players, @evidence, @relatedIds, @format, @status,
      @fingerprint, @now, @now)
    ON CONFLICT(competition_id, season, round, fingerprint) DO UPDATE SET
      id = excluded.id, competition_name = excluded.competition_name, story_type = excluded.story_type,
      score = excluded.score, title = excluded.title, summary = excluded.summary,
      justification = excluded.justification, teams_json = excluded.teams_json,
      players_json = excluded.players_json, evidence_json = excluded.evidence_json,
      related_ids_json = excluded.related_ids_json, recommended_format = excluded.recommended_format,
      status = CASE WHEN football_stories.status IN ('APROVADA', 'CONTEUDO_GERADO', 'VIDEO_GERADO')
        THEN football_stories.status ELSE excluded.status END,
      updated_at = excluded.updated_at`
  );
  const removeMissing = db.prepare(
    `DELETE FROM football_stories WHERE competition_id = ? AND season = ? AND round = ? AND id NOT IN (${stories.length ? stories.map(() => '?').join(',') : "'__none__'"})`
  );
  const now = new Date().toISOString();
  db.transaction(() => {
    for (const story of stories) {
      upsert.run({
        id: story.id,
        competitionId: Number(competitionId),
        competitionName,
        season: Number(season),
        round: String(round),
        storyType: story.tipo,
        score: story.pontuacao,
        title: story.titulo,
        summary: story.resumo,
        justification: story.justificativa,
        teams: jsonStringify(story.times),
        players: jsonStringify(story.jogadores),
        evidence: jsonStringify(story.evidencias),
        relatedIds: jsonStringify(story.historiasRelacionadas ?? []),
        format: story.formatoRecomendado,
        status: story.status ?? 'DETECTADA',
        fingerprint: story.fingerprint,
        now,
      });
    }
    const ids = stories.map((story) => story.id);
    if (stories.length) {
      removeMissing.run(Number(competitionId), Number(season), String(round), ...ids);
    } else {
      db.prepare('DELETE FROM football_stories WHERE competition_id = ? AND season = ? AND round = ?')
        .run(Number(competitionId), Number(season), String(round));
    }
  })();
  return getFootballStories({competitionId, season, round});
};

export const getFootballStories = ({competitionId, season, round} = {}) =>
  getDb()
    .prepare(
      `SELECT * FROM football_stories
       WHERE competition_id = ? AND season = ? AND round = ?
       ORDER BY score DESC, title`
    )
    .all(Number(competitionId), Number(season), String(round))
    .map(mapStoryRow);

export const getFootballStory = ({storyId} = {}) => {
  const row = getDb().prepare('SELECT * FROM football_stories WHERE id = ?').get(String(storyId));
  return row ? mapStoryRow(row) : null;
};

export const updateFootballStoryStatus = ({storyId, status} = {}) => {
  const allowed = new Set(['DETECTADA', 'APROVADA', 'REJEITADA', 'CONTEUDO_GERADO', 'VIDEO_GERADO']);
  if (!allowed.has(status)) throw new Error(`Status de história inválido: ${status}`);
  const result = getDb().prepare('UPDATE football_stories SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, new Date().toISOString(), String(storyId));
  return result.changes > 0 ? getFootballStory({storyId}) : null;
};

const mapContentRow = (row) => {
  if (!row) return null;
  const content = jsonParse(row.content_json, {});
  return {...content, id: row.id, storyId: row.story_id, version: row.version, status: row.status, validation: jsonParse(row.validation_json, {})};
};

export const saveShortContent = (content, {validation = {}, status = content.status ?? 'GERADO'} = {}) => {
  const db = getDb();
  db.prepare(
    `INSERT INTO short_contents (
      id, story_id, version, competition_id, season, round, format, status,
      content_json, validation_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(story_id, version) DO UPDATE SET
      id = excluded.id, format = excluded.format, status = excluded.status,
      content_json = excluded.content_json, validation_json = excluded.validation_json,
      updated_at = excluded.updated_at`
  ).run(
    content.id,
    content.storyId,
    Number(content.version),
    Number.isFinite(Number(content.competitionId)) ? Number(content.competitionId) : null,
    Number.isFinite(Number(content.season)) ? Number(content.season) : null,
    content.round ?? null,
    content.formato ?? 'RESULTADO',
    status,
    jsonStringify(content),
    jsonStringify(validation),
    new Date().toISOString(),
    new Date().toISOString(),
  );
  return getShortContent({contentId: content.id});
};

export const getShortContent = ({contentId} = {}) => mapContentRow(getDb().prepare('SELECT * FROM short_contents WHERE id = ?').get(String(contentId)));

export const getLatestShortContent = ({storyId} = {}) => mapContentRow(getDb().prepare('SELECT * FROM short_contents WHERE story_id = ? ORDER BY version DESC LIMIT 1').get(String(storyId)));

export const listShortContents = ({storyId, limit = 20} = {}) => {
  const rows = storyId
    ? getDb().prepare('SELECT * FROM short_contents WHERE story_id = ? ORDER BY version DESC LIMIT ?').all(String(storyId), Number(limit))
    : getDb().prepare('SELECT * FROM short_contents ORDER BY updated_at DESC LIMIT ?').all(Number(limit));
  return rows.map(mapContentRow);
};

export const updateShortContent = ({contentId, content, validation, status} = {}) => {
  const existing = getShortContent({contentId});
  if (!existing) return null;
  const next = {...existing, ...content, id: existing.id, storyId: existing.storyId, version: existing.version, status: status ?? existing.status};
  return saveShortContent(next, {validation: validation ?? existing.validation, status: next.status});
};

const mapVisualCompositionRow = (row) => {
  if (!row) return null;
  const composition = jsonParse(row.composition_json, {});
  return {...composition, id: row.id, contentId: row.content_id, version: row.version, status: row.status, validation: jsonParse(row.validation_json, {})};
};

export const saveShortVisualComposition = (composition, {validation = {}, status = composition.status ?? 'COMPOSICAO_GERADA'} = {}) => {
  const db = getDb();
  db.prepare(
    `INSERT INTO short_visual_compositions (
      id, content_id, version, template, width, height, fps, duration_in_frames,
      status, composition_json, validation_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(content_id, version) DO UPDATE SET
      id = excluded.id, template = excluded.template, width = excluded.width,
      height = excluded.height, fps = excluded.fps, duration_in_frames = excluded.duration_in_frames,
      status = excluded.status, composition_json = excluded.composition_json,
      validation_json = excluded.validation_json, updated_at = excluded.updated_at`
  ).run(
    composition.id,
    composition.contentId,
    Number(composition.version),
    composition.template,
    Number(composition.width),
    Number(composition.height),
    Number(composition.fps),
    Number(composition.durationInFrames),
    status,
    jsonStringify(composition),
    jsonStringify(validation),
    new Date().toISOString(),
    new Date().toISOString(),
  );
  return getShortVisualComposition({compositionId: composition.id});
};

export const getShortVisualComposition = ({compositionId} = {}) => mapVisualCompositionRow(getDb().prepare('SELECT * FROM short_visual_compositions WHERE id = ?').get(String(compositionId)));

export const getLatestShortVisualComposition = ({contentId} = {}) => mapVisualCompositionRow(getDb().prepare('SELECT * FROM short_visual_compositions WHERE content_id = ? ORDER BY version DESC LIMIT 1').get(String(contentId)));

export const updateShortVisualComposition = ({compositionId, composition, validation, status} = {}) => {
  const current = getShortVisualComposition({compositionId});
  if (!current) return null;
  const next = {...current, ...composition, id: current.id, contentId: current.contentId, version: current.version, status: status ?? current.status};
  return saveShortVisualComposition(next, {validation: validation ?? current.validation, status: next.status});
};

export const compareTeams = ({leftTeamId, rightTeamId, season} = {}) => {
  const teamSummary = getDb().prepare(
    `SELECT t.api_team_id AS teamId, t.canonical_name AS team, t.logo_path AS logoPath,
      t.logo_url AS logoUrl, t.accent_color AS accentColor,
      s.league_id AS leagueId, l.name AS leagueName, s.season,
      s.rank, s.played, s.points, s.goals_for AS goalsFor,
      s.goals_against AS goalsAgainst, s.goal_difference AS goalDifference,
      ROUND(CASE WHEN s.played > 0 THEN (s.points * 100.0) / (s.played * 3) ELSE 0 END, 1) AS pointsPercentage
     FROM teams t
     LEFT JOIN standings_snapshots s ON s.team_id = t.api_team_id AND s.season = ? AND s.snapshot_key = 'latest'
     LEFT JOIN leagues l ON l.api_league_id = s.league_id
     WHERE t.api_team_id = ?
     ORDER BY s.captured_at DESC
     LIMIT 1`
  );
  return {
    left: teamSummary.get(Number(season), Number(leftTeamId)),
    right: teamSummary.get(Number(season), Number(rightTeamId)),
  };
};

export const compareLeagues = ({leftLeagueId, rightLeagueId, season, metric = 'goals'} = {}) => {
  const summary = getDb().prepare(
    `SELECT l.api_league_id AS leagueId, l.name AS leagueName, l.country,
      COALESCE(fx.fixtures, 0) AS fixtures,
      COALESCE(fx.goals, 0) AS goals,
      COALESCE(fx.goalsPerFixture, 0) AS goalsPerFixture,
      st.avgPoints AS avgPoints,
      st.avgPointsPercentage AS avgPointsPercentage
     FROM leagues l
     LEFT JOIN (
       SELECT league_id, season, COUNT(api_fixture_id) AS fixtures,
         SUM(COALESCE(home_score, 0) + COALESCE(away_score, 0)) AS goals,
         ROUND(CASE WHEN COUNT(api_fixture_id) > 0
           THEN SUM(COALESCE(home_score, 0) + COALESCE(away_score, 0)) * 1.0 / COUNT(api_fixture_id)
           ELSE 0 END, 2) AS goalsPerFixture
       FROM fixtures
       WHERE season = ?
       GROUP BY league_id, season
     ) fx ON fx.league_id = l.api_league_id
     LEFT JOIN (
       SELECT league_id, season, ROUND(AVG(points), 2) AS avgPoints,
         ROUND(AVG(CASE WHEN played > 0 THEN (points * 100.0) / (played * 3) ELSE NULL END), 1) AS avgPointsPercentage
       FROM standings_snapshots
       WHERE season = ? AND snapshot_key = 'latest'
       GROUP BY league_id, season
     ) st ON st.league_id = l.api_league_id
     WHERE l.api_league_id = ?
     LIMIT 1`
  );

  return {
    metric,
    left: summary.get(Number(season), Number(season), Number(leftLeagueId)),
    right: summary.get(Number(season), Number(season), Number(rightLeagueId)),
  };
};

export const compareTopScorers = ({leagueIds = [], season, limit = 10} = {}) => {
  const ids = leagueIds.map(Number).filter(Number.isFinite);
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  return getDb()
    .prepare(
      `SELECT pss.player_id AS playerId, pss.player_name AS playerName,
        pss.team_id AS teamId, pss.team_name AS team, pss.league_id AS leagueId,
        l.name AS leagueName, pss.season, pss.goals, pss.assists, pss.rating,
        t.logo_path AS logoPath, t.logo_url AS logoUrl, t.accent_color AS accentColor
       FROM player_season_stats pss
       LEFT JOIN leagues l ON l.api_league_id = pss.league_id
       LEFT JOIN teams t ON t.api_team_id = pss.team_id
       WHERE pss.season = ? AND pss.league_id IN (${placeholders})
       ORDER BY pss.goals DESC, COALESCE(pss.assists, 0) DESC, pss.player_name
       LIMIT ?`
    )
    .all(Number(season), ...ids, Number(limit));
};
