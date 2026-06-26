import {
  buildStudioPreviewUrl,
  copyText,
  escapeHtml,
  formDataToObject,
  normalizeSelectedDates,
  normalizeStudioUrl,
  setNoticeStatus,
  slugifyOutputPart,
} from './helpers.js';

const form = document.getElementById('job-form');
const presetSelect = document.getElementById('preset');
const templateSelect = document.getElementById('template');
const channelProfileSelect = document.getElementById('channel-profile');
const languageProfileSelect = document.getElementById('language-profile');
const roundSelect = document.getElementById('round-select');
const matchDateSelect = document.getElementById('match-date-select');
const matchDateOptions = document.getElementById('match-date-options');
const matchDateSummary = document.getElementById('match-date-summary');
const generateShortCopyButton = document.getElementById('generate-short-copy-button');
const hookCtaStatus = document.getElementById('hook-cta-status');
const soundtrackSelect = document.getElementById('soundtrack-select');
const soundtrackVolumeRange = document.getElementById('soundtrack-volume-range');
const voiceoverEnabledCheckbox = document.querySelector(
  'input[type="checkbox"][name="voiceoverEnabled"]'
);
const prepareButton = document.getElementById('prepare-button');
const renderButton = document.getElementById('render-button');
const settingsToggleButton = document.getElementById('settings-toggle-button');
const settingsPanel = document.getElementById('settings-panel');
const settingsStatus = document.getElementById('settings-status');
const shortDurationsFps = document.getElementById('short-durations-fps');
const shortDurationMeta = document.getElementById('short-duration-meta');
const shortDurationList = document.getElementById('short-duration-list');
const saveShortDurationsButton = document.getElementById('save-short-durations-button');
const reloadShortDurationsButton = document.getElementById('reload-short-durations-button');
const shortDurationsStatus = document.getElementById('short-durations-status');
const logOutput = document.getElementById('log-output');
const currentJobRoot = document.getElementById('current-job');
const renderDownloadRoot = document.getElementById('render-download');
const templateChip = document.getElementById('job-template-chip');
const dashboardChannelChip = document.getElementById('dashboard-channel-chip');
const dashboardQuickStatus = document.getElementById('dashboard-quick-status');
const leaguePresetField = document.getElementById('league-preset-field');
const leagueCoreFields = document.getElementById('league-core-fields');
const dataSection = document.getElementById('data-section');
const editorSection = document.getElementById('editor-section');
const roundField = document.getElementById('round-field');
const matchDateField = document.getElementById('match-date-field');
const predictionEditorField = document.getElementById('prediction-editor-field');
const predictionEditorStatus = document.getElementById('prediction-editor-status');
const predictionEditorList = document.getElementById('prediction-editor-list');
const reloadPredictionsButton = document.getElementById('reload-predictions-button');
const resultEditorField = document.getElementById('result-editor-field');
const resultEditorStatus = document.getElementById('result-editor-status');
const resultEditorList = document.getElementById('result-editor-list');
const reloadResultsButton = document.getElementById('reload-results-button');
const standingsEditorField = document.getElementById('standings-editor-field');
const standingsEditorStatus = document.getElementById('standings-editor-status');
const standingsEditorList = document.getElementById('standings-editor-list');
const reloadStandingsButton = document.getElementById('reload-standings-button');
const worldCupStandingsEditorField = document.getElementById('world-cup-standings-editor-field');
const worldCupStandingsEditorStatus = document.getElementById('world-cup-standings-editor-status');
const worldCupStandingsEditorList = document.getElementById('world-cup-standings-editor-list');
const reloadWorldCupStandingsButton = document.getElementById('reload-world-cup-standings-button');
const seasonVerdictEditorField = document.getElementById('season-verdict-editor-field');
const seasonVerdictEditorStatus = document.getElementById('season-verdict-editor-status');
const seasonVerdictEditorList = document.getElementById('season-verdict-editor-list');
const reloadSeasonVerdictButton = document.getElementById('reload-season-verdict-button');
const tierlistEditorField = document.getElementById('tierlist-editor-field');
const tierlistEditorStatus = document.getElementById('tierlist-editor-status');
const tierlistEditorList = document.getElementById('tierlist-editor-list');
const reloadTierlistButton = document.getElementById('reload-tierlist-button');
const leagueOverrideFields = document.getElementById('league-override-fields');
const worldCupFields = document.getElementById('world-cup-fields');
const ctaField = document.getElementById('cta-field');
const championFinalFields = document.getElementById('champion-final-fields');
const championFinalSelect = document.getElementById('champion-final-select');
const championFinalStatus = document.getElementById('champion-final-status');
const reloadChampionFinalButton = document.getElementById('reload-champion-final-button');
const studioUrlInput = document.getElementById('studio-url');
const applyPreviewButton = document.getElementById('apply-preview-button');
const openPreviewLink = document.getElementById('open-preview-link');
const previewFrame = document.getElementById('preview-frame');
const publishingOpenAiModelSelect = document.getElementById('publishing-openai-model');
const publishingCopyModelInput = document.getElementById('publishing-copy-model');
const publishingExtraContextInput = document.getElementById('publishing-extra-context');
const generatePublishingButton = document.getElementById('generate-publishing-button');
const copyPublishingJsonButton = document.getElementById('copy-publishing-json-button');
const publishingStatus = document.getElementById('publishing-status');
const publishingMetadataRoot = document.getElementById('publishing-metadata');
const publishingDraftRoot = document.getElementById('publishing-draft-root');
const publishingModelChip = document.getElementById('publishing-model-chip');
let youtubeUploadStatusRoot = null;
let tiktokUploadStatusRoot = null;

const apiBase = '/api/football';
const NEXT_GAMES_TEMPLATE = 'next-games';
const CHAMPIONSHIP_PACE_TEMPLATE = 'championship-pace';
const RELEGATION_LINE_TEMPLATE = 'relegation-line';
const TIERLIST_TEMPLATE = 'tierlist';
const CONTINENTAL_GROUPS_TEMPLATE = 'continental-groups-standings';
const TOP_SCORERS_TEMPLATE = 'top-scorers';
const PLAYER_OF_ROUND_TEMPLATE = 'player-of-round';
const SEASON_FINAL_VERDICT_TEMPLATE = 'season-final-verdict';
const CHAMPION_FINAL_TEMPLATE = 'champion-final';
const WORLD_CUP_TEMPLATE = 'world-cup-group-standings';
const WORLD_CUP_KNOCKOUT_TEMPLATE = 'world-cup-knockout';
const WORLD_CUP_LEAGUE_ID = 1;
const STUDIO_URL_KEY = 'football-dashboard-studio-url';
const ROUND_TEMPLATES = new Set([
  'results',
  NEXT_GAMES_TEMPLATE,
  'predictions',
  CHAMPION_FINAL_TEMPLATE,
  PLAYER_OF_ROUND_TEMPLATE,
]);
const templateCompositionMap = {
  results: 'FootballResultsShort',
  [NEXT_GAMES_TEMPLATE]: 'FootballNextGamesShort',
  predictions: 'FootballPredictionsShort',
  standings: 'FootballStandingsShort',
  [SEASON_FINAL_VERDICT_TEMPLATE]: 'FootballSeasonFinalVerdictShort',
  [CHAMPION_FINAL_TEMPLATE]: 'FootballChampionFinalShort',
  [TOP_SCORERS_TEMPLATE]: 'FootballTopScorersShort',
  [PLAYER_OF_ROUND_TEMPLATE]: 'FootballPlayerOfRoundShort',
  [CHAMPIONSHIP_PACE_TEMPLATE]: 'FootballChampionshipPaceShort',
  [RELEGATION_LINE_TEMPLATE]: 'FootballRelegationLineShort',
  [TIERLIST_TEMPLATE]: 'FootballTierlistShort',
  [CONTINENTAL_GROUPS_TEMPLATE]: 'FootballContinentalGroupsShort',
  [WORLD_CUP_TEMPLATE]: 'FootballWorldCupGroupShort',
  [WORLD_CUP_KNOCKOUT_TEMPLATE]: 'FootballWorldCupKnockoutShort',
};

const normalizeSoundtrackVolume = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '0.20';
  }

  return Math.max(0, Math.min(1, numericValue)).toFixed(2);
};

const setSoundtrackVolume = (value) => {
  const normalizedValue = normalizeSoundtrackVolume(value);
  form.elements.soundtrackVolume.value = normalizedValue;
  if (soundtrackVolumeRange) {
    soundtrackVolumeRange.value = normalizedValue;
  }
};

