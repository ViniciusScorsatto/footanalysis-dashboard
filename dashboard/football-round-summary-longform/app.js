const form = document.getElementById('longform-form');
const channelProfileSelect = document.getElementById('channel-profile');
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
const applyPreviewButton = document.getElementById('apply-preview-button');
const openPreviewLink = document.getElementById('open-preview-link');
const previewFrame = document.getElementById('preview-frame');
const youtubeDraftOpenAiModelSelect = document.getElementById('youtube-draft-openai-model');
const youtubeDraftCopyModelInput = document.getElementById('youtube-draft-copy-model');
const youtubeDraftExtraContextInput = document.getElementById('youtube-draft-extra-context');
const generateYoutubeDraftButton = document.getElementById('generate-youtube-draft-button');
const copyYoutubeDraftJsonButton = document.getElementById('copy-youtube-draft-json-button');
const youtubeDraftStatus = document.getElementById('youtube-draft-status');
const youtubeDraftRoot = document.getElementById('youtube-draft-root');
const youtubeDraftModelChip = document.getElementById('youtube-draft-model-chip');
const youtubeChannelFooterCheckbox = document.getElementById('youtube-channel-footer');

const apiBase = '/api/football/round-summary-longform';
const footballApiBase = '/api/football';
const studioUrl = 'http://127.0.0.1:3000';
const COMPOSITION_ID = 'FootballRoundSummaryLong';
const previewKind = 'round-summary';
const englishLongformSoundtrackPath = '/audio/football/foot-analysis-whistle.mp3';
const portugueseLongformSoundtrackPath = '/audio/football/gol-na-pressao.mp3';
let teamAccentColors = {global: {}, leagues: {}};
let allLeaguePresets = [];
let currentYoutubeDraft = null;

const sampleYamlPt = `title: "Resumo da Rodada 12"
league: "Brasileirão Série A"
season: 2026
round: "Rodada 12"
outputName: "resumo-rodada-12.mp4"
openingLine1: "A rodada terminou com jogo grande, gols decisivos e detalhes que explicam muito mais do que o placar."
openingLine2: "Vamos passar partida por partida, olhando os números, os gols e os lances que mudaram cada jogo."

matches:
  - fixtureId: 1234567
    homeTeam: "Palmeiras"
    awayTeam: "Flamengo"
    homeAccentColor: "#27AE60"
    awayAccentColor: "#C0392B"
    voiceover: |
      Palmeiras e Flamengo fizeram uma partida decidida nos detalhes.
      O placar mostra o resultado, mas os números ajudam a entender onde o jogo mudou.

  - fixtureId: 1234568
    homeTeam: "Grêmio"
    awayTeam: "Santos"
    homeAccentColor: "#2E86DE"
    awayAccentColor: "#F0F4F8"
    voiceover: |
      Grêmio e Santos tiveram momentos diferentes dentro da partida.
      Vamos olhar os gols, os cartões e as estatísticas principais do empate.
`;

