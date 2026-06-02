const form = document.getElementById('longform-form');
const presetSelect = document.getElementById('preset-select');
const seasonInput = document.getElementById('season-input');
const roundSelect = document.getElementById('round-select');
const matchDateSelect = document.getElementById('match-date-select');
const loadRoundsButton = document.getElementById('load-rounds-button');
const generateYamlButton = document.getElementById('generate-yaml-button');
const yamlFileInput = document.getElementById('yaml-file');
const yamlTextInput = document.getElementById('yaml-text');
const soundtrackSelect = document.getElementById('soundtrack-select');
const soundtrackVolumeRange = document.getElementById('soundtrack-volume-range');
const validateButton = document.getElementById('validate-button');
const prepareButton = document.getElementById('prepare-button');
const renderButton = document.getElementById('render-button');
const validationOutput = document.getElementById('validation-output');
const currentJobRoot = document.getElementById('current-job');
const renderDownloadRoot = document.getElementById('render-download');
const logOutput = document.getElementById('log-output');
const errorBanner = document.getElementById('error-banner');
const errorBannerText = document.getElementById('error-banner-text');
const dashboardQuickStatus = document.getElementById('dashboard-quick-status');

const apiBase = '/api/football/longform';
const footballApiBase = '/api/football';
let teamAccentColors = {global: {}, leagues: {}};

const sampleYaml = `title: "Palpites da Rodada 1"
league: "Copa do Mundo"
leagueId: 1
season: 2026
round: "Rodada 1"
outputName: "palpites-copa-do-mundo-rodada-1.mp4"
openingLine1: "A Copa do Mundo começa com jogos grandes e margem pequena para erro."
openingLine2: "Agora vamos para os palpites, jogo por jogo, com o placar que eu apostaria."

matches:
  - homeTeam: "Brasil"
    awayTeam: "Alemanha"
    predictedScore: "2-1"
    homeAccentColor: "#009B3A"
    awayAccentColor: "#111111"
    voiceover: |
      Brasil chega com força ofensiva, mas a Alemanha sempre exige concentração.
      Meu palpite é vitória apertada do Brasil, dois a um.

  - homeTeam: "Argentina"
    awayTeam: "França"
    predictedScore: "2-2"
    homeAccentColor: "#6CACE4"
    awayAccentColor: "#0055A4"
    voiceover: |
      Argentina e França têm qualidade para controlar momentos diferentes do jogo.
      Para mim, empate em dois a dois, com chances claras para os dois lados.
`;

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const log = (message, replace = false) => {
  const timestamp = new Date().toLocaleTimeString();
  logOutput.textContent = replace
    ? `[${timestamp}] ${message}`
    : `${logOutput.textContent}\n[${timestamp}] ${message}`;
  logOutput.scrollTop = logOutput.scrollHeight;
};

const setBusy = (busy) => {
  validateButton.disabled = busy;
  prepareButton.disabled = busy;
  renderButton.disabled = busy;
  loadRoundsButton.disabled = busy;
  generateYamlButton.disabled = busy;
  presetSelect.disabled = busy;
  seasonInput.disabled = busy;
  roundSelect.disabled = busy;
  matchDateSelect.disabled = busy;
  yamlFileInput.disabled = busy;
  yamlTextInput.disabled = busy;
  soundtrackSelect.disabled = busy;
};

const setErrorBanner = (message) => {
  const normalized = String(message ?? '').trim();
  errorBanner.hidden = !normalized;
  errorBannerText.textContent = normalized;
};

const formDataToPayload = () => {
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.yamlText = yamlTextInput.value;
  return payload;
};