const templateFieldVisibility = {
  results: {
    leaguePreset: true,
    leagueCore: true,
    round: true,
    matchDate: true,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  [NEXT_GAMES_TEMPLATE]: {
    leaguePreset: true,
    leagueCore: true,
    round: true,
    matchDate: true,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  predictions: {
    leaguePreset: true,
    leagueCore: true,
    round: true,
    matchDate: true,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  standings: {
    leaguePreset: true,
    leagueCore: true,
    round: false,
    matchDate: false,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  [SEASON_FINAL_VERDICT_TEMPLATE]: {
    leaguePreset: true,
    leagueCore: true,
    round: false,
    matchDate: false,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  [CHAMPION_FINAL_TEMPLATE]: {
    leaguePreset: true,
    leagueCore: true,
    round: true,
    matchDate: true,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  [TOP_SCORERS_TEMPLATE]: {
    leaguePreset: true,
    leagueCore: true,
    round: false,
    matchDate: false,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  [PLAYER_OF_ROUND_TEMPLATE]: {
    leaguePreset: true,
    leagueCore: true,
    round: true,
    matchDate: true,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  [CHAMPIONSHIP_PACE_TEMPLATE]: {
    leaguePreset: true,
    leagueCore: true,
    round: false,
    matchDate: false,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  [RELEGATION_LINE_TEMPLATE]: {
    leaguePreset: true,
    leagueCore: true,
    round: false,
    matchDate: false,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  [TIERLIST_TEMPLATE]: {
    leaguePreset: false,
    leagueCore: false,
    round: false,
    matchDate: false,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  [CONTINENTAL_GROUPS_TEMPLATE]: {
    leaguePreset: true,
    leagueCore: true,
    round: false,
    matchDate: false,
    leagueOverrides: true,
    worldCupFields: false,
    cta: true,
  },
  [WORLD_CUP_TEMPLATE]: {
    leaguePreset: false,
    leagueCore: false,
    round: false,
    matchDate: false,
    leagueOverrides: false,
    worldCupFields: true,
    cta: true,
  },
  [WORLD_CUP_KNOCKOUT_TEMPLATE]: {
    leaguePreset: false,
    leagueCore: false,
    round: false,
    matchDate: false,
    leagueOverrides: false,
    worldCupFields: false,
    cta: true,
  },
};

const getSelectedOptionLabel = (selectElement) =>
  selectElement?.selectedOptions?.[0]?.textContent?.trim() ?? '';

let lastAutoOutputName = '';
let lastAutoWorldCupCompetitionName = '';
let lastAutoWorldCupGroupLabel = '';
let lastAutoLeagueTitle = '';
let lastAutoSeason = '';
let hasCustomOutputName = false;
let hasCustomLeagueTitle = false;
let currentPredictionFixtures = [];
let currentResultFixtures = [];
let currentStandingRows = [];
let currentWorldCupStandingRows = [];
let currentChampionFinalRows = [];
let currentSeasonVerdictRows = [];
let currentTierlistTeams = [];
let cachedWorldCupGroups = null;
const cachedWorldCupStandingsPreview = new Map();
let lastPreparedJob = null;
let currentPublishingDraft = null;
let activePublishingPlatform = 'youtube';
let allLeaguePresets = [];
let allChannelProfiles = [];
let availableMatchDates = [];

const formatMatchDateParts = (dateValue) => {
  const [year, month, day] = String(dateValue).split('-').map(Number);

  if (!year || !month || !day) {
    return {
      title: String(dateValue),
      meta: 'Match date',
    };
  }

  const locale = languageProfileSelect.value === 'en' ? 'en-US' : 'pt-BR';
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = new Intl.DateTimeFormat(locale, {weekday: 'short', timeZone: 'UTC'})
    .format(date)
    .replace('.', '');
  const monthName = new Intl.DateTimeFormat(locale, {month: 'short', timeZone: 'UTC'})
    .format(date)
    .replace('.', '');

  return {
    title: locale === 'en-US' ? `${monthName} ${day}` : `${String(day).padStart(2, '0')} ${monthName}`,
    meta: weekday,
  };
};

const describeMatchDateSelection = (selectedDates) => {
  if (availableMatchDates.length === 0) {
    return 'Round dates will appear after choosing a round.';
  }

  if (selectedDates.length === 0) {
    return `All ${availableMatchDates.length} date${availableMatchDates.length === 1 ? '' : 's'} selected`;
  }

  if (selectedDates.length === 1) {
    return `1 date selected: ${selectedDates[0]}`;
  }

  return `${selectedDates.length} dates selected`;
};
const EUROPEAN_LEAGUE_IDS = new Set([39, 40, 140, 135, 78, 61, 2, 3]);
const UPCOMING_FIXTURE_TEMPLATES = new Set([NEXT_GAMES_TEMPLATE, 'predictions']);

const roundTranslations = {
  'pt-br': [
    {
      pattern: /^regular season\s*-\s*(\d+)$/i,
      format: (roundNumber) => `Rodada ${roundNumber}`,
    },
    {
      pattern: /^group stage\s*-\s*(\d+)$/i,
      format: (roundNumber) => `Fase de Grupos - ${roundNumber}`,
    },
    {
      pattern: /^round of\s+(\d+)$/i,
      format: (roundNumber) => `Fase de ${roundNumber}`,
    },
    {
      pattern: /^quarter-finals?$/i,
      format: () => 'Quartas de Final',
    },
    {
      pattern: /^semi-finals?$/i,
      format: () => 'Semifinal',
    },
    {
      pattern: /^final$/i,
      format: () => 'Final',
    },
  ],
  en: [],
};

const dashboardCopy = {
  'pt-br': {
    ctaOptions: {
      results: [
        'Qual foi o melhor jogo?',
        'Quem te surpreendeu?',
        'Qual placar mais te chamou atenção?',
        'Seu time foi bem ou mal?',
      ],
      [NEXT_GAMES_TEMPLATE]: [
        'Qual jogo você vai assistir?',
        'Quem vence essa rodada?',
        'Qual jogo promete mais?',
        'Onde vem a surpresa?',
      ],
      standings: [
        'Quem sobe e quem cai?',
        'Quem fica com a taça?',
        'A tabela está justa?',
        'Quem ainda pode reagir?',
      ],
      [SEASON_FINAL_VERDICT_TEMPLATE]: [
        'Seu time cumpriu o objetivo?',
        'Quem surpreendeu na temporada?',
        'Foi justo assim?',
        'Quem decepcionou mais?',
      ],
      [TOP_SCORERS_TEMPLATE]: [
        'Quem termina artilheiro?',
        'Quem passa o líder?',
        'Quem faz mais gols?',
        'Esse top 10 muda na próxima?',
      ],
      [PLAYER_OF_ROUND_TEMPLATE]: [
        'Quem foi o craque?',
        'Concorda com esse top 10?',
        'Quem merecia estar aí?',
        'Qual nota foi injusta?',
      ],
      [CHAMPIONSHIP_PACE_TEMPLATE]: [
        'Quem leva o título?',
        'Quem sustenta esse ritmo?',
        'Dá pra buscar o líder?',
        'Quem segue firme na briga?',
      ],
      [RELEGATION_LINE_TEMPLATE]: [
        'Quem cai esse ano?',
        'Quem escapa da degola?',
        'Quem reage a tempo?',
        'Quem está mais ameaçado?',
      ],
      [TIERLIST_TEMPLATE]: [
        'Concorda com essa lista?',
        'Quem ficou alto demais?',
        'Quem faltou nessa tierlist?',
        'Quem é o campeão pra você?',
      ],
      [CONTINENTAL_GROUPS_TEMPLATE]: [
        'Quem avança?',
        'Quem passa em primeiro?',
        'Quem segue vivo?',
        'Qual grupo está mais equilibrado?',
      ],
      predictions: [
        'Quem vence essa rodada?',
        'Qual jogo você crava?',
        'Vai dar zebra em qual jogo?',
        'Quem tropeça nessa rodada?',
      ],
      [WORLD_CUP_TEMPLATE]: [
        'Quem avança?',
        'Quem passa em 1º?',
        'Quem fica com a vaga?',
        'Quem se classifica?',
        'Quem surpreende nesse grupo?',
      ],
      [WORLD_CUP_KNOCKOUT_TEMPLATE]: [
        'Quem passa?',
        'Quem vai pra próxima fase?',
        'Qual zebra vem aí?',
        'Quem chega na final?',
      ],
    },
    worldCup: {
      title: (season) => `Copa do Mundo ${season}`,
      group: (letter) => `Grupo ${letter}`,
      cta: 'Quem avança?',
      output: (season, letter) => `copa-do-mundo-${season}-grupo-${String(letter).toLowerCase()}-pt-br.mp4`,
    },
  },
  en: {
    ctaOptions: {
      results: [
        'What was the best match?',
        'Who surprised you most?',
        'Which scoreline stood out?',
        'Did your team deliver?',
      ],
      [NEXT_GAMES_TEMPLATE]: [
        'Which match is must-watch?',
        'Who wins this round?',
        'Which fixture is the biggest?',
        'Where is the upset?',
      ],
      standings: [
        'Who wins this?',
        'Is it over?',
        'Can they catch them?',
        'Who is climbing late?',
      ],
      [SEASON_FINAL_VERDICT_TEMPLATE]: [
        'Did your team deliver?',
        'Who overachieved this season?',
        'Was this table fair?',
        'Who disappointed most?',
      ],
      [TOP_SCORERS_TEMPLATE]: [
        'Who finishes top scorer?',
        'Who catches the leader?',
        'Who scores next?',
        'Does this top 10 change?',
      ],
      [PLAYER_OF_ROUND_TEMPLATE]: [
        'Who was your MVP?',
        'Do you agree with this top 10?',
        'Who deserved a spot?',
        'Was this rating fair?',
      ],
      [CHAMPIONSHIP_PACE_TEMPLATE]: [
        'Who wins the title?',
        'Who can keep this pace?',
        'Can anyone catch the leader?',
        'Who stays in the race?',
      ],
      [RELEGATION_LINE_TEMPLATE]: [
        'Who goes down?',
        'Who escapes the drop?',
        'Who turns it around?',
        'Who is most in danger?',
      ],
      [TIERLIST_TEMPLATE]: [
        'Do you agree with this list?',
        'Who is too high?',
        'Who is missing here?',
        'Who wins it for you?',
      ],
      [CONTINENTAL_GROUPS_TEMPLATE]: [
        'Who goes through?',
        'Who tops the group?',
        'Which group is the toughest?',
        'Who is still alive here?',
      ],
      predictions: [
        'Who wins this round?',
        'Which match is your lock?',
        'Where is the upset coming?',
        'Who drops points next?',
      ],
      [WORLD_CUP_TEMPLATE]: [
        'Who advances?',
        'Who wins this group?',
        'Who takes the top spot?',
        'Who qualifies from here?',
        'Who is the dark horse?',
      ],
      [WORLD_CUP_KNOCKOUT_TEMPLATE]: [
        'Who goes through?',
        'Who reaches the next round?',
        'Where is the upset?',
        'Who makes the final?',
      ],
    },
    worldCup: {
      title: (season) => `World Cup ${season}`,
      group: (letter) => `Group ${letter}`,
      cta: 'Who advances?',
      output: (season, letter) => `world-cup-${season}-group-${String(letter).toLowerCase()}-en.mp4`,
    },
  },
};

const getCurrentChannelProfile = () => channelProfileSelect.value || 'pt';

const getChannelLanguageProfile = (channelProfile = getCurrentChannelProfile()) =>
  allChannelProfiles.find((profile) => profile.value === channelProfile)?.languageProfile ??
  (channelProfile === 'en' ? 'en' : 'pt-br');

const getPresetsForChannel = (channelProfile = getCurrentChannelProfile()) =>
  allLeaguePresets.filter((preset) => !preset.channels || preset.channels.includes(channelProfile));

const getDefaultSeasonForContext = ({
  channelProfile = getCurrentChannelProfile(),
  leagueId = form.elements.leagueId.value,
  template = templateSelect.value,
} = {}) => {
  if (
    template === WORLD_CUP_TEMPLATE ||
    template === WORLD_CUP_KNOCKOUT_TEMPLATE ||
    template === TIERLIST_TEMPLATE
  ) {
    return '2026';
  }

  const numericLeagueId = Number(leagueId);
  if (numericLeagueId === WORLD_CUP_LEAGUE_ID) {
    return '2026';
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const usesEuropeanSeason =
    channelProfile === 'en' || EUROPEAN_LEAGUE_IDS.has(numericLeagueId);

  return String(usesEuropeanSeason && currentMonth < 7 ? currentYear - 1 : currentYear);
};

const syncSeasonFromContext = ({force = false} = {}) => {
  const nextSeason = getDefaultSeasonForContext();
  const currentSeason = String(form.elements.season.value || '').trim();

  if (force || !currentSeason || currentSeason === lastAutoSeason) {
    form.elements.season.value = nextSeason;
  }

  lastAutoSeason = nextSeason;
};

const renderLeaguePresetOptions = (preferredLeagueId = form.elements.leagueId.value) => {
  const presets = getPresetsForChannel();
  const preferredValue =
    preferredLeagueId === null || preferredLeagueId === undefined ? '' : String(preferredLeagueId);

  presetSelect.innerHTML = presets
    .map((preset) => {
      const value = preset.leagueId === null ? '' : String(preset.leagueId);
      return `<option value="${value}">${preset.label}</option>`;
    })
    .join('');

  const availableValues = new Set(presets.map((preset) => (preset.leagueId === null ? '' : String(preset.leagueId))));
  if (availableValues.has(preferredValue)) {
    presetSelect.value = preferredValue;
  } else if (presets.length > 0) {
    presetSelect.value = presets[0].leagueId === null ? '' : String(presets[0].leagueId);
  } else {
    presetSelect.value = '';
  }

  form.elements.leagueId.value = presetSelect.value;
};

const syncLanguageFromChannel = () => {
  const nextLanguageProfile = getChannelLanguageProfile();
  languageProfileSelect.value = nextLanguageProfile;
  languageProfileSelect.disabled = true;
};

const setBusy = (busy) => {
  prepareButton.disabled = busy;
  renderButton.disabled = busy;
};

const startYouTubeOAuth = async (channel) => {
  try {
    setNoticeStatus(settingsStatus, `Preparing YouTube ${channel.toUpperCase()} consent link…`, 'warning');
    const response = await fetch(`${apiBase}/settings/youtube/oauth-url?channel=${encodeURIComponent(channel)}`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not create YouTube OAuth URL');
    }
    window.open(data.authUrl, '_blank', 'noopener,noreferrer');
    setNoticeStatus(settingsStatus, `Consent opened for ${channel.toUpperCase()}. Finish it in the new tab.`, 'success');
  } catch (error) {
    setNoticeStatus(settingsStatus, error instanceof Error ? error.message : String(error), 'error');
  }
};

const startTikTokOAuth = async (channel) => {
  try {
    setNoticeStatus(settingsStatus, `Preparing TikTok ${channel.toUpperCase()} consent link…`, 'warning');
    const response = await fetch(`${apiBase}/settings/tiktok/oauth-url?channel=${encodeURIComponent(channel)}`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not create TikTok OAuth URL');
    }
    window.open(data.authUrl, '_blank', 'noopener,noreferrer');
    setNoticeStatus(settingsStatus, `Consent opened for TikTok ${channel.toUpperCase()}. Finish it in the new tab.`, 'success');
  } catch (error) {
    setNoticeStatus(settingsStatus, error instanceof Error ? error.message : String(error), 'error');
  }
};

const renderShortDurations = (durations) => {
  const items = durations?.items ?? [];
  shortDurationsFps.textContent = `${durations?.fps ?? 30} fps`;
  shortDurationMeta.innerHTML = `
    <span>Teaser: <strong>${escapeHtml(durations?.opening?.teaserFrames ?? '')}</strong></span>
    <span>Intro: <strong>${escapeHtml(durations?.opening?.introFrames ?? '')}</strong></span>
    <span>Minimum: <strong>${escapeHtml(durations?.minimumTotalFrames ?? '')}</strong></span>
    <span>Default content: <strong>${escapeHtml(durations?.defaultContentFrames ?? '')}</strong></span>
  `;

  if (!items.length) {
    shortDurationList.innerHTML = '<tr><td colspan="3">No short templates found.</td></tr>';
    return;
  }

  shortDurationList.innerHTML = items
    .map(
      (item) => `
        <tr>
          <td>
            <div class="short-duration-template">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(item.compositionId)}</span>
            </div>
          </td>
          <td>
            <input
              type="number"
              class="short-duration-input"
              data-composition-id="${escapeHtml(item.compositionId)}"
              min="1"
              step="1"
              value="${escapeHtml(item.contentFrames)}"
              aria-label="${escapeHtml(item.label)} content frames"
            />
          </td>
          <td class="short-duration-total">${escapeHtml(item.totalFrames)}</td>
        </tr>
      `
    )
    .join('');
};

const loadShortDurations = async () => {
  try {
    saveShortDurationsButton.disabled = true;
    reloadShortDurationsButton.disabled = true;
    setNoticeStatus(shortDurationsStatus, 'Loading short durations…', 'warning');
    const response = await fetch(`${apiBase}/short-durations`);
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load short durations.');
    }
    renderShortDurations(data.durations);
    setNoticeStatus(shortDurationsStatus, 'Durations loaded from config/football-short-durations.json.', 'success');
  } catch (error) {
    setNoticeStatus(shortDurationsStatus, error instanceof Error ? error.message : String(error), 'error');
  } finally {
    saveShortDurationsButton.disabled = false;
    reloadShortDurationsButton.disabled = false;
  }
};

const collectShortDurationUpdates = () => {
  const updates = {};
  for (const input of shortDurationList.querySelectorAll('.short-duration-input')) {
    const rawValue = input.value.trim();
    const numericValue = Number(rawValue);
    if (!rawValue || !Number.isInteger(numericValue) || numericValue <= 0) {
      throw new Error('All content frame values must be positive integers.');
    }
    updates[input.dataset.compositionId] = numericValue;
  }
  return updates;
};

const saveShortDurations = async () => {
  try {
    saveShortDurationsButton.disabled = true;
    reloadShortDurationsButton.disabled = true;
    setNoticeStatus(shortDurationsStatus, 'Saving short durations…', 'warning');
    const response = await fetch(`${apiBase}/short-durations`, {
      method: 'PUT',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({contentFramesByComposition: collectShortDurationUpdates()}),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not save short durations.');
    }
    renderShortDurations(data.durations);
    setNoticeStatus(shortDurationsStatus, data.message || 'Short durations saved.', 'success');
  } catch (error) {
    setNoticeStatus(shortDurationsStatus, error instanceof Error ? error.message : String(error), 'error');
  } finally {
    saveShortDurationsButton.disabled = false;
    reloadShortDurationsButton.disabled = false;
  }
};

const log = (message, replace = false) => {
  const timestamp = new Date().toLocaleTimeString();
  logOutput.textContent = replace ? `[${timestamp}] ${message}` : `${logOutput.textContent}\n[${timestamp}] ${message}`;
  logOutput.scrollTop = logOutput.scrollHeight;
};

const buildJobPayloadFromForm = () => {
  const payload = formDataToObject(form);
  // languageProfile select is disabled in UI, so inject it explicitly.
  payload.languageProfile = languageProfileSelect.value || getChannelLanguageProfile();
  payload.channelProfile = channelProfileSelect.value || getCurrentChannelProfile();
  payload.roundLabel = normalizeLabelForLanguage(
    payload.template,
    payload.roundLabel,
    payload.languageProfile
  );
  payload.matchDates = getSelectedMatchDates();

  if (templateSelect.value === 'predictions') {
    payload.predictionEdits = getPredictionEdits();
  }
  if (templateSelect.value === 'results' || templateSelect.value === CHAMPION_FINAL_TEMPLATE) {
    payload.fixtureEdits = getFixtureEdits();
  }
  if (templateSelect.value === CHAMPION_FINAL_TEMPLATE) {
    payload.championFinalSelection = getChampionFinalSelection();
  }
  if (templateSelect.value === 'standings') {
    payload.standingEdits = getStandingEdits();
  }
  if (templateSelect.value === WORLD_CUP_TEMPLATE) {
    payload.worldCupStandingEdits = getWorldCupStandingEdits();
  }
  if (templateSelect.value === SEASON_FINAL_VERDICT_TEMPLATE) {
    payload.seasonFinalVerdictEdits = getSeasonFinalVerdictEdits();
  }
  if (templateSelect.value === TIERLIST_TEMPLATE) {
    payload.tierlistSelections = getTierlistSelections();
  }

  return payload;
};

const getSelectedMatchDates = () => normalizeSelectedDates(matchDateSelect.value);

const getMatchDateSelectionLabel = () => {
  const selectedDates = getSelectedMatchDates();

  if (selectedDates.length === 0) {
    return '';
  }

  if (selectedDates.length <= 2) {
    return selectedDates.join(' + ');
  }

  return `${selectedDates.length} dates`;
};

const translateRoundName = (round, languageProfile = 'pt-br') => {
  const normalizedRound = String(round ?? '').trim();
  const translations = roundTranslations[languageProfile] ?? [];

  for (const translation of translations) {
    const match = normalizedRound.match(translation.pattern);
    if (match) {
      return translation.format(...match.slice(1));
    }
  }

  return normalizedRound;
};

const deriveRoundLabel = (template, round, languageProfile = 'pt-br') => {
  const translatedRound = translateRoundName(round, languageProfile);

  if (!translatedRound) {
    return '';
  }

  if (languageProfile === 'en') {
    return template === 'predictions'
      ? `Predictions - ${translatedRound}`
      : template === NEXT_GAMES_TEMPLATE
        ? `Fixtures - ${translatedRound}`
      : template === PLAYER_OF_ROUND_TEMPLATE
        ? `Round MVPs · ${translatedRound}`
      : translatedRound;
  }

  if (template === 'predictions') {
    return `Palpites da ${translatedRound}`;
  }

  if (template === NEXT_GAMES_TEMPLATE) {
    return `Próximos Jogos · ${translatedRound}`;
  }

  if (template === PLAYER_OF_ROUND_TEMPLATE) {
    return `Rodada dos Craques · ${translatedRound}`;
  }

  return translatedRound;
};

const normalizeLabelForLanguage = (template, label, languageProfile = 'pt-br') => {
  const rawLabel = String(label ?? '').trim();
  const normalized = rawLabel
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  if (
    template === 'standings' &&
    ['current table', 'classificacao atual', 'classificacao', 'tabela', 'tabela atual'].includes(
      normalized
    )
  ) {
    return '';
  }

  if (languageProfile !== 'en') {
    return rawLabel;
  }

  return rawLabel;
};

const syncLeagueTitleFromPreset = () => {
  const selectedPreset = presetSelect.selectedOptions?.[0];
  const leagueTitle = selectedPreset?.textContent?.trim() ?? '';

  if (leagueTitle && presetSelect.value && !hasCustomLeagueTitle) {
    form.elements.leagueName.value = leagueTitle;
  }

  if (leagueTitle && presetSelect.value) {
    lastAutoLeagueTitle = leagueTitle;
  }
};

const getTemplateOutputSlug = () => {
  const template = templateSelect.value;
  const languageProfile = languageProfileSelect.value || 'pt-br';

  if (languageProfile === 'en') {
    return (
      {
        results: 'results',
        [NEXT_GAMES_TEMPLATE]: 'fixtures',
        predictions: 'predictions',
        standings: 'standings',
        [SEASON_FINAL_VERDICT_TEMPLATE]: 'season-wrap-up',
        [CHAMPION_FINAL_TEMPLATE]: 'champions',
        [TOP_SCORERS_TEMPLATE]: 'top-scorers',
        [PLAYER_OF_ROUND_TEMPLATE]: 'player-of-round',
        [CHAMPIONSHIP_PACE_TEMPLATE]: 'championship-pace',
        [RELEGATION_LINE_TEMPLATE]: 'relegation-line',
        [TIERLIST_TEMPLATE]: 'tierlist',
        [CONTINENTAL_GROUPS_TEMPLATE]: 'continental-groups',
        [WORLD_CUP_TEMPLATE]: 'world-cup-group',
        [WORLD_CUP_KNOCKOUT_TEMPLATE]: 'world-cup-knockout',
      }[template] ?? template
    );
  }

  return (
      {
        results: 'resultados',
        [NEXT_GAMES_TEMPLATE]: 'proximos-jogos',
        predictions: 'palpites',
        standings: 'classificacao',
        [SEASON_FINAL_VERDICT_TEMPLATE]: 'resumo-final',
        [CHAMPION_FINAL_TEMPLATE]: 'campeao',
        [TOP_SCORERS_TEMPLATE]: 'artilheiros',
        [PLAYER_OF_ROUND_TEMPLATE]: 'craque-da-rodada',
        [CHAMPIONSHIP_PACE_TEMPLATE]: 'ritmo-de-campeao',
        [RELEGATION_LINE_TEMPLATE]: 'linha-do-rebaixamento',
        [TIERLIST_TEMPLATE]: 'tierlist',
        [CONTINENTAL_GROUPS_TEMPLATE]: 'grupos',
        [WORLD_CUP_TEMPLATE]: 'grupo-da-copa',
        [WORLD_CUP_KNOCKOUT_TEMPLATE]: 'mata-mata-da-copa',
      }[template] ?? template
  );
};

const buildAutoOutputName = () => {
  const template = templateSelect.value;
  const languageProfile = languageProfileSelect.value || 'pt-br';
  const season = form.elements.season.value.trim() || '2026';

  if (template === WORLD_CUP_TEMPLATE) {
    const competitionName =
      form.elements.competitionName.value.trim() ||
      dashboardCopy[languageProfile]?.worldCup?.title(season) ||
      `World Cup ${season}`;
    const groupLabel =
      dashboardCopy[languageProfile]?.worldCup?.group(
        (form.elements.groupLetter.value || 'A').toUpperCase()
      ) ?? 'Group A';

    return [
      slugifyOutputPart(competitionName),
      slugifyOutputPart(groupLabel),
      slugifyOutputPart(languageProfile),
    ]
      .filter(Boolean)
      .join('-')
      .concat('.mp4');
  }

  if (template === WORLD_CUP_KNOCKOUT_TEMPLATE) {
    const title =
      dashboardCopy[languageProfile]?.worldCup?.title(season) ||
      `World Cup ${season}`;
    const phaseSlug =
      languageProfile === 'en' ? 'knockout' : 'mata-mata';

    return [slugifyOutputPart(title), slugifyOutputPart(phaseSlug), slugifyOutputPart(languageProfile)]
      .filter(Boolean)
      .join('-')
      .concat('.mp4');
  }

  if (
    template === CONTINENTAL_GROUPS_TEMPLATE ||
    template === SEASON_FINAL_VERDICT_TEMPLATE ||
    template === CHAMPION_FINAL_TEMPLATE ||
    template === TOP_SCORERS_TEMPLATE ||
    template === CHAMPIONSHIP_PACE_TEMPLATE ||
    template === RELEGATION_LINE_TEMPLATE ||
    template === TIERLIST_TEMPLATE
  ) {
    const leagueName =
      form.elements.leagueName.value.trim() ||
      presetSelect.selectedOptions?.[0]?.textContent?.trim() ||
      `League ${form.elements.leagueId.value || 'Custom'}`;

    return [
      slugifyOutputPart(leagueName),
      slugifyOutputPart(season),
      slugifyOutputPart(getTemplateOutputSlug()),
      slugifyOutputPart(languageProfile),
    ]
      .filter(Boolean)
      .join('-')
      .concat('.mp4');
  }

  const leagueName =
    form.elements.leagueName.value.trim() ||
    presetSelect.selectedOptions?.[0]?.textContent?.trim() ||
    `League ${form.elements.leagueId.value || 'Custom'}`;

  return [
    slugifyOutputPart(leagueName),
    slugifyOutputPart(season),
    slugifyOutputPart(getTemplateOutputSlug()),
    slugifyOutputPart(roundSelect.value),
    slugifyOutputPart(getMatchDateSelectionLabel()),
    slugifyOutputPart(languageProfile),
  ]
    .filter(Boolean)
    .join('-')
    .concat('.mp4');
};

const syncOutputNameFromSelections = () => {
  const outputNameField = form.elements.outputName;
  const nextAutoOutputName = buildAutoOutputName();

  outputNameField.placeholder = nextAutoOutputName;

  if (
    !hasCustomOutputName ||
    !outputNameField.value.trim() ||
    outputNameField.value === lastAutoOutputName
  ) {
    outputNameField.value = nextAutoOutputName;
    hasCustomOutputName = false;
  }

  lastAutoOutputName = nextAutoOutputName;
};

const syncRoundLabelFromRound = () => {
  const template = templateSelect.value;
  if (!ROUND_TEMPLATES.has(template)) {
    return;
  }

  form.elements.roundLabel.value = deriveRoundLabel(
    template,
    roundSelect.value,
    languageProfileSelect.value || 'pt-br'
  );
};

const clearRoundLabelOverride = () => {
  form.elements.roundLabel.value = '';
};

const formatSeasonDisplay = (season, languageProfile = languageProfileSelect.value || 'pt-br') => {
  const numericSeason = Number(season);

  if (languageProfile === 'en' && Number.isFinite(numericSeason)) {
    return `${numericSeason}/${String(numericSeason + 1).slice(-2)}`;
  }

  return String(season);
};

const getLeagueTitleForIntro = () => {
  const season = form.elements.season.value || '2026';
  const seasonDisplay = formatSeasonDisplay(season);
  const leagueName =
    form.elements.leagueName.value.trim() ||
    presetSelect.selectedOptions?.[0]?.textContent?.trim() ||
    `League ${form.elements.leagueId.value || 'Custom'}`;

  return leagueName.includes(season) || leagueName.includes(seasonDisplay)
    ? leagueName
    : `${leagueName} ${seasonDisplay}`;
};

const getAutoIntroCopy = () => {
  const template = templateSelect.value;
  const languageProfile = languageProfileSelect.value || 'pt-br';
  const season = form.elements.season.value || '2026';
  const seasonDisplay = formatSeasonDisplay(season, languageProfile);
  const leagueTitle = getLeagueTitleForIntro();
  const leagueWithoutSeason = leagueTitle
    .replace(new RegExp(`\\s+${season}$`), '')
    .replace(new RegExp(`\\s+${seasonDisplay.replace('/', '\\/')}$`), '')
    .trim();
  const groupLetter = (form.elements.groupLetter.value || 'A').toUpperCase();
  const isEnglish = languageProfile === 'en';

  const worldCupTitle = isEnglish ? `World Cup ${season}` : `Copa do Mundo ${season}`;
  const worldCupGroup = isEnglish ? `Group ${groupLetter}` : `Grupo ${groupLetter}`;
  const getPtCompetitionArticle = (competitionName) =>
    /^brasileir[ãa]o\b/i.test(competitionName) ? 'do' : 'da';
  const ptCompetition = `${getPtCompetitionArticle(leagueWithoutSeason)} ${leagueWithoutSeason}`;
  const withPtIntro = (subject) => `Fala Galera, pra vocês... ${subject}.`;
  const voiceoverByTemplate = {
    results: isEnglish
      ? `Latest ${leagueWithoutSeason} results`
      : withPtIntro(`os últimos resultados ${ptCompetition}`),
    [NEXT_GAMES_TEMPLATE]: isEnglish
      ? `Upcoming ${leagueWithoutSeason} fixtures`
      : withPtIntro(`os próximos jogos ${ptCompetition}`),
    predictions: isEnglish
      ? `${leagueWithoutSeason} predictions`
      : withPtIntro(`os palpites ${ptCompetition}`),
    standings: isEnglish
      ? `${leagueWithoutSeason} standings`
      : withPtIntro(`a classificação ${ptCompetition}`),
    [SEASON_FINAL_VERDICT_TEMPLATE]: isEnglish
      ? `${leagueWithoutSeason} season wrap-up`
      : withPtIntro(`o resumo final ${ptCompetition}`),
    [CHAMPION_FINAL_TEMPLATE]: isEnglish
      ? `${leagueWithoutSeason} champions`
      : withPtIntro(`o campeão ${ptCompetition}`),
    [TOP_SCORERS_TEMPLATE]: isEnglish
      ? `${leagueWithoutSeason} top scorers`
      : withPtIntro(`os artilheiros ${ptCompetition}`),
    [PLAYER_OF_ROUND_TEMPLATE]: isEnglish
      ? `${leagueWithoutSeason} player of the round`
      : withPtIntro(`o craque da rodada ${ptCompetition}`),
    [CHAMPIONSHIP_PACE_TEMPLATE]: isEnglish
      ? `Title pace in the ${leagueWithoutSeason}`
      : withPtIntro(`o ritmo de campeão ${ptCompetition}`),
    [RELEGATION_LINE_TEMPLATE]: isEnglish
      ? `Relegation line in the ${leagueWithoutSeason}`
      : withPtIntro(`a linha do rebaixamento ${ptCompetition}`),
    [TIERLIST_TEMPLATE]: isEnglish
      ? `${worldCupTitle} favorites tierlist`
      : withPtIntro(`a tierlist de favoritos da ${worldCupTitle}`),
    [CONTINENTAL_GROUPS_TEMPLATE]: isEnglish
      ? `${leagueWithoutSeason} group standings`
      : withPtIntro(`a tabela dos grupos ${ptCompetition}`),
    [WORLD_CUP_TEMPLATE]: isEnglish
      ? `${worldCupGroup} at the ${worldCupTitle}`
      : withPtIntro(`${worldCupGroup} da ${worldCupTitle}`),
    [WORLD_CUP_KNOCKOUT_TEMPLATE]: isEnglish
      ? `${worldCupTitle} knockout stage`
      : withPtIntro(`o mata-mata da ${worldCupTitle}`),
  };

  return {
    introTitle:
      template === WORLD_CUP_TEMPLATE || template === WORLD_CUP_KNOCKOUT_TEMPLATE
        || template === TIERLIST_TEMPLATE
        ? worldCupTitle
        : leagueTitle,
    voiceoverText: voiceoverByTemplate[template] ?? leagueTitle,
  };
};

const syncIntroPlaceholders = () => {
  const autoCopy = getAutoIntroCopy();
  form.elements.introTitle.placeholder = autoCopy.introTitle || 'Auto';
  form.elements.hookText.placeholder = 'Auto or generate with AI';
  form.elements.voiceoverText.placeholder = autoCopy.voiceoverText || 'Auto';
};

const clearIntroOverrides = () => {
  form.elements.ctaText.value = '';
  form.elements.introTitle.value = '';
  form.elements.hookText.value = '';
  form.elements.voiceoverText.value = '';
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
    <div class="job-status-line job-render-line">
      <span class="ds-chip ds-chip--success status-chip success">render</span>
      <div class="job-status-copy">
        <strong>Render ready</strong>
        <span>${escapeHtml(job.outputName)}</span>
      </div>
      <a class="download-link" href="${downloadPath}" download>Download MP4</a>
    </div>
  `;
};

const joinList = (value) => (Array.isArray(value) ? value.join(', ') : String(value ?? ''));

const stripYouTubeCouponBlock = (description) => {
  const lines = String(description ?? '').replace(/\r\n/g, '\n').split('\n');
  const startIndex = lines.findIndex((line) => {
    const normalizedLine = line
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    return (
      normalizedLine.includes('cupons') ||
      normalizedLine.includes('esportes da sorte') ||
      normalizedLine.includes('betmgm') ||
      normalizedLine.includes('joma brasil')
    );
  });

  if (startIndex === -1) {
    return lines.join('\n').trim();
  }

  let endIndex = lines.length - 1;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^\s*-{20,}\s*$/.test(lines[index])) {
      endIndex = index;
      break;
    }
  }

  return [...lines.slice(0, startIndex), ...lines.slice(endIndex + 1)]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const stripYouTubeChannelFooterBlock = (description) => {
  const lines = String(description ?? '').replace(/\r\n/g, '\n').split('\n');
  const startIndex = lines.findIndex((line) => {
    const normalizedLine = line
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    return (
      normalizedLine.includes('bem-vindo ao canal foot analysis') ||
      normalizedLine.includes('welcome to foot analysis en')
    );
  });

  if (startIndex === -1) {
    return lines.join('\n').trim();
  }

  const shortsIndex = lines.findIndex(
    (line, index) => index > startIndex && /^\s*#shorts\s*$/i.test(line)
  );
  const footerEndIndex = shortsIndex === -1 ? lines.length : shortsIndex;

  return [...lines.slice(0, startIndex), ...lines.slice(footerEndIndex)]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const updatePublishingMetadata = (job) => {
  if (!publishingMetadataRoot) return;
  if (!job) {
    publishingMetadataRoot.innerHTML = '';
    return;
  }

  const chips = [
    job.template,
    job.leagueName ?? job.competitionName,
    job.roundLabel ?? job.round,
    job.season,
    job.languageProfile,
    job.outputName,
  ].filter(Boolean);

  publishingMetadataRoot.innerHTML = chips
    .map((chip) => `<span class="ds-chip ds-chip--neutral status-chip neutral">${escapeHtml(chip)}</span>`)
    .join('');
};

const draftField = ({platform, label, key, value, multiline = true}) => {
  const fieldValue = joinList(value);
  const escapedValue = escapeHtml(fieldValue);
  const control = multiline
    ? `<textarea data-platform="${platform}" data-key="${key}" rows="4">${escapedValue}</textarea>`
    : `<input data-platform="${platform}" data-key="${key}" type="text" value="${escapedValue}" />`;
  return `
    <label class="ds-field publishing-field">
      <span>${escapeHtml(label)}</span>
      ${control}
      <button type="button" class="copy-field-button ds-button ds-button--secondary ds-button--compact btn btn-secondary btn-compact" data-copy-value="${escapeHtml(fieldValue)}">Copy</button>
    </label>
  `;
};

const renderPublishingDraft = (draft) => {
  currentPublishingDraft = draft;
  copyPublishingJsonButton.disabled = !draft;

  if (!draft) {
    publishingDraftRoot.innerHTML = '';
    return;
  }

  const platforms = draft.platforms ?? {};
  const platformCards = [
    {
      key: 'youtube',
      label: 'YouTube',
      fields: [
        ['Title', 'title', platforms.youtube?.title, false],
        ['Description', 'description', platforms.youtube?.description, true],
        ['Tags', 'tags', platforms.youtube?.tags, true],
        ['Hashtags', 'hashtags', platforms.youtube?.hashtags, true],
        ['Thumbnail notes', 'thumbnailNotes', platforms.youtube?.thumbnailNotes, true],
      ],
    },
    {
      key: 'reddit',
      label: 'Reddit',
      fields: [
        ['Subreddit', 'subreddit', platforms.reddit?.subreddit, false],
        ['Title', 'title', platforms.reddit?.title, false],
        ['Body', 'body', platforms.reddit?.body, true],
        ['Flair', 'flairSuggestion', platforms.reddit?.flairSuggestion, false],
        ['Tags', 'tags', platforms.reddit?.tags, true],
      ],
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      fields: [
        ['Description + hashtags', 'caption', platforms.tiktok?.caption, true],
        ['Cover text', 'coverText', platforms.tiktok?.coverText, false],
      ],
    },
    {
      key: 'instagram',
      label: 'Instagram',
      fields: [
        ['Description + hashtags', 'caption', platforms.instagram?.caption, true],
        ['Cover text', 'coverText', platforms.instagram?.coverText, false],
      ],
    },
    {
      key: 'x',
      label: 'X',
      fields: [
        ['Post text', 'postText', platforms.x?.postText, true],
        ['Hashtags', 'hashtags', platforms.x?.hashtags, true],
      ],
    },
  ];
  const activeCard = platformCards.some((card) => card.key === activePublishingPlatform)
    ? activePublishingPlatform
    : platformCards[0]?.key ?? 'youtube';
  activePublishingPlatform = activeCard;

  publishingDraftRoot.innerHTML = `
    <div class="publishing-summary">
      <strong>Draft summary</strong>
      <p>${escapeHtml(draft.summary)}</p>
    </div>
    <div class="publishing-tabs" role="tablist" aria-label="Publishing platforms">
      ${platformCards
        .map(
          (card) => `
            <button
              type="button"
              class="publishing-tab${card.key === activeCard ? ' active' : ''}"
              role="tab"
              aria-selected="${card.key === activeCard ? 'true' : 'false'}"
              aria-controls="publishing-panel-${escapeHtml(card.key)}"
              data-publishing-tab="${escapeHtml(card.key)}"
            >
              ${escapeHtml(card.label)}
            </button>
          `
        )
        .join('')}
    </div>
    ${platformCards
      .map(
        (card) => `
          <section
            class="publishing-card publishing-platform-card"
            id="publishing-panel-${escapeHtml(card.key)}"
            data-publishing-platform="${escapeHtml(card.key)}"
            role="tabpanel"
            ${card.key === activeCard ? '' : 'hidden'}
          >
            <div class="publishing-card-header">
              <h3>${escapeHtml(card.label)}</h3>
              <span class="ds-chip ds-chip--neutral status-chip neutral">draft</span>
            </div>
            ${card.fields
              .map(([label, key, value, multiline]) =>
                draftField({platform: card.key, label, key, value, multiline})
              )
              .join('')}
            ${
              card.key === 'youtube'
                ? `
                  <div class="youtube-upload-box ds-notice ds-notice--info notice info">
                    <label class="ds-field publishing-field">
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
                    <label class="toggle-row">
                      <input type="checkbox" id="youtube-channel-footer" />
                      <span>Include Foot Analysis channel description</span>
                    </label>
                    <button type="button" id="upload-youtube-button" class="ds-button ds-button--secondary btn btn-secondary">Upload to YouTube</button>
                    <p id="youtube-upload-status" class="publishing-status ds-notice ds-notice--info notice info">Upload uses the rendered MP4 and keeps manual review in YouTube Studio.</p>
                  </div>
                `
                : card.key === 'tiktok'
                  ? `
                    <div class="youtube-upload-box ds-notice ds-notice--info notice info">
                      <button type="button" id="upload-tiktok-button" class="ds-button ds-button--secondary btn btn-secondary">Upload to TikTok Inbox</button>
                      <p id="tiktok-upload-status" class="publishing-status ds-notice ds-notice--info notice info">TikTok upload sends the rendered MP4 to your inbox/draft flow. Copy the caption and finish in TikTok.</p>
                    </div>
                  `
                : ''
            }
          </section>
        `
      )
      .join('')}
  `;
  youtubeUploadStatusRoot = document.getElementById('youtube-upload-status');
  tiktokUploadStatusRoot = document.getElementById('tiktok-upload-status');
};

const setActivePublishingPlatform = (platform) => {
  activePublishingPlatform = platform;
  publishingDraftRoot.querySelectorAll('[data-publishing-tab]').forEach((tab) => {
    const isActive = tab.dataset.publishingTab === platform;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  publishingDraftRoot.querySelectorAll('[data-publishing-platform]').forEach((card) => {
    card.hidden = card.dataset.publishingPlatform !== platform;
  });
};

const getPreparedJobForCurrentTemplate = () =>
  lastPreparedJob?.template === templateSelect.value ? lastPreparedJob : null;

const generateShortCopy = async () => {
  const button = generateShortCopyButton;
  try {
    if (button) button.disabled = true;
    setNoticeStatus(hookCtaStatus, 'Gerando Hook, CTA e voice-over com OpenAI usando o template Markdown…', 'warning');

    const payload = buildJobPayloadFromForm();
    const response = await fetch(`${apiBase}/copy/hook-cta`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        target: 'all',
        job: payload,
        preparedJob: getPreparedJobForCurrentTemplate(),
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not generate Hook/CTA/voice-over.');
    }

    form.elements.hookText.value = data.hookText ?? '';
    form.elements.ctaText.value = data.ctaText ?? '';
    form.elements.voiceoverText.value = data.voiceoverText ?? '';

    setNoticeStatus(
      hookCtaStatus,
      `Sugestão pronta com ${data.model ?? 'OpenAI'} · ${data.templateName ?? 'template Markdown'}.`,
      'success'
    );
    log('Hook, CTA, and voice-over text generated with OpenAI.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setNoticeStatus(hookCtaStatus, message, 'error');
    log(message);
  } finally {
    if (button) button.disabled = false;
  }
};

const generatePublishingDraft = async () => {
  try {
    generatePublishingButton.disabled = true;
    setNoticeStatus(publishingStatus, 'Generating publishing draft from current video metadata…', 'warning');
    const response = await fetch(`${apiBase}/publishing/draft`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        model: publishingOpenAiModelSelect?.value,
        copyModelInstructions: publishingCopyModelInput.value,
        extraContext: publishingExtraContextInput.value,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not generate publishing draft');
    }

    if (publishingModelChip) {
      publishingModelChip.textContent = data.templateName
        ? `${data.templateName} · ${data.model ?? 'OpenAI'}`
        : data.model ?? 'draft ready';
    }
    renderPublishingDraft(data.draft);
    setNoticeStatus(publishingStatus, 'Draft ready. Review, edit, copy, then publish manually.', 'success');
    log('Publishing draft generated.');
  } catch (error) {
    setNoticeStatus(publishingStatus, error instanceof Error ? error.message : String(error), 'error');
    log(publishingStatus.textContent);
  } finally {
    generatePublishingButton.disabled = false;
  }
};

const collectPublishingDraftFromFields = () => {
  if (!currentPublishingDraft) return null;
  const nextDraft = structuredClone(currentPublishingDraft);
  publishingDraftRoot.querySelectorAll('[data-platform][data-key]').forEach((field) => {
    const platform = field.dataset.platform;
    const key = field.dataset.key;
    if (!nextDraft.platforms?.[platform]) return;
    const rawValue = field.value ?? '';
    const originalValue = nextDraft.platforms[platform][key];
    nextDraft.platforms[platform][key] = Array.isArray(originalValue)
      ? rawValue
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : rawValue;
  });
  ['tiktok', 'instagram'].forEach((platform) => {
    const platformDraft = nextDraft.platforms?.[platform];
    if (!platformDraft) return;
    platformDraft.hashtags = [
      ...new Set(
        String(platformDraft.caption ?? '')
          .match(/#[\p{L}\p{N}_]+/gu) ?? []
      ),
    ];
  });
  return nextDraft;
};

const uploadYouTubeDraft = async () => {
  const draft = collectPublishingDraftFromFields();
  const youtube = draft?.platforms?.youtube;
  if (!youtube) {
    setNoticeStatus(publishingStatus, 'Generate a YouTube draft before uploading.', 'warning');
    return;
  }

  const privacyStatus =
    document.getElementById('youtube-privacy-status')?.value ?? 'unlisted';
  const notifySubscribers =
    document.getElementById('youtube-notify-subscribers')?.checked ?? false;
  const hasPaidProductPlacement =
    document.getElementById('youtube-paid-product-placement')?.checked ?? false;
  const includeChannelFooter =
    document.getElementById('youtube-channel-footer')?.checked ?? false;
  const nextDescription = [
    (value) => (hasPaidProductPlacement ? value : stripYouTubeCouponBlock(value)),
    (value) => (includeChannelFooter ? value : stripYouTubeChannelFooterBlock(value)),
  ].reduce((description, transform) => transform(description), youtube.description);
  const youtubePayload = {
    ...youtube,
    description: nextDescription,
  };

  try {
    const button = document.getElementById('upload-youtube-button');
    if (button) button.disabled = true;
    if (youtubeUploadStatusRoot) {
      setNoticeStatus(youtubeUploadStatusRoot, 'Uploading to YouTube…', 'warning');
    }
    setNoticeStatus(publishingStatus, 'Uploading YouTube video…', 'warning');

    const response = await fetch(`${apiBase}/publishing/youtube/upload`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        youtube: youtubePayload,
        privacyStatus,
        notifySubscribers,
        hasPaidProductPlacement,
        includeChannelFooter,
        outputName: lastPreparedJob?.outputName,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'YouTube upload failed');
    }

    const link = data.youtube?.shortsUrl
      ? `<a class="download-link" href="${escapeHtml(data.youtube.shortsUrl)}" target="_blank" rel="noreferrer">Open Short</a>`
      : data.youtube?.url
        ? `<a class="download-link" href="${escapeHtml(data.youtube.url)}" target="_blank" rel="noreferrer">Open video</a>`
        : '';
    const shortsCheck = data.youtube?.shortsCheck;
    const shortsCheckLabel = shortsCheck
      ? ` Shorts check: ${Number(shortsCheck.width)}x${Number(shortsCheck.height)}, ${Number(
          shortsCheck.duration
        ).toFixed(1)}s.`
      : '';
    if (youtubeUploadStatusRoot) {
      youtubeUploadStatusRoot.innerHTML = `Uploaded as ${escapeHtml(
        data.youtube?.privacyStatus ?? privacyStatus
      )}.${escapeHtml(shortsCheckLabel)} ${link}`;
    }
    setNoticeStatus(publishingStatus, 'YouTube upload completed.', 'success');
    log(`YouTube upload completed: ${data.youtube?.shortsUrl ?? data.youtube?.url ?? data.youtube?.videoId ?? 'uploaded'}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (youtubeUploadStatusRoot) {
      setNoticeStatus(youtubeUploadStatusRoot, message, 'error');
    }
    setNoticeStatus(publishingStatus, message, 'error');
    log(message);
  } finally {
    const button = document.getElementById('upload-youtube-button');
    if (button) button.disabled = false;
  }
};

const uploadTikTokDraft = async () => {
  const draft = collectPublishingDraftFromFields();
  const tiktok = draft?.platforms?.tiktok;
  if (!tiktok) {
    setNoticeStatus(publishingStatus, 'Generate a TikTok draft before uploading.', 'warning');
    return;
  }

  try {
    const button = document.getElementById('upload-tiktok-button');
    if (button) button.disabled = true;
    if (tiktokUploadStatusRoot) {
      setNoticeStatus(tiktokUploadStatusRoot, 'Uploading to TikTok inbox…', 'warning');
    }
    setNoticeStatus(publishingStatus, 'Uploading TikTok draft…', 'warning');

    const response = await fetch(`${apiBase}/publishing/tiktok/upload`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        tiktok,
        outputName: lastPreparedJob?.outputName,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'TikTok upload failed');
    }

    const statusText = [
      `Uploaded to TikTok inbox.`,
      data.tiktok?.publishId ? `Publish ID: ${data.tiktok.publishId}.` : '',
      data.tiktok?.shortsCheck
        ? `Video check: ${Number(data.tiktok.shortsCheck.width)}x${Number(
            data.tiktok.shortsCheck.height
          )}, ${Number(data.tiktok.shortsCheck.duration).toFixed(1)}s.`
        : '',
      'Open TikTok notifications/inbox to finish the post.',
    ]
      .filter(Boolean)
      .join(' ');

    if (tiktokUploadStatusRoot) {
      setNoticeStatus(tiktokUploadStatusRoot, statusText, 'success');
    }
    setNoticeStatus(publishingStatus, 'TikTok inbox upload completed.', 'success');
    log(`TikTok upload completed: ${data.tiktok?.publishId ?? 'uploaded'}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (tiktokUploadStatusRoot) {
      setNoticeStatus(tiktokUploadStatusRoot, message, 'error');
    }
    setNoticeStatus(publishingStatus, message, 'error');
    log(message);
  } finally {
    const button = document.getElementById('upload-tiktok-button');
    if (button) button.disabled = false;
  }
};

const renderPredictionEditor = (fixtures = []) => {
  currentPredictionFixtures = fixtures;

  if (!fixtures.length) {
    predictionEditorList.innerHTML = '';
    return;
  }

  predictionEditorList.innerHTML = fixtures
    .map((fixture, index) => {
      return `
        <div class="prediction-card editor-row fixture-editor-row">
          <label class="prediction-team">
            <span>${escapeHtml(fixture.homeTeam)}</span>
          </label>
          <input
            class="prediction-score-input"
            type="number"
            min="0"
            step="1"
            data-fixture-id="${fixture.fixtureId}"
            data-side="home"
            value="${fixture.homeScore ?? ''}"
            aria-label="${fixture.homeTeam} score"
          />
          <input
            class="prediction-score-input"
            type="number"
            min="0"
            step="1"
            data-fixture-id="${fixture.fixtureId}"
            data-side="away"
            value="${fixture.awayScore ?? ''}"
            aria-label="${fixture.awayTeam} score"
          />
          <label class="prediction-team prediction-team-away">
            <span>${escapeHtml(fixture.awayTeam)}</span>
          </label>
        </div>
      `;
    })
    .join('');
};

const getPredictionEdits = () => {
  return currentPredictionFixtures.map((fixture) => {
    const homeInput = predictionEditorList.querySelector(
      `[data-fixture-id="${fixture.fixtureId}"][data-side="home"]`
    );
    const awayInput = predictionEditorList.querySelector(
      `[data-fixture-id="${fixture.fixtureId}"][data-side="away"]`
    );

    return {
      fixtureId: fixture.fixtureId,
      homeScore: homeInput?.value ?? '',
      awayScore: awayInput?.value ?? '',
    };
  });
};

const renderResultEditor = (fixtures = []) => {
  currentResultFixtures = fixtures;

  if (!fixtures.length) {
    resultEditorList.innerHTML = '';
    return;
  }

  resultEditorList.innerHTML = fixtures
    .map((fixture) => {
      return `
        <div class="prediction-card editor-row fixture-editor-row">
          <div class="prediction-team-block">
            <label class="eliminated-toggle">
              <input
                type="checkbox"
                data-fixture-id="${fixture.fixtureId}"
                data-side="home"
                data-field="eliminated"
                ${fixture.homeEliminated ? 'checked' : ''}
              />
              <span>Elim.</span>
            </label>
            <label class="prediction-team">
              <span>${escapeHtml(fixture.homeTeam)}</span>
            </label>
          </div>
          <input
            class="prediction-score-input"
            type="number"
            min="0"
            step="1"
            data-fixture-id="${fixture.fixtureId}"
            data-side="home"
            data-field="score"
            value="${fixture.homeScore ?? ''}"
            aria-label="${escapeHtml(fixture.homeTeam)} score"
          />
          <input
            class="prediction-score-input"
            type="number"
            min="0"
            step="1"
            data-fixture-id="${fixture.fixtureId}"
            data-side="away"
            data-field="score"
            value="${fixture.awayScore ?? ''}"
            aria-label="${escapeHtml(fixture.awayTeam)} score"
          />
          <div class="prediction-team-block align-right">
            <label class="prediction-team prediction-team-away">
              <span>${escapeHtml(fixture.awayTeam)}</span>
            </label>
            <label class="eliminated-toggle align-right">
              <span>Elim.</span>
              <input
                type="checkbox"
                data-fixture-id="${fixture.fixtureId}"
                data-side="away"
                data-field="eliminated"
                ${fixture.awayEliminated ? 'checked' : ''}
              />
            </label>
          </div>
          <div class="penalty-editor-row compact-penalty-row">
            <label class="eliminated-toggle penalty-toggle">
              <input
                type="checkbox"
                data-fixture-id="${fixture.fixtureId}"
                data-field="hasPenalties"
                ${fixture.hasPenalties ? 'checked' : ''}
              />
              <span>Pên.</span>
            </label>
            <div class="penalty-score-editor" aria-label="Resultado dos pênaltis">
              <input
                class="prediction-score-input penalty-score-input"
                type="number"
                min="0"
                step="1"
                data-fixture-id="${fixture.fixtureId}"
                data-side="home"
                data-field="penaltyScore"
                value="${fixture.homePenaltyScore ?? ''}"
                aria-label="${escapeHtml(fixture.homeTeam)} penalties"
              />
              <strong>–</strong>
              <input
                class="prediction-score-input penalty-score-input"
                type="number"
                min="0"
                step="1"
                data-fixture-id="${fixture.fixtureId}"
                data-side="away"
                data-field="penaltyScore"
                value="${fixture.awayPenaltyScore ?? ''}"
                aria-label="${escapeHtml(fixture.awayTeam)} penalties"
              />
            </div>
          </div>
        </div>
      `;
    })
    .join('');
};

const getFixtureEdits = () => {
  return currentResultFixtures.map((fixture) => {
    const homeInput = resultEditorList.querySelector(
      `[data-fixture-id="${fixture.fixtureId}"][data-side="home"][data-field="score"]`
    );
    const awayInput = resultEditorList.querySelector(
      `[data-fixture-id="${fixture.fixtureId}"][data-side="away"][data-field="score"]`
    );
    const homeEliminatedInput = resultEditorList.querySelector(
      `[data-fixture-id="${fixture.fixtureId}"][data-side="home"][data-field="eliminated"]`
    );
    const awayEliminatedInput = resultEditorList.querySelector(
      `[data-fixture-id="${fixture.fixtureId}"][data-side="away"][data-field="eliminated"]`
    );
    const hasPenaltiesInput = resultEditorList.querySelector(
      `[data-fixture-id="${fixture.fixtureId}"][data-field="hasPenalties"]`
    );
    const homePenaltyInput = resultEditorList.querySelector(
      `[data-fixture-id="${fixture.fixtureId}"][data-side="home"][data-field="penaltyScore"]`
    );
    const awayPenaltyInput = resultEditorList.querySelector(
      `[data-fixture-id="${fixture.fixtureId}"][data-side="away"][data-field="penaltyScore"]`
    );

    return {
      fixtureId: fixture.fixtureId,
      homeScore: homeInput?.value ?? '',
      awayScore: awayInput?.value ?? '',
      homeEliminated: Boolean(homeEliminatedInput?.checked),
      awayEliminated: Boolean(awayEliminatedInput?.checked),
      hasPenalties: Boolean(hasPenaltiesInput?.checked),
      homePenaltyScore: homePenaltyInput?.value ?? '',
      awayPenaltyScore: awayPenaltyInput?.value ?? '',
    };
  });
};

const renderStandingsEditor = (rows = []) => {
  currentStandingRows = rows;

  if (!rows.length) {
    standingsEditorList.innerHTML = '';
    return;
  }

  standingsEditorList.innerHTML = rows
    .map((row) => {
      const logoSource = row.badge?.logoPath ?? row.badge?.imagePath;
      const badgeHtml = logoSource
        ? `<img src="${escapeHtml(logoSource)}" alt="" />`
        : `<span class="season-verdict-fallback-badge">${escapeHtml(row.badge?.label ?? '')}</span>`;

      return `
        <div class="standings-editor-row editor-row" data-original-rank="${row.rank}">
          <div class="standings-editor-team">
            ${badgeHtml}
            <input
              type="text"
              data-field="team"
              value="${escapeHtml(row.team)}"
              aria-label="${escapeHtml(row.team)} display name"
            />
          </div>
          <label>
            POS
            <input type="number" min="1" step="1" data-field="rank" value="${row.rank}" />
          </label>
          <label>
            JG
            <input type="number" min="0" step="1" data-field="played" value="${row.played}" />
          </label>
          <label>
            SG
            <input type="number" step="1" data-field="goalDifference" value="${row.goalDifference}" />
          </label>
          <label>
            PTS
            <input type="number" step="1" data-field="points" value="${row.points}" />
          </label>
          <label>
            Forma
            <input type="text" maxlength="8" data-field="form" value="${escapeHtml(row.form ?? '')}" />
          </label>
        </div>
      `;
    })
    .join('');
};

const getStandingEdits = () => {
  return currentStandingRows.map((row) => {
    const rowElement = standingsEditorList.querySelector(
      `.standings-editor-row[data-original-rank="${row.rank}"]`
    );
    const getValue = (field) => rowElement?.querySelector(`[data-field="${field}"]`)?.value ?? '';

    return {
      originalRank: row.rank,
      team: getValue('team'),
      rank: getValue('rank'),
      played: getValue('played'),
      goalDifference: getValue('goalDifference'),
      points: getValue('points'),
      form: getValue('form'),
    };
  });
};

const getWorldCupGroups = async () => {
  if (cachedWorldCupGroups) {
    return cachedWorldCupGroups;
  }

  const response = await fetch(`${apiBase}/world-cup-groups`);
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Could not load World Cup groups.');
  }

  cachedWorldCupGroups = data.groups ?? {};
  return cachedWorldCupGroups;
};

const getWorldCupStandingsPreview = async ({force = false} = {}) => {
  const groupLetter = (form.elements.groupLetter.value || 'A').toUpperCase().slice(0, 1);
  const season = form.elements.season.value || '2026';
  const languageProfile = languageProfileSelect.value || getChannelLanguageProfile();
  const channelProfile = channelProfileSelect.value || getCurrentChannelProfile();
  const cacheKey = [season, groupLetter, languageProfile, channelProfile].join(':');

  if (!force && cachedWorldCupStandingsPreview.has(cacheKey)) {
    return cachedWorldCupStandingsPreview.get(cacheKey);
  }

  const params = new URLSearchParams({
    season,
    groupLetter,
    languageProfile,
    channelProfile,
  });

  const competitionName = form.elements.leagueName.value.trim();
  const roundLabel = form.elements.roundLabel.value.trim();
  if (competitionName) {
    params.set('competitionName', competitionName);
  }
  if (roundLabel) {
    params.set('roundLabel', roundLabel);
  }

  const response = await fetch(`${apiBase}/world-cup-standings-preview?${params.toString()}`);
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || 'Could not load World Cup standings from API.');
  }

  cachedWorldCupStandingsPreview.set(cacheKey, data);
  return data;
};

const getWorldCupGroupRowsFromConfig = (groups, groupLetter) => {
  const group = groups?.[groupLetter] ?? {};
  const standingsRows = group.standings?.length
    ? group.standings
    : (group.teams ?? []).map((team, index) => ({
        rank: index + 1,
        team: team.name,
        flag: team.flag,
        goalDifference: 0,
        points: 0,
      }));

  return standingsRows.map((row, index) => ({
    rank: row.rank ?? index + 1,
    team: row.team ?? row.name ?? `Team ${index + 1}`,
    points: row.points ?? 0,
    goalDifference: row.goalDifference ?? 0,
    badge: {label: row.flag ?? ''},
  }));
};

const renderWorldCupStandingsEditor = (rows = []) => {
  currentWorldCupStandingRows = rows;

  if (!rows.length) {
    worldCupStandingsEditorList.innerHTML = '';
    return;
  }

  worldCupStandingsEditorList.innerHTML = rows
    .map((row) => {
      const logoSource = row.badge?.logoPath ?? row.badge?.imagePath;
      const badgeHtml = logoSource
        ? `<img src="${escapeHtml(logoSource)}" alt="" />`
        : `<span class="season-verdict-fallback-badge">${escapeHtml(row.badge?.label ?? '')}</span>`;

      return `
        <div class="standings-editor-row world-cup-standings-editor-row editor-row" data-team="${escapeHtml(row.team)}">
          <div class="standings-editor-team">
            ${badgeHtml}
            <strong>${escapeHtml(row.team)}</strong>
          </div>
          <label>
            POS
            <input type="number" min="1" step="1" data-field="rank" value="${row.rank}" />
          </label>
          <label>
            PTS
            <input type="number" min="0" step="1" data-field="points" value="${row.points}" />
          </label>
          <label>
            GD
            <input type="number" step="1" data-field="goalDifference" value="${row.goalDifference}" />
          </label>
        </div>
      `;
    })
    .join('');
};

const getWorldCupStandingEdits = () =>
  currentWorldCupStandingRows
    .map((row) => {
      const rowElement = worldCupStandingsEditorList.querySelector(
        `.world-cup-standings-editor-row[data-team="${CSS.escape(row.team)}"]`
      );
      const getValue = (field) => rowElement?.querySelector(`[data-field="${field}"]`)?.value ?? '';

      const rank = getValue('rank');
      const points = getValue('points');
      const goalDifference = getValue('goalDifference');
      const changed =
        String(row.rank) !== String(rank) ||
        String(row.points) !== String(points) ||
        String(row.goalDifference) !== String(goalDifference);

      return changed
        ? {
            team: row.team,
            rank,
            points,
            goalDifference,
          }
        : null;
    })
    .filter(Boolean);

const loadWorldCupStandingsEditor = async ({preferPrepared = false, force = false} = {}) => {
  const template = templateSelect.value;
  const groupLetter = (form.elements.groupLetter.value || 'A').toUpperCase();

  if (template !== WORLD_CUP_TEMPLATE) {
    setNoticeStatus(worldCupStandingsEditorStatus, 'Select World Cup Group Standings to edit the table.', 'info');
    renderWorldCupStandingsEditor([]);
    return;
  }

  if (
    preferPrepared &&
    lastPreparedJob?.template === WORLD_CUP_TEMPLATE &&
    lastPreparedJob.groupLetter === groupLetter &&
    Array.isArray(lastPreparedJob.rows) &&
    lastPreparedJob.rows.length
  ) {
    renderWorldCupStandingsEditor(lastPreparedJob.rows);
    setNoticeStatus(
      worldCupStandingsEditorStatus,
      `Loaded prepared Group ${groupLetter} table. Edit and prepare again to override.`,
      'success'
    );
    return;
  }

  try {
    reloadWorldCupStandingsButton.disabled = true;
    setNoticeStatus(worldCupStandingsEditorStatus, `Loading Group ${groupLetter} table from API…`, 'warning');
    const preview = await getWorldCupStandingsPreview({force});
    const rows = preview.rows ?? [];
    renderWorldCupStandingsEditor(rows);
    setNoticeStatus(
      worldCupStandingsEditorStatus,
      rows.length
        ? `Loaded Group ${groupLetter} from API. Edit POS, PTS and GD only if you need a manual override.`
        : `API returned no Group ${groupLetter} rows.`,
      rows.length ? 'success' : 'warning'
    );
  } catch (error) {
    log(error instanceof Error ? error.message : String(error));
    try {
      setNoticeStatus(
        worldCupStandingsEditorStatus,
        `API unavailable for Group ${groupLetter}; loading local fallback…`,
        'warning'
      );
      const groups = await getWorldCupGroups();
      const rows = getWorldCupGroupRowsFromConfig(groups, groupLetter);
      renderWorldCupStandingsEditor(rows);
      setNoticeStatus(
        worldCupStandingsEditorStatus,
        rows.length
          ? `Loaded Group ${groupLetter} from local fallback. Prepare will still use the API unless you edit POS, PTS or GD.`
          : `No teams configured for Group ${groupLetter}.`,
        rows.length ? 'warning' : 'error'
      );
    } catch (fallbackError) {
      renderWorldCupStandingsEditor([]);
      setNoticeStatus(worldCupStandingsEditorStatus, 'Could not load World Cup group table.', 'error');
      log(fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
    }
  } finally {
    reloadWorldCupStandingsButton.disabled = false;
  }
};

const renderChampionFinalOptions = (rows = [], selectedRank = championFinalSelect.value) => {
  currentChampionFinalRows = rows;
  championFinalSelect.innerHTML = [
    '<option value="">Auto pela final selecionada</option>',
    ...rows.map((row) => {
      const selected = String(row.rank) === String(selectedRank) ? ' selected' : '';
      return `<option value="${row.rank}"${selected}>${row.rank}. ${escapeHtml(row.team)}</option>`;
    }),
  ].join('');
};

const getChampionFinalSelection = () => {
  const selectedRank = Number(championFinalSelect.value);
  const selectedRow = currentChampionFinalRows.find((row) => row.rank === selectedRank);

  return selectedRow
    ? {
        rank: selectedRow.rank,
        team: selectedRow.team,
        badge: selectedRow.badge,
      }
    : undefined;
};

const loadChampionFinalOptions = async () => {
  if (templateSelect.value !== CHAMPION_FINAL_TEMPLATE) {
    renderChampionFinalOptions([]);
    return;
  }

  const leagueIdValue = form.elements.leagueId.value.trim();
  const seasonValue = form.elements.season.value.trim();
  const leagueId = Number(leagueIdValue);
  const season = Number(seasonValue);

  if (!leagueIdValue || !seasonValue || !Number.isFinite(leagueId) || !Number.isFinite(season)) {
    setNoticeStatus(
      championFinalStatus,
      'Auto usa a final. Escolha uma liga e temporada para carregar campeões da tabela.',
      'warning'
    );
    renderChampionFinalOptions([]);
    return;
  }

  try {
    reloadChampionFinalButton.disabled = true;
    setNoticeStatus(championFinalStatus, 'Carregando tabela para escolher o campeão...', 'warning');
    const params = new URLSearchParams({
      leagueId: String(leagueId),
      season: String(season),
    });
    const response = await fetch(`${apiBase}/standings-editor?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load champion options.');
    }

    renderChampionFinalOptions(data.rows ?? []);
    setNoticeStatus(
      championFinalStatus,
      data.rows?.length
        ? 'Auto resolve copas pela final. Para liga, escolha o campeão da tabela.'
        : 'Sem tabela disponível. Use a final selecionada para resolver o campeão.',
      data.rows?.length ? 'success' : 'warning'
    );
  } catch (error) {
    renderChampionFinalOptions([]);
    setNoticeStatus(championFinalStatus, 'Não foi possível carregar a tabela. Auto continua disponível.', 'error');
    log(error instanceof Error ? error.message : String(error));
  } finally {
    reloadChampionFinalButton.disabled = false;
  }
};

const loadStandingsEditor = async () => {
  const template = templateSelect.value;
  const leagueIdValue = form.elements.leagueId.value.trim();
  const seasonValue = form.elements.season.value.trim();
  const leagueId = Number(leagueIdValue);
  const season = Number(seasonValue);

  if (template !== 'standings') {
    setNoticeStatus(standingsEditorStatus, 'Select Standings to load table overrides.', 'info');
    renderStandingsEditor([]);
    return;
  }

  if (!leagueIdValue || !seasonValue || !Number.isFinite(leagueId) || !Number.isFinite(season)) {
    setNoticeStatus(standingsEditorStatus, 'Choose a league and season to load standings.', 'warning');
    renderStandingsEditor([]);
    return;
  }

  try {
    reloadStandingsButton.disabled = true;
    setNoticeStatus(standingsEditorStatus, 'Loading standings…', 'warning');
    const params = new URLSearchParams({
      leagueId: String(leagueId),
      season: String(season),
    });
    const response = await fetch(`${apiBase}/standings-editor?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load standings.');
    }

    renderStandingsEditor(data.rows ?? []);
    setNoticeStatus(
      standingsEditorStatus,
      data.rows?.length
        ? `Loaded ${data.rows.length} teams. Edit only what the API got wrong.`
        : 'No standings rows found.',
      data.rows?.length ? 'success' : 'warning'
    );
  } catch (error) {
    renderStandingsEditor([]);
    setNoticeStatus(standingsEditorStatus, 'Could not load standings.', 'error');
    log(error instanceof Error ? error.message : String(error));
  } finally {
    reloadStandingsButton.disabled = false;
  }
};

const renderSeasonVerdictEditor = (rows = [], statusOptions = []) => {
  currentSeasonVerdictRows = rows;

  if (!rows.length) {
    seasonVerdictEditorList.innerHTML = '';
    return;
  }

  const optionsHtml = (selectedValue = 'auto') =>
    statusOptions
      .map((option) => {
        const selected = option.value === selectedValue ? ' selected' : '';
        return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
      })
      .join('');

  seasonVerdictEditorList.innerHTML = rows
    .map((row) => {
      const logoSource = row.badge?.logoPath ?? row.badge?.imagePath;
      const badgeHtml = logoSource
        ? `<img src="${escapeHtml(logoSource)}" alt="" />`
        : `<span class="season-verdict-fallback-badge">${escapeHtml(row.badge?.label ?? '')}</span>`;

      return `
        <div class="season-verdict-row editor-row" data-rank="${row.rank}">
          <div class="season-verdict-team">
            ${badgeHtml}
            <div>
              <strong>${row.rank}. ${escapeHtml(row.team)}</strong>
              <span>Auto: ${escapeHtml(row.autoStatusLabel ?? 'Mid-table')}</span>
            </div>
          </div>
          <div class="season-verdict-meta">
            <span>${row.points} pts</span>
            <span>SG ${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}</span>
          </div>
          <label>
            Final status
            <select data-rank="${row.rank}" data-team="${escapeHtml(row.team)}">
              ${optionsHtml('auto')}
            </select>
          </label>
        </div>
      `;
    })
    .join('');
};

const getSeasonFinalVerdictEdits = () => {
  return currentSeasonVerdictRows
    .map((row) => {
      const select = seasonVerdictEditorList.querySelector(
        `.season-verdict-row[data-rank="${row.rank}"] select`
      );
      const status = select?.value ?? 'auto';

      return {
        rank: row.rank,
        team: row.team,
        status,
      };
    })
    .filter((edit) => edit.status && edit.status !== 'auto');
};

const loadSeasonFinalVerdictEditor = async () => {
  const template = templateSelect.value;
  const leagueIdValue = form.elements.leagueId.value.trim();
  const seasonValue = form.elements.season.value.trim();
  const languageProfile = languageProfileSelect.value || 'pt-br';
  const leagueId = Number(leagueIdValue);
  const season = Number(seasonValue);

  if (template !== SEASON_FINAL_VERDICT_TEMPLATE) {
    setNoticeStatus(seasonVerdictEditorStatus, 'Select Season Wrap-up to load standings overrides.', 'info');
    renderSeasonVerdictEditor([]);
    return;
  }

  if (!leagueIdValue || !seasonValue || !Number.isFinite(leagueId) || !Number.isFinite(season)) {
    setNoticeStatus(seasonVerdictEditorStatus, 'Choose a league and season to load standings.', 'warning');
    renderSeasonVerdictEditor([]);
    return;
  }

  try {
    reloadSeasonVerdictButton.disabled = true;
    setNoticeStatus(seasonVerdictEditorStatus, 'Loading standings…', 'warning');
    const params = new URLSearchParams({
      leagueId: String(leagueId),
      season: String(season),
      languageProfile,
    });
    const response = await fetch(`${apiBase}/season-final-verdict-editor?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load standings overrides.');
    }

    renderSeasonVerdictEditor(data.rows ?? [], data.statusOptions ?? []);
    setNoticeStatus(
      seasonVerdictEditorStatus,
      data.rows?.length
        ? `Loaded ${data.rows.length} teams. Change only the teams affected by playoffs.`
        : 'No standings rows found.',
      data.rows?.length ? 'success' : 'warning'
    );
  } catch (error) {
    renderSeasonVerdictEditor([]);
    setNoticeStatus(seasonVerdictEditorStatus, 'Could not load standings overrides.', 'error');
    log(error instanceof Error ? error.message : String(error));
  } finally {
    reloadSeasonVerdictButton.disabled = false;
  }
};

const tierlistGroups = [
  {key: 'champion', label: 'Campeão / Champion', count: 1},
  {key: 'favorites', label: 'Favoritos / Favorites', count: 3},
  {key: 'deepRun', label: 'Vão Longe / Deep Run', count: 5},
  {key: 'darkHorses', label: 'Zebras / Dark Horses', count: 3},
  {key: 'groupStageExit', label: 'Cai na Fase de Grupos / Group Stage Exit', count: 4},
  {key: 'disappointment', label: 'Decepção / Disappointment', count: 3},
];

const renderTierlistEditor = (teams = []) => {
  currentTierlistTeams = teams;

  if (!teams.length) {
    tierlistEditorList.innerHTML = '';
    return;
  }

  const optionHtml = (selectedValue = '') =>
    [
      '<option value="">Select team</option>',
      ...teams.map((team) => {
        const selected = team.value === selectedValue ? ' selected' : '';
        return `<option value="${escapeHtml(team.value)}"${selected}>${escapeHtml(team.label)}</option>`;
      }),
    ].join('');

  const defaults = [
    'Brazil',
    'Argentina',
    'France',
    'England',
    'Spain',
    'Portugal',
    'Germany',
    'Netherlands',
    'Uruguay',
    'Morocco',
    'Japan',
    'USA',
    'Qatar',
    'Saudi Arabia',
    'Tunisia',
    'Scotland',
    'Belgium',
    'Croatia',
    'Mexico',
  ];
  const preparedTierSelections = Object.fromEntries(
    (lastPreparedJob?.template === TIERLIST_TEMPLATE ? lastPreparedJob.tiers ?? [] : []).map((tier) => [
      (
        {
          'deep-run': 'deepRun',
          'dark-horses': 'darkHorses',
          'group-stage-exit': 'groupStageExit',
        }[tier.key] ?? tier.key
      ),
      (tier.entries ?? []).map((entry) => entry.sourceTeam ?? entry.team),
    ])
  );
  let defaultIndex = 0;

  tierlistEditorList.innerHTML = tierlistGroups
    .map((group) => {
      const preparedTeams = preparedTierSelections[group.key] ?? [];
      const controls = Array.from({length: group.count}, (_, controlIndex) => {
        const preparedTeam = preparedTeams[controlIndex];
        const selectedValue =
          teams.find(
            (team) =>
              preparedTeam &&
              (team.label === preparedTeam ||
                team.value === preparedTeam ||
                slugifyOutputPart(team.label) === slugifyOutputPart(preparedTeam) ||
                slugifyOutputPart(team.value) === slugifyOutputPart(preparedTeam))
          )?.value ??
          teams.find((team) => team.value === defaults[defaultIndex])?.value ??
          '';
        defaultIndex += 1;
        return `
          <label class="tierlist-select-field">
            <span>Team ${defaultIndex}</span>
            <select data-tier="${group.key}">
              ${optionHtml(selectedValue)}
            </select>
          </label>
        `;
      }).join('');

      return `
        <div class="tierlist-editor-row editor-row">
          <div class="tierlist-editor-label">
            <strong>${escapeHtml(group.label)}</strong>
            <span>${group.count} team${group.count === 1 ? '' : 's'}</span>
          </div>
          <div class="tierlist-editor-controls">${controls}</div>
        </div>
      `;
    })
    .join('');
};

const getTierlistSelections = () =>
  Object.fromEntries(
    tierlistGroups.map((group) => [
      group.key,
      [...tierlistEditorList.querySelectorAll(`select[data-tier="${group.key}"]`)]
        .map((select) => select.value)
        .filter(Boolean),
    ])
  );

const loadTierlistTeams = async () => {
  const template = templateSelect.value;
  const seasonValue = form.elements.season.value.trim();
  const season = Number(seasonValue);
  const languageProfile = languageProfileSelect.value || 'pt-br';

  if (template !== TIERLIST_TEMPLATE) {
    setNoticeStatus(tierlistEditorStatus, 'Select Tierlist to load teams.', 'info');
    renderTierlistEditor([]);
    return;
  }

  if (!seasonValue || !Number.isFinite(season)) {
    setNoticeStatus(tierlistEditorStatus, 'Choose a season to load World Cup teams.', 'warning');
    renderTierlistEditor([]);
    return;
  }

  try {
    reloadTierlistButton.disabled = true;
    setNoticeStatus(tierlistEditorStatus, 'Loading World Cup teams…', 'warning');
    const params = new URLSearchParams({
      season: String(season),
      languageProfile,
    });
    const response = await fetch(`${apiBase}/tierlist-teams?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load teams.');
    }

    renderTierlistEditor(data.teams ?? []);
    setNoticeStatus(
      tierlistEditorStatus,
      data.teams?.length
        ? `Loaded ${data.teams.length} teams. Fill all tiers before preparing.`
        : 'No World Cup teams found.',
      data.teams?.length ? 'success' : 'warning'
    );
  } catch (error) {
    renderTierlistEditor([]);
    setNoticeStatus(tierlistEditorStatus, 'Could not load Tierlist teams.', 'error');
    log(error instanceof Error ? error.message : String(error));
  } finally {
    reloadTierlistButton.disabled = false;
  }
};

const loadResultFixturesForEditor = async () => {
  const template = templateSelect.value;
  const leagueIdValue = form.elements.leagueId.value.trim();
  const seasonValue = form.elements.season.value.trim();
  const languageProfile = languageProfileSelect.value || 'pt-br';
  const leagueId = Number(leagueIdValue);
  const season = Number(seasonValue);

  if (template !== 'results' && template !== CHAMPION_FINAL_TEMPLATE) {
    setNoticeStatus(resultEditorStatus, 'Select Results or Champion Final to load fixtures.', 'info');
    return;
  }

  if (!leagueIdValue || !seasonValue || !Number.isFinite(leagueId) || !Number.isFinite(season)) {
    setNoticeStatus(resultEditorStatus, 'Choose a league and season to load results.', 'warning');
    renderResultEditor([]);
    return;
  }

  const selectedRound = roundSelect.value.trim();
  const selectedDates = getSelectedMatchDates();

  setNoticeStatus(resultEditorStatus, 'Loading result fixtures…', 'warning');

  try {
    const params = new URLSearchParams({
      leagueId: String(leagueId),
      season: String(season),
      languageProfile,
    });
    if (selectedRound) params.set('round', selectedRound);
    selectedDates.forEach((dateValue) => params.append('matchDates', dateValue));

    const response = await fetch(`${apiBase}/result-fixtures?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load result fixtures.');
    }

    const visibleFixtures = data.fixtures ?? [];
    renderResultEditor(visibleFixtures);
    const dateLabel = getMatchDateSelectionLabel();
    setNoticeStatus(
      resultEditorStatus,
      visibleFixtures.length
        ? `Loaded ${visibleFixtures.length} fixtures for ${data.round}${dateLabel ? ` • ${dateLabel}` : ''}.`
        : 'No fixtures found for the selected round.',
      visibleFixtures.length ? 'success' : 'warning'
    );
  } catch (error) {
    setNoticeStatus(resultEditorStatus, 'Could not load result fixtures.', 'error');
    log(error instanceof Error ? error.message : String(error));
  }
};

const getStudioPreviewUrl = () => {
  const studioUrl = normalizeStudioUrl(studioUrlInput.value);
  const compositionId = templateCompositionMap[templateSelect.value];
  const knownCompositionIds = new Set(Object.values(templateCompositionMap).filter(Boolean));

  return buildStudioPreviewUrl({studioUrl, compositionId, knownCompositionIds});
};

const updatePreview = () => {
  const studioUrl = normalizeStudioUrl(studioUrlInput.value);
  studioUrlInput.value = studioUrl;
  localStorage.setItem(STUDIO_URL_KEY, studioUrl);
  const previewUrl = getStudioPreviewUrl();
  previewFrame.src = 'about:blank';
  window.setTimeout(() => {
    previewFrame.src = previewUrl;
  }, 25);
  openPreviewLink.href = previewUrl;
};

const updateDashboardMeta = () => {
  const templateLabel = getSelectedOptionLabel(templateSelect) || 'template';
  const channelLabel = getSelectedOptionLabel(channelProfileSelect) || 'channel';
  const leagueLabel = getSelectedOptionLabel(presetSelect) || form.elements.leagueName.value || 'league';
  const roundValue = roundSelect.value || getMatchDateSelectionLabel() || 'auto';

  templateChip.textContent = templateLabel;
  if (dashboardChannelChip) {
    dashboardChannelChip.textContent = channelLabel;
  }
  if (dashboardQuickStatus) {
    dashboardQuickStatus.textContent = `${templateLabel} • ${leagueLabel} • ${roundValue}`;
  }
};

const loadPredictionFixtures = async () => {
  if (templateSelect.value !== 'predictions') {
    setNoticeStatus(predictionEditorStatus, 'Select the Predictions template to load fixtures.', 'info');
    renderPredictionEditor([]);
    return;
  }

  const leagueIdValue = form.elements.leagueId.value.trim();
  const seasonValue = form.elements.season.value.trim();
  const leagueId = Number(leagueIdValue);
  const season = Number(seasonValue);

  if (!leagueIdValue || !seasonValue || !Number.isFinite(leagueId) || !Number.isFinite(season)) {
    setNoticeStatus(predictionEditorStatus, 'Choose a league and season to load predictions.', 'warning');
    renderPredictionEditor([]);
    return;
  }

  try {
    reloadPredictionsButton.disabled = true;
    setNoticeStatus(predictionEditorStatus, 'Loading prediction fixtures…', 'warning');

    const params = new URLSearchParams({
      leagueId: String(leagueId),
      season: String(season),
      round: roundSelect.value,
      languageProfile: languageProfileSelect.value || 'pt-br',
    });
    getSelectedMatchDates().forEach((dateValue) => params.append('matchDates', dateValue));

    const response = await fetch(`${apiBase}/prediction-fixtures?${params.toString()}`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load prediction fixtures.');
    }

    const selectedDates = getSelectedMatchDates();
    const selectedDateSet = new Set(selectedDates);
    const visibleFixtures = selectedDates.length
      ? (data.fixtures ?? []).filter((fixture) => selectedDateSet.has(fixture.fixtureDateKey))
      : data.fixtures ?? [];
    const dateLabel = getMatchDateSelectionLabel();

    renderPredictionEditor(visibleFixtures);
    setNoticeStatus(
      predictionEditorStatus,
      visibleFixtures.length
        ? `Loaded ${visibleFixtures.length} fixtures for ${data.round}${dateLabel ? ` • ${dateLabel}` : ''}.`
        : 'No fixtures found for this selection.',
      visibleFixtures.length ? 'success' : 'warning'
    );
    log(
      `Loaded ${visibleFixtures.length ?? 0} prediction fixtures for ${data.round}${dateLabel ? ` • ${dateLabel}` : ''}.`
    );
  } catch (error) {
    renderPredictionEditor([]);
    setNoticeStatus(predictionEditorStatus, 'Could not load prediction fixtures.', 'error');
    log(error instanceof Error ? error.message : String(error));
  } finally {
    reloadPredictionsButton.disabled = false;
  }
};

const getJobDateLabel = (job) => {
  const dates = normalizeSelectedDates(job?.matchDates ?? job?.matchDate);

  if (dates.length === 0) {
    return '';
  }

  if (dates.length <= 2) {
    return dates.join(' + ');
  }

  return `${dates.length} dates`;
};

const renderCurrentJob = (job) => {
  if (!job) {
    lastPreparedJob = null;
    updatePublishingMetadata(null);
    templateChip.textContent = 'no job';
    currentJobRoot.innerHTML =
      '<div class="empty-state command-empty-state"><span class="ds-chip ds-chip--neutral status-chip neutral">no job</span><strong>No prepared job yet</strong><span>Prepare a preview after choosing template, league, season, and round.</span></div>';
    if (dashboardQuickStatus) {
      dashboardQuickStatus.textContent = 'Choose a template, league, and round/date. Then prepare a preview job.';
    }
    return;
  }

  lastPreparedJob = job;
  updatePublishingMetadata(job);
  const templateLabel = getSelectedOptionLabel(templateSelect) || job.template;
  templateChip.textContent = templateLabel;
  const detailLine =
    job.template === 'standings'
      ? `${job.rows.length} table rows`
      : job.template === TOP_SCORERS_TEMPLATE
        ? `${job.entries.length} artilheiros • top 10`
      : job.template === PLAYER_OF_ROUND_TEMPLATE
        ? `${job.entries.length} jogadores • ${job.round}${getJobDateLabel(job) ? ` • ${getJobDateLabel(job)}` : ''}`
      : job.template === SEASON_FINAL_VERDICT_TEMPLATE
        ? `${job.qualificationGroups?.length ?? 0} groups • ${
            job.relegationGroup?.entries?.length ?? 0
          } relegated`
      : job.template === CHAMPIONSHIP_PACE_TEMPLATE || job.template === RELEGATION_LINE_TEMPLATE
        ? `${job.entries.length} teams • ${job.benchmarkPercentage}% reference`
      : job.template === TIERLIST_TEMPLATE
        ? `${job.tiers?.reduce((total, tier) => total + (tier.entries?.length ?? 0), 0) ?? 0} teams • ${
            job.tiers?.[0]?.entries?.[0]?.team ? `campeão: ${job.tiers[0].entries[0].team}` : '6 tiers'
          }`
      : job.template === CONTINENTAL_GROUPS_TEMPLATE
        ? `${job.groups.length} groups • 2 per page`
      : job.template === WORLD_CUP_TEMPLATE
        ? `Grupo ${job.groupLetter} • ${job.rows.length} selecoes • ${job.nextMatches.length} jogos`
      : job.template === WORLD_CUP_KNOCKOUT_TEMPLATE
        ? `${job.phaseLabel} • ${job.matches.length} jogos`
        : `${job.fixtures?.length ?? 0} fixtures • ${job.round}${getJobDateLabel(job) ? ` • ${getJobDateLabel(job)}` : ''}`;

  const titleLine =
    job.template === 'standings'
      ? job.standingsLabel
      : job.template === TOP_SCORERS_TEMPLATE
        ? `${job.titleLabel} • ${job.subtitleLabel}`
      : job.template === PLAYER_OF_ROUND_TEMPLATE
        ? `${job.titleLabel} • ${job.subtitleLabel}`
      : job.template === SEASON_FINAL_VERDICT_TEMPLATE
        ? `${job.titleLabel} • ${job.subtitleLabel}`
      : job.template === CHAMPIONSHIP_PACE_TEMPLATE || job.template === RELEGATION_LINE_TEMPLATE
        ? `${job.titleLabel} • ${job.subtitleLabel}`
      : job.template === TIERLIST_TEMPLATE
        ? `${job.titleLabel} • ${job.subtitleLabel}`
      : job.template === CONTINENTAL_GROUPS_TEMPLATE
        ? `${job.titleLabel} • ${job.subtitleLabel}`
      : job.template === WORLD_CUP_TEMPLATE
        ? `${job.titleLabel} • ${job.groupLabel}`
        : job.template === WORLD_CUP_KNOCKOUT_TEMPLATE
          ? `${job.titleLabel} • ${job.phaseLabel}`
        : job.roundLabel;

  if (dashboardQuickStatus) {
    dashboardQuickStatus.textContent = `${job.leagueName} • ${titleLine} • ${detailLine}`;
  }

  currentJobRoot.innerHTML = `
    <div class="job-status-line">
      <span class="ds-chip ds-chip--success status-chip success">ready</span>
      <div class="job-status-copy">
        <strong>${escapeHtml(job.leagueName)} • ${escapeHtml(templateLabel)}</strong>
        <span>${escapeHtml(titleLine)} • ${escapeHtml(detailLine)} • ${escapeHtml(job.outputName)}</span>
      </div>
      <div class="job-status-meta">
        <span class="ds-chip ds-chip--neutral status-chip neutral">${escapeHtml(job.languageProfile ?? 'pt-br')}</span>
        <span class="ds-chip ds-chip--neutral status-chip neutral">${escapeHtml(job.brandName)}</span>
      </div>
    </div>
  `;

  if (job.template === TIERLIST_TEMPLATE && tierlistEditorStatus) {
    const champion = job.tiers?.find((tier) => tier.key === 'champion')?.entries?.[0]?.team;
    tierlistEditorStatus.textContent = champion
      ? `Prepared preview with champion: ${champion}.`
      : 'Prepared preview.';
  }

  if (job.template === WORLD_CUP_TEMPLATE && worldCupStandingsEditorStatus) {
    renderWorldCupStandingsEditor(job.rows ?? []);
    setNoticeStatus(
      worldCupStandingsEditorStatus,
      `Prepared Group ${job.groupLetter} table. Edit POS, PTS and GD, then prepare again to override.`,
      'success'
    );
  }
};

const updateLocalizedDefaults = () => {
  const template = templateSelect.value;
  const languageProfile = languageProfileSelect.value || 'pt-br';
  const season = form.elements.season.value || '2026';
  const groupLetter = (form.elements.groupLetter.value || 'A').toUpperCase();
  const copy = dashboardCopy[languageProfile];

  if (!form.elements.ctaText.value.trim()) {
    form.elements.ctaText.placeholder = 'Auto or generate with AI';
  }

  syncIntroPlaceholders();

  if (!copy || template !== WORLD_CUP_TEMPLATE) {
    lastAutoWorldCupCompetitionName = '';
    lastAutoWorldCupGroupLabel = '';
    return;
  }

  const nextCompetitionName = copy.worldCup.title(season);
  const nextGroupLabel = copy.worldCup.group(groupLetter);

  form.elements.competitionName.placeholder = nextCompetitionName;
  if (
    !form.elements.competitionName.value.trim() ||
    form.elements.competitionName.value === lastAutoWorldCupCompetitionName
  ) {
    form.elements.competitionName.value = nextCompetitionName;
  }

  form.elements.roundLabel.placeholder = nextGroupLabel;
  if (
    !form.elements.roundLabel.value.trim() ||
    form.elements.roundLabel.value === lastAutoWorldCupGroupLabel
  ) {
    form.elements.roundLabel.value = nextGroupLabel;
  }

  lastAutoWorldCupCompetitionName = nextCompetitionName;
  lastAutoWorldCupGroupLabel = nextGroupLabel;

  if (!form.elements.outputName.value.trim()) {
    form.elements.outputName.placeholder = copy.worldCup.output(season, groupLetter);
  }

  syncRoundLabelFromRound();
  syncOutputNameFromSelections();
};

const applyTemplateHints = () => {
  const template = templateSelect.value;
  const isWorldCupTemplate =
    template === WORLD_CUP_TEMPLATE ||
    template === WORLD_CUP_KNOCKOUT_TEMPLATE ||
    template === TIERLIST_TEMPLATE;
  const shouldUseRounds = ROUND_TEMPLATES.has(template);
  const visibleFields = templateFieldVisibility[template] ?? templateFieldVisibility.results;

  leaguePresetField.hidden = !visibleFields.leaguePreset;
  leagueCoreFields.hidden = !visibleFields.leagueCore;
  roundField.hidden = !visibleFields.round;
  matchDateField.hidden = !visibleFields.matchDate;
  predictionEditorField.hidden = template !== 'predictions';
  resultEditorField.hidden = template !== 'results' && template !== CHAMPION_FINAL_TEMPLATE;
  standingsEditorField.hidden = template !== 'standings';
  worldCupStandingsEditorField.hidden = template !== WORLD_CUP_TEMPLATE;
  seasonVerdictEditorField.hidden = template !== SEASON_FINAL_VERDICT_TEMPLATE;
  tierlistEditorField.hidden = template !== TIERLIST_TEMPLATE;
  dataSection.hidden = !visibleFields.round && !visibleFields.matchDate;
  editorSection.hidden =
    template !== 'predictions' &&
    template !== 'results' &&
    template !== CHAMPION_FINAL_TEMPLATE &&
    template !== 'standings' &&
    template !== WORLD_CUP_TEMPLATE &&
    template !== SEASON_FINAL_VERDICT_TEMPLATE &&
    template !== TIERLIST_TEMPLATE;
  leagueOverrideFields.hidden = !visibleFields.leagueOverrides;
  worldCupFields.hidden = !visibleFields.worldCupFields;
  ctaField.hidden = !visibleFields.cta;
  championFinalFields.hidden = template !== CHAMPION_FINAL_TEMPLATE;

  form.elements.leagueId.required = visibleFields.leagueCore;
  form.elements.season.required = true;

  if (isWorldCupTemplate) {
    form.elements.leagueId.value = WORLD_CUP_LEAGUE_ID;
    form.elements.groupLetter.value = (form.elements.groupLetter.value || 'A').toUpperCase();
    if (template === TIERLIST_TEMPLATE && (!hasCustomLeagueTitle || !form.elements.leagueName.value.trim())) {
      const worldCupLeagueName =
        languageProfileSelect.value === 'en'
          ? `World Cup ${form.elements.season.value || '2026'}`
          : `Copa do Mundo ${form.elements.season.value || '2026'}`;
      form.elements.leagueName.value = worldCupLeagueName;
      lastAutoLeagueTitle = worldCupLeagueName;
      hasCustomLeagueTitle = false;
    }
    updateLocalizedDefaults();
  } else if (shouldUseRounds) {
    const hint =
      UPCOMING_FIXTURE_TEMPLATES.has(template)
        ? 'Auto-detect next upcoming round'
        : 'Auto-detect latest completed round';
    if (roundSelect.options.length > 0) {
      roundSelect.options[0].textContent = hint;
    }
  }

  updateLocalizedDefaults();
  updateDashboardMeta();
};

const setRoundOptions = (rounds, selectedRound = '') => {
  const template = templateSelect.value;
  const hint =
    UPCOMING_FIXTURE_TEMPLATES.has(template)
      ? 'Auto-detect next upcoming round'
      : 'Auto-detect latest completed round';

  const options = [`<option value="">${hint}</option>`].concat(
    rounds.map((round) => {
      const value = String(round);
      const selected = value === selectedRound ? ' selected' : '';
      return `<option value="${value}"${selected}>${value}</option>`;
    })
  );

  roundSelect.innerHTML = options.join('');
};

const setSelectedMatchDates = (dates) => {
  const selectedDates = normalizeSelectedDates(dates).filter(
    (dateValue) => availableMatchDates.includes(dateValue)
  );

  matchDateSelect.value = selectedDates.join(',');

  matchDateOptions.querySelectorAll('[data-date]').forEach((button) => {
    const dateValue = button.dataset.date ?? '';
    const isActive = dateValue ? selectedDates.includes(dateValue) : selectedDates.length === 0;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (matchDateSummary) {
    matchDateSummary.textContent = describeMatchDateSelection(selectedDates);
  }
};

const setMatchDateOptions = (dates, selectedDates = '') => {
  availableMatchDates = dates.map((dateValue) => String(dateValue));
  const selectedDateList = normalizeSelectedDates(selectedDates).filter((dateValue) =>
    availableMatchDates.includes(dateValue)
  );

  matchDateOptions.innerHTML = [
    `<button type="button" class="date-pill date-pill-all" data-date="" aria-pressed="false">
      <span class="date-pill-title">All</span>
      <span class="date-pill-meta">round</span>
    </button>`,
    ...availableMatchDates.map((dateValue) => {
      const {title, meta} = formatMatchDateParts(dateValue);
      return `<button type="button" class="date-pill" data-date="${escapeHtml(
        dateValue
      )}" aria-label="${escapeHtml(`Select ${dateValue}`)}" aria-pressed="false">
        <span class="date-pill-title">${escapeHtml(title)}</span>
        <span class="date-pill-meta">${escapeHtml(meta)}</span>
      </button>`;
    }),
  ].join('');
  setSelectedMatchDates(selectedDateList);
};

const setMatchDatePickerDisabled = (disabled) => {
  matchDateOptions.querySelectorAll('button').forEach((button) => {
    button.disabled = disabled;
  });
};

const loadRoundDates = async (preferredDate = form.elements.matchDate.value) => {
  const template = templateSelect.value;
  const leagueIdValue = form.elements.leagueId.value.trim();
  const seasonValue = form.elements.season.value.trim();
  const roundValue = roundSelect.value.trim();
  const languageProfile = languageProfileSelect.value || 'pt-br';
  const leagueId = Number(leagueIdValue);
  const season = Number(seasonValue);

  if (
    !ROUND_TEMPLATES.has(template) ||
    !leagueIdValue ||
    !seasonValue ||
    !roundValue ||
    !Number.isFinite(leagueId) ||
    !Number.isFinite(season)
  ) {
    setMatchDateOptions([], preferredDate);
    if (template === 'predictions') {
      await loadPredictionFixtures();
    } else if (template === 'results' || template === CHAMPION_FINAL_TEMPLATE) {
      await loadResultFixturesForEditor();
    }
    return;
  }

  try {
    setMatchDatePickerDisabled(true);
    setMatchDateOptions([], preferredDate);

    const response = await fetch(
      `${apiBase}/round-dates?leagueId=${encodeURIComponent(
        String(leagueId)
      )}&season=${encodeURIComponent(String(season))}&round=${encodeURIComponent(
        roundValue
      )}&languageProfile=${encodeURIComponent(languageProfile)}`
    );
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load match dates.');
    }

    setMatchDateOptions(data.dates ?? [], preferredDate);
    syncOutputNameFromSelections();
    log(`Loaded ${data.dates?.length ?? 0} match dates for ${roundValue}.`);
    if (template === 'predictions') {
      await loadPredictionFixtures();
    } else if (template === 'results' || template === CHAMPION_FINAL_TEMPLATE) {
      await loadResultFixturesForEditor();
    }
  } catch (error) {
    setMatchDateOptions([], preferredDate);
    syncOutputNameFromSelections();
    log(error instanceof Error ? error.message : String(error));
    if (template === 'predictions') {
      await loadPredictionFixtures();
    } else if (template === 'results' || template === CHAMPION_FINAL_TEMPLATE) {
      await loadResultFixturesForEditor();
    }
  } finally {
    setMatchDatePickerDisabled(false);
  }
};

const loadRounds = async (preferredRound = form.elements.round.value) => {
  const template = templateSelect.value;
  const leagueIdValue = form.elements.leagueId.value.trim();
  const seasonValue = form.elements.season.value.trim();
  const leagueId = Number(leagueIdValue);
  const season = Number(seasonValue);

  if (
    !ROUND_TEMPLATES.has(template) ||
    !leagueIdValue ||
    !seasonValue ||
    !Number.isFinite(leagueId) ||
    !Number.isFinite(season)
  ) {
    setRoundOptions([], preferredRound);
    setMatchDateOptions([], form.elements.matchDate.value);
    syncOutputNameFromSelections();
    if (template === 'predictions') {
      await loadPredictionFixtures();
    } else if (template === 'results' || template === CHAMPION_FINAL_TEMPLATE) {
      await loadResultFixturesForEditor();
    }
    return;
  }

  try {
    roundSelect.disabled = true;
    setRoundOptions([], preferredRound);

    const response = await fetch(
      `${apiBase}/rounds?leagueId=${encodeURIComponent(String(leagueId))}&season=${encodeURIComponent(String(season))}`
    );
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not load rounds.');
    }

    setRoundOptions(data.rounds ?? [], preferredRound);
    syncRoundLabelFromRound();
    await loadRoundDates(form.elements.matchDate.value);
    syncOutputNameFromSelections();
    log(`Loaded ${data.rounds?.length ?? 0} rounds for league ${leagueId} season ${season}.`);
  } catch (error) {
    setRoundOptions([], preferredRound);
    setMatchDateOptions([], form.elements.matchDate.value);
    syncOutputNameFromSelections();
    log(error instanceof Error ? error.message : String(error));
    if (template === 'predictions') {
      await loadPredictionFixtures();
    } else if (template === 'results' || template === CHAMPION_FINAL_TEMPLATE) {
      await loadResultFixturesForEditor();
    }
  } finally {
    roundSelect.disabled = false;
  }
};

const loadOptions = async () => {
  const response = await fetch(`${apiBase}/options`);
  const data = await response.json();

  allChannelProfiles = data.channelProfiles ?? [];
  allLeaguePresets = data.leaguePresets ?? [];

  templateSelect.innerHTML = data.templates
    .map((template) => `<option value="${template.value}">${template.label}</option>`)
    .join('');

  channelProfileSelect.innerHTML = allChannelProfiles
    .map((profile) => `<option value="${profile.value}">${profile.label}</option>`)
    .join('');

  languageProfileSelect.innerHTML = data.languageProfiles
    .map((profile) => `<option value="${profile.value}">${profile.label}</option>`)
    .join('');

  soundtrackSelect.innerHTML = data.soundtrackPresets
    .map((preset) => `<option value="${preset.value}">${preset.label}</option>`)
    .join('');

  const currentJob = data.currentJob;
  if (currentJob) {
    form.elements.template.value = currentJob.template;
    form.elements.channelProfile.value =
      currentJob.channelProfile ?? (currentJob.languageProfile === 'en' ? 'en' : 'pt');
    form.elements.leagueId.value = currentJob.leagueId;
    form.elements.season.value = currentJob.season;
    form.elements.round.value = currentJob.round ?? '';
    form.elements.matchDate.value = normalizeSelectedDates(currentJob.matchDates ?? currentJob.matchDate).join(',');
    form.elements.brandName.value = currentJob.brandName;
    form.elements.leagueName.value = currentJob.leagueName;
    form.elements.roundLabel.value =
      currentJob.roundLabel ?? currentJob.standingsLabel ?? currentJob.subtitleLabel ?? '';
    form.elements.outputName.value = currentJob.outputName;
    form.elements.languageProfile.value = currentJob.languageProfile ?? getChannelLanguageProfile(form.elements.channelProfile.value);
    form.elements.groupLetter.value = currentJob.groupLetter ?? 'A';
    form.elements.competitionName.value = currentJob.competitionName ?? '';
    form.elements.ctaText.value = currentJob.ctaText ?? '';
    form.elements.introTitle.value = currentJob.introTitle ?? '';
    form.elements.aiPriorityTeams.value = currentJob.aiPriorityTeams ?? '';
    form.elements.aiEditorialAngle.value = currentJob.aiEditorialAngle ?? '';
    form.elements.hookText.value = currentJob.hookText ?? '';
    form.elements.voiceoverText.value = currentJob.voiceoverText ?? '';
    form.elements.topScorerPrediction.value = currentJob.topScorerPrediction ?? '';
    form.elements.bestPlayerPrediction.value = currentJob.bestPlayerPrediction ?? '';
    voiceoverEnabledCheckbox.checked = currentJob.voiceoverEnabled !== false;
    form.elements.soundtrackPath.value = currentJob.soundtrackPath ?? '';
    setSoundtrackVolume(currentJob.soundtrackVolume ?? 0.2);
    renderLeaguePresetOptions(currentJob.leagueId ?? '');
    lastAutoLeagueTitle = presetSelect.selectedOptions?.[0]?.textContent?.trim() ?? currentJob.leagueName ?? '';
    hasCustomLeagueTitle =
      Boolean(currentJob.leagueName) &&
      Boolean(lastAutoLeagueTitle) &&
      currentJob.leagueName !== lastAutoLeagueTitle;
    lastAutoOutputName = currentJob.outputName ?? '';
    lastAutoSeason = String(currentJob.season ?? '');
    if (currentJob.template === WORLD_CUP_TEMPLATE) {
      lastAutoWorldCupCompetitionName = currentJob.competitionName ?? '';
      lastAutoWorldCupGroupLabel = currentJob.groupLabel ?? '';
    }
    hasCustomOutputName = false;
  } else {
    form.elements.template.value = 'results';
    form.elements.channelProfile.value = 'pt';
    form.elements.leagueId.value = 72;
    form.elements.season.value = 2026;
    form.elements.round.value = '';
    form.elements.matchDate.value = '';
    form.elements.brandName.value = 'Foot Analysis';
    form.elements.languageProfile.value = 'pt-br';
    form.elements.groupLetter.value = 'A';
    form.elements.competitionName.value = '';
    form.elements.ctaText.value = '';
    form.elements.introTitle.value = '';
    form.elements.aiPriorityTeams.value = '';
    form.elements.aiEditorialAngle.value = '';
    form.elements.hookText.value = '';
    form.elements.voiceoverText.value = '';
    form.elements.topScorerPrediction.value = '';
    form.elements.bestPlayerPrediction.value = '';
    voiceoverEnabledCheckbox.checked = true;
    form.elements.soundtrackPath.value = data.soundtrackPresets?.[0]?.value ?? '';
    setSoundtrackVolume(0.2);
    renderLeaguePresetOptions('72');
    syncSeasonFromContext({force: true});
    syncLeagueTitleFromPreset();
    lastAutoWorldCupCompetitionName = '';
    lastAutoWorldCupGroupLabel = '';
    hasCustomOutputName = false;
    hasCustomLeagueTitle = false;
  }

  syncLanguageFromChannel();
  applyTemplateHints();
  updateLocalizedDefaults();
  await loadRounds(currentJob?.round ?? '');
  await loadRoundDates(currentJob ? normalizeSelectedDates(currentJob.matchDates ?? currentJob.matchDate) : '');
  syncOutputNameFromSelections();
  renderCurrentJob(currentJob);
  updateDashboardMeta();
  loadShortDurations();
  const savedStudioUrl = localStorage.getItem(STUDIO_URL_KEY) || 'http://127.0.0.1:3000';
  studioUrlInput.value = savedStudioUrl;
  updatePreview();
  if (form.elements.template.value === 'predictions') {
    await loadPredictionFixtures();
  } else if (
    form.elements.template.value === 'results' ||
    form.elements.template.value === CHAMPION_FINAL_TEMPLATE
  ) {
    await loadResultFixturesForEditor();
    if (form.elements.template.value === CHAMPION_FINAL_TEMPLATE) {
      await loadChampionFinalOptions();
    }
  } else if (form.elements.template.value === 'standings') {
    await loadStandingsEditor();
  } else if (form.elements.template.value === SEASON_FINAL_VERDICT_TEMPLATE) {
    await loadSeasonFinalVerdictEditor();
  } else if (form.elements.template.value === TIERLIST_TEMPLATE) {
    await loadTierlistTeams();
  } else if (form.elements.template.value === WORLD_CUP_TEMPLATE) {
    await loadWorldCupStandingsEditor({preferPrepared: true});
  }
  log('Football dashboard ready.', true);
};

presetSelect.addEventListener('change', async () => {
  form.elements.leagueId.value = presetSelect.value;
  hasCustomLeagueTitle = false;
  syncSeasonFromContext();
  clearRoundLabelOverride();
  clearIntroOverrides();
  syncLeagueTitleFromPreset();
  syncOutputNameFromSelections();
  syncIntroPlaceholders();
  updateDashboardMeta();
  await loadRounds('');
  if (templateSelect.value === 'standings') {
    await loadStandingsEditor();
  }
  if (templateSelect.value === SEASON_FINAL_VERDICT_TEMPLATE) {
    await loadSeasonFinalVerdictEditor();
  }
  if (templateSelect.value === TIERLIST_TEMPLATE) {
    await loadTierlistTeams();
  }
  if (templateSelect.value === WORLD_CUP_TEMPLATE) {
    await loadWorldCupStandingsEditor();
  }
  if (templateSelect.value === CHAMPION_FINAL_TEMPLATE) {
    await loadChampionFinalOptions();
  }
});

channelProfileSelect.addEventListener('change', async () => {
  syncLanguageFromChannel();
  renderLeaguePresetOptions();
  hasCustomLeagueTitle = false;
  syncSeasonFromContext();
  clearRoundLabelOverride();
  clearIntroOverrides();
  syncLeagueTitleFromPreset();
  updateLocalizedDefaults();
  await loadRounds('');
  syncOutputNameFromSelections();
  syncIntroPlaceholders();
  updatePreview();
  updateDashboardMeta();
  if (templateSelect.value === 'predictions') {
    await loadPredictionFixtures();
  } else if (templateSelect.value === 'results' || templateSelect.value === CHAMPION_FINAL_TEMPLATE) {
    await loadResultFixturesForEditor();
    if (templateSelect.value === CHAMPION_FINAL_TEMPLATE) {
      await loadChampionFinalOptions();
    }
  } else if (templateSelect.value === 'standings') {
    await loadStandingsEditor();
  } else if (templateSelect.value === SEASON_FINAL_VERDICT_TEMPLATE) {
    await loadSeasonFinalVerdictEditor();
  } else if (templateSelect.value === TIERLIST_TEMPLATE) {
    await loadTierlistTeams();
  } else if (templateSelect.value === WORLD_CUP_TEMPLATE) {
    await loadWorldCupStandingsEditor();
  }
});

templateSelect.addEventListener('change', async () => {
  renderCurrentJob(null);
  setRenderDownload(null);
  syncSeasonFromContext();
  clearRoundLabelOverride();
  clearIntroOverrides();
  syncLeagueTitleFromPreset();
  applyTemplateHints();
  await loadRounds(form.elements.round.value);
  syncOutputNameFromSelections();
  syncIntroPlaceholders();
  updatePreview();
  updateDashboardMeta();
  if (templateSelect.value === 'predictions') {
    await loadPredictionFixtures();
    renderResultEditor([]);
    renderStandingsEditor([]);
    renderWorldCupStandingsEditor([]);
    renderSeasonVerdictEditor([]);
    renderTierlistEditor([]);
  } else if (templateSelect.value === 'results' || templateSelect.value === CHAMPION_FINAL_TEMPLATE) {
    await loadResultFixturesForEditor();
    if (templateSelect.value === CHAMPION_FINAL_TEMPLATE) {
      await loadChampionFinalOptions();
    }
    renderPredictionEditor([]);
    renderStandingsEditor([]);
    renderWorldCupStandingsEditor([]);
    renderSeasonVerdictEditor([]);
    renderTierlistEditor([]);
  } else if (templateSelect.value === 'standings') {
    await loadStandingsEditor();
    renderPredictionEditor([]);
    renderResultEditor([]);
    renderWorldCupStandingsEditor([]);
    renderSeasonVerdictEditor([]);
    renderTierlistEditor([]);
  } else if (templateSelect.value === SEASON_FINAL_VERDICT_TEMPLATE) {
    await loadSeasonFinalVerdictEditor();
    renderPredictionEditor([]);
    renderResultEditor([]);
    renderStandingsEditor([]);
    renderWorldCupStandingsEditor([]);
    renderTierlistEditor([]);
  } else if (templateSelect.value === TIERLIST_TEMPLATE) {
    await loadTierlistTeams();
    renderPredictionEditor([]);
    renderResultEditor([]);
    renderStandingsEditor([]);
    renderWorldCupStandingsEditor([]);
    renderSeasonVerdictEditor([]);
  } else if (templateSelect.value === WORLD_CUP_TEMPLATE) {
    await loadWorldCupStandingsEditor();
    renderPredictionEditor([]);
    renderResultEditor([]);
    renderStandingsEditor([]);
    renderSeasonVerdictEditor([]);
    renderTierlistEditor([]);
  } else {
    renderPredictionEditor([]);
    renderResultEditor([]);
    renderStandingsEditor([]);
    renderWorldCupStandingsEditor([]);
    renderSeasonVerdictEditor([]);
    renderTierlistEditor([]);
  }
});
languageProfileSelect.addEventListener('change', () => {
  updateLocalizedDefaults();
  syncRoundLabelFromRound();
  syncOutputNameFromSelections();
  syncIntroPlaceholders();
  updateDashboardMeta();
  if (templateSelect.value === 'predictions') {
    loadPredictionFixtures();
  } else if (templateSelect.value === 'results' || templateSelect.value === CHAMPION_FINAL_TEMPLATE) {
    loadResultFixturesForEditor();
    if (templateSelect.value === CHAMPION_FINAL_TEMPLATE) {
      loadChampionFinalOptions();
    }
  } else if (templateSelect.value === 'standings') {
    loadStandingsEditor();
  } else if (templateSelect.value === SEASON_FINAL_VERDICT_TEMPLATE) {
    loadSeasonFinalVerdictEditor();
  } else if (templateSelect.value === TIERLIST_TEMPLATE) {
    loadTierlistTeams();
  } else if (templateSelect.value === WORLD_CUP_TEMPLATE) {
    loadWorldCupStandingsEditor();
  }
});
generateShortCopyButton?.addEventListener('click', generateShortCopy);
roundSelect.addEventListener('change', () => {
  syncRoundLabelFromRound();
  loadRoundDates('');
  syncOutputNameFromSelections();
  updateDashboardMeta();
});
matchDateOptions.addEventListener('click', (event) => {
  const target = event.target.closest('[data-date]');

  if (!target || target.disabled) {
    return;
  }

  const dateValue = target.dataset.date ?? '';

  if (!dateValue) {
    setSelectedMatchDates([]);
  } else {
    const selectedDates = getSelectedMatchDates();
    const nextDates = selectedDates.includes(dateValue)
      ? selectedDates.filter((selectedDate) => selectedDate !== dateValue)
      : [...selectedDates, dateValue];
    setSelectedMatchDates(nextDates);
  }

  matchDateSelect.dispatchEvent(new Event('change', {bubbles: true}));
});
form.elements.groupLetter.addEventListener('change', () => {
  form.elements.groupLetter.value = (form.elements.groupLetter.value || 'A')
    .toUpperCase()
    .slice(0, 1);
  updateLocalizedDefaults();
  syncOutputNameFromSelections();
  syncIntroPlaceholders();
  updateDashboardMeta();
  if (templateSelect.value === WORLD_CUP_TEMPLATE) {
    loadWorldCupStandingsEditor();
  }
});
form.elements.leagueId.addEventListener('change', async () => {
  syncSeasonFromContext();
  hasCustomLeagueTitle = false;
  clearRoundLabelOverride();
  clearIntroOverrides();
  await loadRounds(form.elements.round.value);
  syncOutputNameFromSelections();
  syncIntroPlaceholders();
  updateDashboardMeta();
  if (templateSelect.value === 'standings') {
    await loadStandingsEditor();
  }
  if (templateSelect.value === SEASON_FINAL_VERDICT_TEMPLATE) {
    await loadSeasonFinalVerdictEditor();
  }
  if (templateSelect.value === TIERLIST_TEMPLATE) {
    await loadTierlistTeams();
  }
  if (templateSelect.value === WORLD_CUP_TEMPLATE) {
    await loadWorldCupStandingsEditor();
  }
});
form.elements.leagueName.addEventListener('input', () => {
  const currentValue = form.elements.leagueName.value.trim();
  hasCustomLeagueTitle = Boolean(currentValue) && currentValue !== lastAutoLeagueTitle;
  syncOutputNameFromSelections();
  syncIntroPlaceholders();
});
form.elements.season.addEventListener('change', async () => {
  updateLocalizedDefaults();
  await loadRounds(form.elements.round.value);
  syncOutputNameFromSelections();
  syncIntroPlaceholders();
  lastAutoSeason = String(form.elements.season.value || '').trim();
  updateDashboardMeta();
  if (templateSelect.value === 'standings') {
    await loadStandingsEditor();
  }
  if (templateSelect.value === SEASON_FINAL_VERDICT_TEMPLATE) {
    await loadSeasonFinalVerdictEditor();
  }
  if (templateSelect.value === TIERLIST_TEMPLATE) {
    await loadTierlistTeams();
  }
  if (templateSelect.value === WORLD_CUP_TEMPLATE) {
    await loadWorldCupStandingsEditor();
  }
});
form.elements.season.addEventListener('input', () => {
  updateLocalizedDefaults();
  syncOutputNameFromSelections();
  syncIntroPlaceholders();
  updateDashboardMeta();
});
form.elements.matchDate.addEventListener('change', () => {
  syncOutputNameFromSelections();
  updateDashboardMeta();
  if (templateSelect.value === 'predictions') loadPredictionFixtures();
  else if (templateSelect.value === 'results' || templateSelect.value === CHAMPION_FINAL_TEMPLATE)
    loadResultFixturesForEditor();
  else if (templateSelect.value === SEASON_FINAL_VERDICT_TEMPLATE) loadSeasonFinalVerdictEditor();
  else if (templateSelect.value === TIERLIST_TEMPLATE) loadTierlistTeams();
});
form.elements.soundtrackPath.addEventListener('change', syncOutputNameFromSelections);
soundtrackVolumeRange?.addEventListener('input', () => {
  setSoundtrackVolume(soundtrackVolumeRange.value);
});
form.elements.soundtrackVolume.addEventListener('input', () => {
  setSoundtrackVolume(form.elements.soundtrackVolume.value);
});
form.elements.competitionName.addEventListener('input', syncOutputNameFromSelections);
form.elements.outputName.addEventListener('input', () => {
  const currentValue = form.elements.outputName.value.trim();
  hasCustomOutputName = Boolean(currentValue) && currentValue !== lastAutoOutputName;
});
applyPreviewButton.addEventListener('click', updatePreview);
reloadPredictionsButton.addEventListener('click', loadPredictionFixtures);
reloadResultsButton.addEventListener('click', loadResultFixturesForEditor);
reloadStandingsButton.addEventListener('click', loadStandingsEditor);
reloadWorldCupStandingsButton.addEventListener('click', () =>
  loadWorldCupStandingsEditor({force: true})
);
reloadSeasonVerdictButton.addEventListener('click', loadSeasonFinalVerdictEditor);
reloadTierlistButton.addEventListener('click', loadTierlistTeams);
reloadChampionFinalButton.addEventListener('click', loadChampionFinalOptions);
settingsToggleButton.addEventListener('click', () => {
  settingsPanel.hidden = !settingsPanel.hidden;
  if (!settingsPanel.hidden) {
    loadShortDurations();
  }
});
saveShortDurationsButton.addEventListener('click', saveShortDurations);
reloadShortDurationsButton.addEventListener('click', loadShortDurations);
document.querySelectorAll('.youtube-oauth-button').forEach((button) => {
  button.addEventListener('click', () => startYouTubeOAuth(button.dataset.channel ?? 'pt'));
});
document.querySelectorAll('.tiktok-oauth-button').forEach((button) => {
  button.addEventListener('click', () => startTikTokOAuth(button.dataset.channel ?? 'pt'));
});
generatePublishingButton.addEventListener('click', generatePublishingDraft);
copyPublishingJsonButton.addEventListener('click', async () => {
  const draft = collectPublishingDraftFromFields();
  if (!draft) return;
  await copyText(JSON.stringify(draft, null, 2));
  setNoticeStatus(publishingStatus, 'Edited draft JSON copied.', 'success');
});
publishingDraftRoot.addEventListener('click', async (event) => {
  const tab = event.target.closest('[data-publishing-tab]');
  if (tab) {
    setActivePublishingPlatform(tab.dataset.publishingTab);
    return;
  }

  if (event.target.closest('#upload-youtube-button')) {
    await uploadYouTubeDraft();
    return;
  }

  if (event.target.closest('#upload-tiktok-button')) {
    await uploadTikTokDraft();
    return;
  }

  const button = event.target.closest('.copy-field-button');
  if (!button) return;
  const field = button.closest('.publishing-field')?.querySelector('textarea, input');
  await copyText(field?.value ?? '');
  setNoticeStatus(publishingStatus, 'Field copied.', 'success');
});

const submitJob = async (endpoint, actionLabel, options = {}) => {
  const silent = Boolean(options.silent);
  try {
    if (!silent) {
      setBusy(true);
      log(`${actionLabel}…`);
    }
    const payload = buildJobPayloadFromForm();
    Object.assign(payload, options.payloadOverrides ?? {});
    const response = await fetch(`${apiBase}${endpoint}`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Unknown error');
    }

    renderCurrentJob(data.job);
    setRenderDownload(data.job, data.render);
    updatePreview();
    if (silent && templateSelect.value === TIERLIST_TEMPLATE) {
      setNoticeStatus(tierlistEditorStatus, 'Preview updated.', 'success');
    } else {
      log(data.message || `${actionLabel} finished.`);
    }
    if (data.render?.outputPath) {
      log(`Rendered file: ${data.render.outputPath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (silent && templateSelect.value === TIERLIST_TEMPLATE) {
      setNoticeStatus(tierlistEditorStatus, message, 'error');
    } else {
      log(message);
    }
  } finally {
    if (!silent) {
      setBusy(false);
    }
  }
};

prepareButton.addEventListener('click', () => submitJob('/jobs/prepare', 'Preparing job'));
renderButton.addEventListener('click', () => submitJob('/jobs/render', 'Rendering video'));

loadOptions();