const sampleYamlEn = `title: "Matchday 12 Round Summary"
league: "Premier League"
leagueId: 39
season: 2026
round: "Matchday 12"
outputName: "premier-league-matchday-12-round-summary-longform.mp4"
openingLine1: "The matchday is complete, and the scorelines only tell part of the story."
openingLine2: "Let's go match by match through the goals, cards, numbers, and decisive moments."

matches:
  - fixtureId: 1234567
    homeTeam: "Arsenal"
    awayTeam: "Chelsea"
    homeAccentColor: "#EF0107"
    awayAccentColor: "#034694"
    voiceover: |
      Arsenal and Chelsea played a match decided by details.
      The scoreline gives the headline, but the numbers show where the match really turned.

  - fixtureId: 1234568
    homeTeam: "Liverpool"
    awayTeam: "Manchester City"
    homeAccentColor: "#C8102E"
    awayAccentColor: "#6CABDD"
    voiceover: |
      Liverpool and Manchester City traded momentum across different phases of the match.
      Use the goals, cards, and key stats to explain the full picture.
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
  channelProfileSelect.disabled = busy;
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
  payload.languageProfile = getLanguageProfile();
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

const getChannelProfile = () => channelProfileSelect.value === 'en' ? 'en' : 'pt';
const getLanguageProfile = () => getChannelProfile() === 'en' ? 'en' : 'pt-br';
const isEnglish = () => getLanguageProfile() === 'en';
const getSampleYaml = () => (isEnglish() ? sampleYamlEn : sampleYamlPt);
const getDefaultSoundtrackPath = () =>
  isEnglish() ? englishLongformSoundtrackPath : portugueseLongformSoundtrackPath;

const applyDefaultSoundtrackForChannel = () => {
  if ([...soundtrackSelect.options].some((option) => option.value === getDefaultSoundtrackPath())) {
    soundtrackSelect.value = getDefaultSoundtrackPath();
  }
};

const presetBelongsToChannel = (preset) =>
  preset?.leagueId && (!Array.isArray(preset.channels) || preset.channels.includes(getChannelProfile()));

const getDefaultLeagueId = () => (isEnglish() ? 39 : 71);

const sortPresetsForChannel = (presets) =>
  [...presets].sort((a, b) => {
    const preferred = getDefaultLeagueId();
    if (Number(a.leagueId) === preferred) return -1;
    if (Number(b.leagueId) === preferred) return 1;
    return String(a.label).localeCompare(String(b.label));
  });

const renderPresetOptions = (preferredLeagueId = getDefaultLeagueId()) => {
  const presets = sortPresetsForChannel(allLeaguePresets.filter(presetBelongsToChannel));
  presetSelect.innerHTML = presets
    .map(
      (preset) =>
        `<option value="${escapeHtml(String(preset.leagueId))}">${escapeHtml(preset.label)}</option>`
    )
    .join('');
  if (presets.some((preset) => String(preset.leagueId) === String(preferredLeagueId))) {
    presetSelect.value = String(preferredLeagueId);
  } else if (presets[0]) {
    presetSelect.value = String(presets[0].leagueId);
  }
};

const translateRoundLabel = (value) => {
  const label = String(value ?? '').trim();
  const regularSeasonMatch = label.match(/^regular season\s*-\s*(\d+)$/i);
  if (regularSeasonMatch) return isEnglish() ? `Matchday ${regularSeasonMatch[1]}` : `Rodada ${regularSeasonMatch[1]}`;
  return isEnglish() ? label : label.replace(/\bregular season\b/gi, 'Temporada regular');
};

const formatDateLabel = (dateKey) => {
  if (!dateKey) return isEnglish() ? 'All dates' : 'Todas as datas';
  const [year, month, day] = String(dateKey).split('-').map(Number);
  if (!year || !month || !day) return dateKey;

  return new Intl.DateTimeFormat(isEnglish() ? 'en-US' : 'pt-BR', {
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
    label: option?.textContent?.trim() || (isEnglish() ? 'League' : 'Campeonato'),
  };
};

const resetMatchDateSelect = (label = isEnglish() ? 'All dates' : 'Todas as datas') => {
  matchDateSelect.innerHTML = `<option value="">${escapeHtml(label)}</option>`;
};

const getSelectedMatchDates = () =>
  [...matchDateSelect.selectedOptions].some((option) => option.value === '')
    ? []
    : [...matchDateSelect.selectedOptions].map((option) => option.value).filter(Boolean);

const formatDateSelectionLabel = (dates) => {
  if (!dates.length) return '';
  if (dates.length === 1) return formatDateLabel(dates[0]);
  return isEnglish() ? `${dates.length} dates` : `${dates.length} datas`;
};

const formatDateSelectionSlug = (dates) => {
  if (!dates.length) return '';
  return dates.length <= 2 ? dates.join('-') : `${dates.length}-${isEnglish() ? 'dates' : 'datas'}`;
};

const buildYamlFromFixtures = ({fixtures, leagueName, season, round, matchDates = []}) => {
  const roundLabel = translateRoundLabel(round || (isEnglish() ? 'Matchday' : 'Rodada'));
  const dateSelectionLabel = formatDateSelectionLabel(matchDates);
  const dateTitle = dateSelectionLabel ? ` - ${dateSelectionLabel}` : '';
  const dateSlug = formatDateSelectionSlug(matchDates);
  const {leagueId} = getSelectedPreset();
  const outputSlug = toTitleCaseSlug(
    `${leagueName}-${roundLabel}${dateSlug ? `-${dateSlug}` : ''}-resumo-longform`
  );
  const lines = [
    `title: ${yamlQuote(isEnglish() ? `${roundLabel} Round Summary${dateTitle}` : `Resumo da ${roundLabel}${dateTitle}`)}`,
    `league: ${yamlQuote(leagueName)}`,
    `leagueId: ${String(leagueId)}`,
    `season: ${String(season)}`,
    `round: ${yamlQuote(roundLabel)}`,
    `outputName: ${yamlQuote(`${outputSlug || 'resumo-longform'}.mp4`)}`,
    `openingLine1: ${yamlQuote(isEnglish() ? 'The matchday is complete, and the scorelines only tell part of the story.' : 'A rodada terminou com jogo grande, gols decisivos e detalhes que explicam muito mais do que o placar.')}`,
    `openingLine2: ${yamlQuote(isEnglish() ? 'Let us go match by match through the goals, cards, numbers, and decisive moments.' : 'Vamos passar partida por partida, olhando os números, os gols e os lances que mudaram cada jogo.')}`,
    '',
    'matches:',
  ];

  for (const fixture of fixtures) {
    const scoreLabel = `${fixture.homeScore ?? 0}${isEnglish() ? ' to ' : ' a '}${fixture.awayScore ?? 0}`;
    lines.push(
      `  - fixtureId: ${String(fixture.fixtureId)}`,
      `    homeTeam: ${yamlQuote(fixture.homeTeam)}`,
      `    awayTeam: ${yamlQuote(fixture.awayTeam)}`,
      `    homeAccentColor: ${yamlQuote(resolveAccentColor(fixture.homeTeam, leagueId))}`,
      `    awayAccentColor: ${yamlQuote(resolveAccentColor(fixture.awayTeam, leagueId))}`,
      '    voiceover: |',
      `      ${fixture.homeTeam} ${isEnglish() ? 'and' : 'e'} ${fixture.awayTeam} ${isEnglish() ? 'finished' : 'terminaram em'} ${scoreLabel}.`,
      `      ${isEnglish() ? 'Use this space to narrate the match overview: context, turning point, and what the numbers say.' : 'Use este espaço para narrar o overview da partida: contexto, momento decisivo e leitura geral.'}`
    );
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
};

const buildYamlFromCurrentJob = (job) => {
  const matches = Array.isArray(job?.matches) ? job.matches : [];
  if (!job || job.template !== 'round-summary-long' || !matches.length) {
    return '';
  }

  const lines = [
    `title: ${yamlQuote(job.title ?? (isEnglish() ? 'Round Summary' : 'Resumo da Rodada'))}`,
    `league: ${yamlQuote(job.leagueName ?? '')}`,
    `leagueId: ${String(job.leagueId ?? getDefaultLeagueId())}`,
    `season: ${String(job.season ?? new Date().getFullYear())}`,
    `round: ${yamlQuote(job.roundLabel ?? '')}`,
    `outputName: ${yamlQuote(job.outputName ?? 'round-summary-longform.mp4')}`,
    ...(Array.isArray(job.openingLines) && job.openingLines[0]
      ? [`openingLine1: ${yamlQuote(job.openingLines[0])}`]
      : []),
    ...(Array.isArray(job.openingLines) && job.openingLines[1]
      ? [`openingLine2: ${yamlQuote(job.openingLines[1])}`]
      : []),
    '',
    'matches:',
  ];

  for (const match of matches) {
    lines.push(
      `  - fixtureId: ${String(match.fixtureId)}`,
      `    homeTeam: ${yamlQuote(match.homeTeam)}`,
      `    awayTeam: ${yamlQuote(match.awayTeam)}`,
      `    homeAccentColor: ${yamlQuote(match.homeBadge?.accentColor ?? resolveAccentColor(match.homeTeam, job.leagueId))}`,
      `    awayAccentColor: ${yamlQuote(match.awayBadge?.accentColor ?? resolveAccentColor(match.awayTeam, job.leagueId))}`,
      '    voiceover: |',
      `      ${String(match.voiceover ?? '').replace(/\n/g, '\n      ')}`
    );
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
};

const renderPreparedResults = (job) => {
  const matches = Array.isArray(job?.matches) ? job.matches : [];
  if (!matches.length) {
    renderValidation(null);
    return;
  }

  validationOutput.innerHTML = `
    <div class="longform-match-list">
      ${matches
        .map(
          (match, index) => `
            <div class="longform-match-row">
              <span>${index + 1}</span>
              <strong>
                <i class="accent-dot" style="--accent:${escapeHtml(match.homeBadge?.accentColor ?? '#F0A500')}"></i>
                ${escapeHtml(match.homeTeam ?? 'Home')}
                <b class="score-pill">${escapeHtml(String(match.homeScore ?? 0))}-${escapeHtml(String(match.awayScore ?? 0))}</b>
                ${escapeHtml(match.awayTeam ?? 'Away')}
                <i class="accent-dot" style="--accent:${escapeHtml(match.awayBadge?.accentColor ?? '#F0A500')}"></i>
              </strong>
              <small>${escapeHtml(match.statusLabel ?? 'FT')}</small>
            </div>
          `
        )
        .join('')}
    </div>
  `;
  dashboardQuickStatus.textContent = `${job.title ?? 'Resumo da rodada'} • ${matches.length} resultados • job preparado`;
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
                ${escapeHtml(match.homeTeam ?? `Fixture ${match.fixtureId}`)}
                ${match.awayTeam ? ` x ${escapeHtml(match.awayTeam)}` : ''}
                <i class="accent-dot" style="--accent:${escapeHtml(match.awayAccentColor ?? '#F0A500')}"></i>
              </strong>
              <small>${escapeHtml(String(match.voiceover ?? '').split(/\s+/).filter(Boolean).length)} words</small>
            </div>
          `
        )
        .join('')}
    </div>
  `;
  dashboardQuickStatus.textContent = `${validation.data.title ?? 'Resumo da rodada'} • ${matches.length} jogos • YAML válido`;
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

const buildStudioPreviewUrl = () => {
  const refreshToken = Date.now().toString();

  try {
    const url = new URL(studioUrl);
    const cleanPath = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
    url.pathname = `${cleanPath}/${encodeURIComponent(COMPOSITION_ID)}`;
    url.searchParams.set('codexPreviewTs', refreshToken);
    return url.toString();
  } catch {
    return `${studioUrl.replace(/\/+$/, '')}/${encodeURIComponent(COMPOSITION_ID)}?codexPreviewTs=${refreshToken}`;
  }
};

const updatePreview = () => {
  const previewUrl = `/football-longform-player/?kind=${encodeURIComponent(previewKind)}&previewTs=${Date.now()}`;
  previewFrame.src = 'about:blank';
  window.setTimeout(() => {
    previewFrame.src = previewUrl;
  }, 25);
  openPreviewLink.href = buildStudioPreviewUrl();
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

const joinList = (value) => (Array.isArray(value) ? value.join(', ') : String(value ?? ''));

const copyText = async (value) => {
  const text = String(value ?? '');
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
};

const youtubeDraftField = ({label, key, value, multiline = true}) => {
  const fieldValue = joinList(value);
  const escapedValue = escapeHtml(fieldValue);
  const control = multiline
    ? `<textarea data-youtube-key="${key}" rows="5">${escapedValue}</textarea>`
    : `<input data-youtube-key="${key}" type="text" value="${escapedValue}" />`;
  return `
    <label class="publishing-field">
      <span>${escapeHtml(label)}</span>
      ${control}
      <button type="button" class="copy-field-button secondary">Copy</button>
    </label>
  `;
};

const renderYoutubeDraft = (draft) => {
  currentYoutubeDraft = draft;
  copyYoutubeDraftJsonButton.disabled = !draft;

  if (!draft) {
    youtubeDraftRoot.innerHTML = '';
    return;
  }

  youtubeDraftRoot.innerHTML = `
    <div class="publishing-summary">
      <strong>Draft summary</strong>
      <p>${escapeHtml(draft.summary ?? '')}</p>
    </div>
    <section class="publishing-card publishing-platform-card">
      <div class="publishing-card-header">
        <h3>YouTube</h3>
        <span class="chip subtle">longform</span>
      </div>
      ${youtubeDraftField({label: 'Title', key: 'title', value: draft.youtube?.title, multiline: false})}
      ${youtubeDraftField({label: 'Description', key: 'description', value: draft.youtube?.description, multiline: true})}
      ${youtubeDraftField({label: 'Tags', key: 'tags', value: draft.youtube?.tags, multiline: true})}
      <div class="youtube-upload-box">
        <label class="publishing-field">
          <span>Privacy</span>
          <select id="youtube-privacy-status">
            <option value="private">Private</option>
            <option value="unlisted" selected>Unlisted</option>
            <option value="public">Public</option>
          </select>
        </label>
        <label class="toggle-row">
          <input type="checkbox" id="youtube-notify-subscribers" />
          <span>Publish to subscriptions feed and notify subscribers</span>
        </label>
        <label class="toggle-row">
          <input type="checkbox" id="youtube-paid-product-placement" />
          <span>My video contains paid promotion</span>
        </label>
        <button type="button" id="upload-youtube-button" class="secondary">Upload to YouTube</button>
        <p id="youtube-upload-status" class="publishing-status">Upload uses the rendered long-form MP4 and keeps manual review in YouTube Studio.</p>
      </div>
    </section>
  `;
};

const collectYoutubeDraftFromFields = () => {
  if (!currentYoutubeDraft) return null;
  const nextDraft = structuredClone(currentYoutubeDraft);
  youtubeDraftRoot.querySelectorAll('[data-youtube-key]').forEach((field) => {
    const key = field.dataset.youtubeKey;
    if (!nextDraft.youtube || !key) return;
    const rawValue = field.value ?? '';
    nextDraft.youtube[key] =
      key === 'tags'
        ? rawValue.split(',').map((item) => item.trim()).filter(Boolean)
        : rawValue;
  });
  return nextDraft;
};

const generateYoutubeDraft = async () => {
  try {
    generateYoutubeDraftButton.disabled = true;
    youtubeDraftStatus.textContent = 'Generating YouTube title, description, and tags...';
    const data = await postJson('/publishing/youtube-draft', {
      model: youtubeDraftOpenAiModelSelect?.value,
      copyModelInstructions: youtubeDraftCopyModelInput.value,
      extraContext: youtubeDraftExtraContextInput.value,
      includeChannelFooter: youtubeChannelFooterCheckbox?.checked === true,
    });

    if (youtubeDraftModelChip) {
      youtubeDraftModelChip.textContent = data.model ?? 'draft ready';
    }
    renderYoutubeDraft(data.draft);
    youtubeDraftStatus.textContent = 'YouTube draft ready. Review, edit, then copy.';
    log('YouTube draft generated.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    youtubeDraftStatus.textContent = message;
    log(message);
  } finally {
    generateYoutubeDraftButton.disabled = false;
  }
};

const uploadYoutubeDraft = async () => {
  const draft = collectYoutubeDraftFromFields();
  const youtube = draft?.youtube;
  if (!youtube) {
    youtubeDraftStatus.textContent = 'Generate a YouTube draft before uploading.';
    return;
  }

  const privacyStatus = document.getElementById('youtube-privacy-status')?.value ?? 'unlisted';
  const notifySubscribers = document.getElementById('youtube-notify-subscribers')?.checked ?? false;
  const hasPaidProductPlacement = document.getElementById('youtube-paid-product-placement')?.checked ?? false;
  const includeChannelFooter = youtubeChannelFooterCheckbox?.checked === true;

  try {
    const button = document.getElementById('upload-youtube-button');
    const uploadStatus = document.getElementById('youtube-upload-status');
    if (button) button.disabled = true;
    if (uploadStatus) uploadStatus.textContent = 'Uploading long-form video to YouTube...';
    youtubeDraftStatus.textContent = 'Uploading YouTube long-form video...';

    const data = await postJson('/publishing/youtube/upload', {
      youtube,
      privacyStatus,
      notifySubscribers,
      hasPaidProductPlacement,
      includeChannelFooter,
    });

    const link = data.youtube?.url
      ? `<a class="download-link" href="${escapeHtml(data.youtube.url)}" target="_blank" rel="noreferrer">Open video</a>`
      : '';
    if (uploadStatus) {
      uploadStatus.innerHTML = `Uploaded as ${escapeHtml(data.youtube?.privacyStatus ?? privacyStatus)}. ${link}`;
    }
    youtubeDraftStatus.textContent = 'YouTube upload completed.';
    log(`YouTube upload completed: ${data.youtube?.url ?? data.youtube?.videoId ?? 'uploaded'}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const uploadStatus = document.getElementById('youtube-upload-status');
    if (uploadStatus) uploadStatus.textContent = message;
    youtubeDraftStatus.textContent = message;
    log(message);
  } finally {
    const button = document.getElementById('upload-youtube-button');
    if (button) button.disabled = false;
  }
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
      languageProfile: getLanguageProfile(),
    });
    const response = await fetch(`${footballApiBase}/round-dates?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load round dates.');
    }

    const dates = data.dates ?? [];
    matchDateSelect.innerHTML = [
      `<option value="">${isEnglish() ? 'All dates' : 'Todas as datas'} (${dates.length || (isEnglish() ? 'full round' : 'rodada inteira')})</option>`,
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
    resetMatchDateSelect();
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
    log('Carregando resultados da rodada para gerar YAML...');
    const params = new URLSearchParams({
      leagueId: String(leagueId),
      season: String(season),
      round,
      languageProfile: getLanguageProfile(),
    });
    matchDates.forEach((matchDate) => params.append('matchDates', matchDate));
    const response = await fetch(`${footballApiBase}/result-fixtures?${params.toString()}`);
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
      `YAML de resumo gerado com ${fixtures.length} jogos${
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
    log('Preparando resumo da rodada e TTS por jogo...');
    const data = await postJson('/prepare', formDataToPayload());
    renderPreparedResults(data.job);
    renderCurrentJob(data.job);
    updatePreview();
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
    log('Renderizando resumo da rodada em MP4 horizontal...');
    const data = await postJson('/render', formDataToPayload());
    renderPreparedResults(data.job);
    renderCurrentJob(data.job);
    setRenderDownload(data.job, data.render);
    updatePreview();
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
  allLeaguePresets = data.leaguePresets ?? [];
  soundtrackSelect.innerHTML = (data.soundtrackPresets ?? [])
    .map((preset) => `<option value="${escapeHtml(preset.value)}">${escapeHtml(preset.label)}</option>`)
    .join('');

  const currentJob = data.currentJob;
  channelProfileSelect.value =
    currentJob?.channelProfile === 'en' || currentJob?.languageProfile === 'en' ? 'en' : 'pt';
  renderPresetOptions(currentJob?.leagueId ?? getDefaultLeagueId());
  yamlTextInput.value = buildYamlFromCurrentJob(currentJob);
  seasonInput.value = currentJob?.season ?? new Date().getFullYear();
  form.elements.brandName.value = currentJob?.brandName ?? 'Foot Analysis';
  form.elements.soundtrackVolume.value = currentJob?.soundtrackVolume ?? '0.92';
  soundtrackVolumeRange.value = form.elements.soundtrackVolume.value;
  if (currentJob?.soundtrackPath) {
    soundtrackSelect.value = currentJob.soundtrackPath;
  } else {
    applyDefaultSoundtrackForChannel();
  }
  renderCurrentJob(currentJob);
  renderPreparedResults(currentJob);
  updatePreview();
  setErrorBanner('');
  log('Dashboard resumo da rodada longform pronto.', true);
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
applyPreviewButton.addEventListener('click', updatePreview);
generateYoutubeDraftButton.addEventListener('click', generateYoutubeDraft);
copyYoutubeDraftJsonButton.addEventListener('click', async () => {
  const draft = collectYoutubeDraftFromFields();
  if (!draft) return;
  await copyText(JSON.stringify(draft, null, 2));
  youtubeDraftStatus.textContent = 'YouTube draft JSON copied.';
});
youtubeDraftRoot.addEventListener('click', async (event) => {
  if (event.target.closest('#upload-youtube-button')) {
    await uploadYoutubeDraft();
    return;
  }
  const button = event.target.closest('.copy-field-button');
  if (!button) return;
  const field = button.closest('.publishing-field')?.querySelector('textarea, input');
  await copyText(field?.value ?? '');
  youtubeDraftStatus.textContent = 'Field copied.';
});
loadRoundsButton.addEventListener('click', loadRounds);
generateYamlButton.addEventListener('click', generateYamlFromApi);
channelProfileSelect.addEventListener('change', () => {
  renderPresetOptions();
  yamlTextInput.value = getSampleYaml();
  applyDefaultSoundtrackForChannel();
  roundSelect.innerHTML = '<option value="">Carregue as rodadas</option>';
  resetMatchDateSelect();
  void loadRounds();
});
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