const yamlQuote = (value) => `"${String(value ?? '').replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;

const toTitleCaseSlug = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toPortugueseRoundLabel = (value) => {
  const label = String(value ?? '').trim();
  const regularSeasonMatch = label.match(/^regular season\s*-\s*(\d+)$/i);
  if (regularSeasonMatch) return `Rodada ${regularSeasonMatch[1]}`;
  return label.replace(/\bregular season\b/gi, 'Temporada regular');
};

const formatDateLabel = (dateKey) => {
  if (!dateKey) return 'Todas as datas';
  const [year, month, day] = String(dateKey).split('-').map(Number);
  if (!year || !month || !day) return dateKey;

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
};

const normalizeAccentKey = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const fallbackAccentPalette = [
  '#27AE60',
  '#C0392B',
  '#2E86DE',
  '#8E44AD',
  '#E67E22',
  '#1ABC9C',
  '#E74C3C',
  '#F39C12',
  '#3498DB',
  '#9B59B6',
];

const inferAccentColor = (teamName) => {
  const normalized = normalizeAccentKey(teamName);
  const hash = [...normalized].reduce((total, char) => total + char.charCodeAt(0), 0);
  return fallbackAccentPalette[hash % fallbackAccentPalette.length] ?? '#F0A500';
};

const resolveAccentColor = (teamName, leagueId) => {
  const key = normalizeAccentKey(teamName);
  const leagueAccents = teamAccentColors.leagues?.[String(leagueId)] ?? {};
  const globalAccents = teamAccentColors.global ?? {};

  return leagueAccents[key] ?? globalAccents[key] ?? inferAccentColor(teamName);
};

const getSelectedPreset = () => {
  const option = presetSelect.selectedOptions?.[0];
  return {
    leagueId: Number(presetSelect.value),
    label: option?.textContent?.trim() || 'Campeonato',
  };
};

const resetMatchDateSelect = (label = 'Todas as datas') => {
  matchDateSelect.innerHTML = `<option value="">${escapeHtml(label)}</option>`;
};

const getSelectedMatchDates = () =>
  [...matchDateSelect.selectedOptions].some((option) => option.value === '')
    ? []
    : [...matchDateSelect.selectedOptions].map((option) => option.value).filter(Boolean);

const formatDateSelectionLabel = (dates) => {
  if (!dates.length) return '';
  if (dates.length === 1) return formatDateLabel(dates[0]);
  return `${dates.length} datas`;
};

const formatDateSelectionSlug = (dates) => {
  if (!dates.length) return '';
  return dates.length <= 2 ? dates.join('-') : `${dates.length}-datas`;
};

const getScoreForYaml = (fixture) => {
  const home = Number.isFinite(Number(fixture.homeScore)) ? Number(fixture.homeScore) : 0;
  const away = Number.isFinite(Number(fixture.awayScore)) ? Number(fixture.awayScore) : 0;
  return `${home}-${away}`;
};

const buildYamlFromFixtures = ({fixtures, leagueName, season, round, matchDates = []}) => {
  const roundLabel = toPortugueseRoundLabel(round || 'Rodada');
  const dateSelectionLabel = formatDateSelectionLabel(matchDates);
  const dateTitle = dateSelectionLabel ? ` - ${dateSelectionLabel}` : '';
  const dateSlug = formatDateSelectionSlug(matchDates);
  const {leagueId} = getSelectedPreset();
  const outputSlug = toTitleCaseSlug(
    `${leagueName}-${roundLabel}${dateSlug ? `-${dateSlug}` : ''}-palpites-longform`
  );
  const lines = [
    `title: ${yamlQuote(`Palpites da ${roundLabel}${dateTitle}`)}`,
    `league: ${yamlQuote(leagueName)}`,
    `leagueId: ${String(leagueId)}`,
    `season: ${String(season)}`,
    `round: ${yamlQuote(roundLabel)}`,
    `outputName: ${yamlQuote(`${outputSlug || 'palpites-longform'}.mp4`)}`,
    `openingLine1: ${yamlQuote('Hoje tem rodada cheia e eu separei os jogos que podem mexer na tabela.')}`,
    `openingLine2: ${yamlQuote('Agora vamos para os palpites, jogo por jogo, com o placar que eu apostaria.')}`,
    '',
    'matches:',
  ];

  for (const fixture of fixtures) {
    lines.push(
      `  - homeTeam: ${yamlQuote(fixture.homeTeam)}`,
      `    awayTeam: ${yamlQuote(fixture.awayTeam)}`,
      `    predictedScore: ${yamlQuote(getScoreForYaml(fixture))}`,
      `    homeAccentColor: ${yamlQuote(resolveAccentColor(fixture.homeTeam, leagueId))}`,
      `    awayAccentColor: ${yamlQuote(resolveAccentColor(fixture.awayTeam, leagueId))}`,
      '    voiceover: |',
      `      ${fixture.homeTeam} contra ${fixture.awayTeam}.`,
      `      Meu palpite para esse jogo é ${getScoreForYaml(fixture).replace('-', ' a ')}.`
    );
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
};

const renderValidation = (validation) => {
  if (!validation) {
    validationOutput.textContent = 'Load a YAML roteiro to preview the match list.';
    return;
  }

  if (!validation.ok) {
    const errors = validation.errors ?? [validation.error ?? 'Invalid YAML.'];
    validationOutput.innerHTML = `
      <div class="longform-error-list">
        ${errors.map((error) => `<div>${escapeHtml(error)}</div>`).join('')}
      </div>
    `;
    dashboardQuickStatus.textContent = `${errors.length} validation issue(s) found.`;
    return;
  }

  const matches = validation.data?.matches ?? [];
  validationOutput.innerHTML = `
    <div class="longform-match-list">
      ${matches
        .map(
          (match, index) => `
            <div class="longform-match-row">
              <span>${index + 1}</span>
              <strong>
                <i class="accent-dot" style="--accent:${escapeHtml(match.homeAccentColor ?? '#F0A500')}"></i>
                ${escapeHtml(match.homeTeam)} ${escapeHtml(match.predictedScore)} ${escapeHtml(match.awayTeam)}
                <i class="accent-dot" style="--accent:${escapeHtml(match.awayAccentColor ?? '#F0A500')}"></i>
              </strong>
              <small>${escapeHtml(String(match.voiceover ?? '').split(/\s+/).filter(Boolean).length)} words</small>
            </div>
          `
        )
        .join('')}
    </div>
  `;
  dashboardQuickStatus.textContent = `${validation.data.title} • ${matches.length} jogos • YAML válido`;
};

const renderCurrentJob = (job) => {
  if (!job) {
    currentJobRoot.innerHTML = '';
    return;
  }

  currentJobRoot.innerHTML = `
    <div class="job-status-card">
      <div>
        <strong>${escapeHtml(job.title)} • ${escapeHtml(job.leagueName)}</strong>
        <span>${escapeHtml(job.outputName)} • ${job.matches?.length ?? 0} jogos • ${Math.round((job.durationInFrames ?? 0) / 30)}s</span>
      </div>
      <div class="job-status-meta">
        <span class="chip subtle">1920x1080</span>
        <span class="chip subtle">${escapeHtml(String(job.season))}</span>
      </div>
    </div>
  `;
};

const setRenderDownload = (job, render) => {
  if (!job || !render?.outputPath) {
    renderDownloadRoot.innerHTML = '';
    return;
  }

  const downloadPath = `/${render.outputPath
    .replace(/^\/+/, '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;

  renderDownloadRoot.innerHTML = `
    <div class="job-download-card">
      <div>
        <strong>MP4 pronto</strong>
        <span>${escapeHtml(job.outputName)}</span>
      </div>
      <a class="download-link" href="${downloadPath}" download>Download MP4</a>
    </div>
  `;
};

const postJson = async (path, payload) => {
  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    const message = data.error || data.errors?.join('\n') || 'Request failed.';
    const error = new Error(message);
    error.data = data;
    throw error;
  }
  return data;
};

