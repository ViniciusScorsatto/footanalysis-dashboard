const form = document.getElementById('longform-form');
const presetSelect = document.getElementById('preset-select');
const seasonInput = document.getElementById('season-input');
const roundSelect = document.getElementById('round-select');
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

const sampleYaml = `title: "Palpites da Rodada 12"
league: "Brasileirão Série A"
season: 2026
round: "Rodada 12"
outputName: "palpites-rodada-12.mp4"
openingLine1: "Hoje tem rodada cheia e eu separei os jogos que podem mexer na tabela."
openingLine2: "Agora vamos para os palpites, jogo por jogo, com o placar que eu apostaria."

matches:
  - homeTeam: "Palmeiras"
    awayTeam: "Flamengo"
    predictedScore: "2-1"
    homeAccentColor: "#27AE60"
    awayAccentColor: "#C0392B"
    voiceover: |
      Palmeiras chega forte em casa, mas o Flamengo tem qualidade para incomodar.
      Meu palpite é vitória apertada do Palmeiras, dois a um.

  - homeTeam: "Grêmio"
    awayTeam: "Santos"
    predictedScore: "1-1"
    homeAccentColor: "#2E86DE"
    awayAccentColor: "#f0f4f8"
    voiceover: |
      Jogo com cara de equilíbrio. O Grêmio deve pressionar, mas o Santos pode achar espaço.
      Para mim, empate em um a um.
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

const getSelectedPreset = () => {
  const option = presetSelect.selectedOptions?.[0];
  return {
    leagueId: Number(presetSelect.value),
    label: option?.textContent?.trim() || 'Campeonato',
  };
};

const getScoreForYaml = (fixture) => {
  const home = Number.isFinite(Number(fixture.homeScore)) ? Number(fixture.homeScore) : 0;
  const away = Number.isFinite(Number(fixture.awayScore)) ? Number(fixture.awayScore) : 0;
  return `${home}-${away}`;
};

const buildYamlFromFixtures = ({fixtures, leagueName, season, round}) => {
  const roundLabel = toPortugueseRoundLabel(round || 'Rodada');
  const outputSlug = toTitleCaseSlug(`${leagueName}-${roundLabel}-palpites-longform`);
  const lines = [
    `title: ${yamlQuote(`Palpites da ${roundLabel}`)}`,
    `league: ${yamlQuote(leagueName)}`,
    `leagueId: ${String(getSelectedPreset().leagueId)}`,
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
              <strong>${escapeHtml(match.homeTeam)} ${escapeHtml(match.predictedScore)} ${escapeHtml(match.awayTeam)}</strong>
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
    log(`Loaded ${rounds.length} rounds.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    roundSelect.innerHTML = '<option value="">Erro ao carregar rodadas</option>';
    setErrorBanner(message);
    log(message);
  } finally {
    setBusy(false);
  }
};

const generateYamlFromApi = async () => {
  const {leagueId, label} = getSelectedPreset();
  const season = Number(seasonInput.value);
  const round = roundSelect.value;

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
    });
    renderValidation(await postJson('/validate', {yamlText: yamlTextInput.value}));
    log(`YAML gerado com ${fixtures.length} jogos.`);
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
  if (currentJob?.leagueId) presetSelect.value = String(currentJob.leagueId);
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
  void loadRounds();
});
seasonInput.addEventListener('change', () => {
  roundSelect.innerHTML = '<option value="">Carregue as rodadas</option>';
  void loadRounds();
});

loadOptions();