const loadRounds = async () => {
  const {leagueId} = getSelectedPreset();
  const season = Number(seasonInput.value);

  if (!Number.isFinite(leagueId) || !Number.isFinite(season)) {
    setErrorBanner('Escolha campeonato e temporada para carregar as rodadas.');
    return;
  }

  try {
    setBusy(true);
    setErrorBanner('');
    roundSelect.innerHTML = '<option value="">Carregando rodadas...</option>';
    const params = new URLSearchParams({
      leagueId: String(leagueId),
      season: String(season),
    });
    const response = await fetch(`${footballApiBase}/rounds?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load rounds.');
    }

    const rounds = data.rounds ?? [];
    roundSelect.innerHTML = rounds.length
      ? rounds.map((round) => `<option value="${escapeHtml(round)}">${escapeHtml(round)}</option>`).join('')
      : '<option value="">Nenhuma rodada encontrada</option>';
    resetMatchDateSelect();
    if (rounds.length) {
      await loadRoundDates();
    }
    log(`Loaded ${rounds.length} rounds.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    roundSelect.innerHTML = '<option value="">Erro ao carregar rodadas</option>';
    resetMatchDateSelect('Erro ao carregar datas');
    setErrorBanner(message);
    log(message);
  } finally {
    setBusy(false);
  }
};

const loadRoundDates = async () => {
  const {leagueId} = getSelectedPreset();
  const season = Number(seasonInput.value);
  const round = roundSelect.value;

  if (!Number.isFinite(leagueId) || !Number.isFinite(season) || !round) {
    resetMatchDateSelect();
    return;
  }

  try {
    matchDateSelect.disabled = true;
    matchDateSelect.innerHTML = '<option value="">Carregando datas...</option>';
    const params = new URLSearchParams({
      leagueId: String(leagueId),
      season: String(season),
      round,
      languageProfile: 'pt-br',
    });
    const response = await fetch(`${footballApiBase}/round-dates?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load round dates.');
    }

    const dates = data.dates ?? [];
    matchDateSelect.innerHTML = [
      `<option value="">Todas as datas (${dates.length || 'rodada inteira'})</option>`,
      ...dates.map(
        (date, index) =>
          `<option value="${escapeHtml(date)}" ${index === 0 ? 'selected' : ''}>${escapeHtml(
            formatDateLabel(date)
          )} · ${escapeHtml(date)}</option>`
      ),
    ].join('');
    log(
      `Loaded ${dates.length} date(s) for selected round.${
        dates.length ? ` Selected ${dates[0]} by default.` : ''
      }`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    resetMatchDateSelect('Todas as datas');
    setErrorBanner(message);
    log(message);
  } finally {
    matchDateSelect.disabled = false;
  }
};

const generateYamlFromApi = async () => {
  const {leagueId, label} = getSelectedPreset();
  const season = Number(seasonInput.value);
  const round = roundSelect.value;
  const matchDates = getSelectedMatchDates();

  if (!Number.isFinite(leagueId) || !Number.isFinite(season) || !round) {
    setErrorBanner('Escolha campeonato, temporada e rodada antes de gerar o YAML.');
    return;
  }

  try {
    setBusy(true);
    setErrorBanner('');
    log('Carregando jogos da rodada para gerar YAML...');
    const params = new URLSearchParams({
      leagueId: String(leagueId),
      season: String(season),
      round,
      languageProfile: 'pt-br',
    });
    matchDates.forEach((matchDate) => params.append('matchDates', matchDate));
    const response = await fetch(`${footballApiBase}/prediction-fixtures?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load fixtures.');
    }

    const fixtures = data.fixtures ?? [];
    if (!fixtures.length) {
      throw new Error('Nenhum jogo encontrado para essa rodada.');
    }

    yamlTextInput.value = buildYamlFromFixtures({
      fixtures,
      leagueName: label,
      season,
      round: data.round || round,
      matchDates,
    });
    renderValidation(await postJson('/validate', {yamlText: yamlTextInput.value}));
    log(
      `YAML gerado com ${fixtures.length} jogos${
        matchDates.length ? ` em ${matchDates.join(', ')}` : ''
      }.`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setErrorBanner(message);
    log(message);
  } finally {
    setBusy(false);
  }
};

const validateYaml = async () => {
  try {
    setBusy(true);
    setErrorBanner('');
    const validation = await postJson('/validate', {yamlText: yamlTextInput.value});
    renderValidation(validation);
    log('YAML válido.');
    return validation;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    renderValidation(error.data ?? {ok: false, errors: [message]});
    setErrorBanner(message);
    log(message);
    return null;
  } finally {
    setBusy(false);
  }
};

const prepareJob = async () => {
  try {
    setBusy(true);
    setErrorBanner('');
    setRenderDownload(null, null);
    log('Preparando job e TTS por jogo...');
    const data = await postJson('/prepare', formDataToPayload());
    renderValidation(data.validation);
    renderCurrentJob(data.job);
    log(data.message || 'Job preparado.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setErrorBanner(message);
    log(message);
  } finally {
    setBusy(false);
  }
};

const renderVideo = async () => {
  try {
    setBusy(true);
    setErrorBanner('');
    setRenderDownload(null, null);
    log('Renderizando MP4 horizontal...');
    const data = await postJson('/render', formDataToPayload());
    renderValidation(data.validation);
    renderCurrentJob(data.job);
    setRenderDownload(data.job, data.render);
    log(data.message || 'Render completo.');
    if (data.render?.outputPath) log(`Arquivo renderizado: ${data.render.outputPath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setErrorBanner(message);
    log(message);
  } finally {
    setBusy(false);
  }
};

const loadOptions = async () => {
  const response = await fetch(`${apiBase}/options`);
  const data = await response.json();
  teamAccentColors = data.teamAccentColors ?? {global: {}, leagues: {}};
  presetSelect.innerHTML = (data.leaguePresets ?? [])
    .filter((preset) => preset.leagueId)
    .map(
      (preset) =>
        `<option value="${escapeHtml(String(preset.leagueId))}">${escapeHtml(preset.label)}</option>`
    )
    .join('');
  soundtrackSelect.innerHTML = (data.soundtrackPresets ?? [])
    .map((preset) => `<option value="${escapeHtml(preset.value)}">${escapeHtml(preset.label)}</option>`)
    .join('');

  const currentJob = data.currentJob;
  yamlTextInput.value = sampleYaml;
  seasonInput.value = currentJob?.season ?? new Date().getFullYear();
  presetSelect.value = '1';
  if (currentJob?.leagueId && String(currentJob.leagueId) === '1') {
    presetSelect.value = String(currentJob.leagueId);
  }
  form.elements.brandName.value = currentJob?.brandName ?? 'Foot Analysis';
  form.elements.soundtrackVolume.value = currentJob?.soundtrackVolume ?? '0.92';
  soundtrackVolumeRange.value = form.elements.soundtrackVolume.value;
  if (currentJob?.soundtrackPath) soundtrackSelect.value = currentJob.soundtrackPath;
  renderCurrentJob(currentJob);
  renderValidation(null);
  setErrorBanner('');
  log('Dashboard longform pronto.', true);
};

yamlFileInput.addEventListener('change', async () => {
  const file = yamlFileInput.files?.[0];
  if (!file) return;
  yamlTextInput.value = await file.text();
  await validateYaml();
});

soundtrackVolumeRange.addEventListener('input', () => {
  form.elements.soundtrackVolume.value = soundtrackVolumeRange.value;
});

form.elements.soundtrackVolume.addEventListener('input', () => {
  soundtrackVolumeRange.value = form.elements.soundtrackVolume.value || '0.92';
});

validateButton.addEventListener('click', validateYaml);
prepareButton.addEventListener('click', prepareJob);
renderButton.addEventListener('click', renderVideo);
loadRoundsButton.addEventListener('click', loadRounds);
generateYamlButton.addEventListener('click', generateYamlFromApi);
presetSelect.addEventListener('change', () => {
  roundSelect.innerHTML = '<option value="">Carregue as rodadas</option>';
  resetMatchDateSelect();
  void loadRounds();
});
seasonInput.addEventListener('change', () => {
  roundSelect.innerHTML = '<option value="">Carregue as rodadas</option>';
  resetMatchDateSelect();
  void loadRounds();
});
roundSelect.addEventListener('change', () => {
  void loadRoundDates();
});

loadOptions();
