const form = document.getElementById('thumbnail-form');
const channelProfileSelect = document.getElementById('channel-profile');
const presetSelect = document.getElementById('preset-select');
const thumbnailModelSelect = document.getElementById('thumbnail-model-select');
const backgroundPresetSelect = document.getElementById('background-preset-select');
const teamCountSelect = document.getElementById('team-count-select');
const teamSearchInput = document.getElementById('team-search-input');
const selectedTeamList = document.getElementById('selected-team-list');
const availableTeamList = document.getElementById('available-team-list');
const suggestButton = document.getElementById('suggest-button');
const prepareButton = document.getElementById('prepare-button');
const renderButton = document.getElementById('render-button');
const currentJobRoot = document.getElementById('current-job');
const renderDownloadRoot = document.getElementById('render-download');
const dashboardQuickStatus = document.getElementById('dashboard-quick-status');
const logOutput = document.getElementById('log-output');
const logoOptions = document.getElementById('logo-options');
const previewImage = document.getElementById('thumbnail-preview-image');
const previewEmpty = document.getElementById('thumbnail-preview-empty');

const apiBase = '/api/football/thumbnails';
const teamFieldPrefixes = ['A', 'B', 'C', 'D', 'E', 'F'];
let availableTeams = [];
let selectedTeams = [
  {label: 'Palmeiras', path: '/logos/palmeiras.png', accentColor: '#27AE60'},
  {label: 'Flamengo', path: '/logos/flamengo.png', accentColor: '#E3222A'},
  {label: 'Athletico', path: '/logos/atletico-paranaense.png', accentColor: '#E3222A'},
  {label: 'Santos', path: '/logos/santos.png', accentColor: '#F0F4F8'},
  {label: 'Remo', path: '/logos/remo.png', accentColor: '#1E5AA8'},
  {label: 'Botafogo', path: '/logos/botafogo.png', accentColor: '#F0F4F8'},
];

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const log = (message, replace = false) => {
  const timestamp = new Date().toLocaleTimeString();
  logOutput.textContent = replace ? `[${timestamp}] ${message}` : `${logOutput.textContent}\n[${timestamp}] ${message}`;
  logOutput.scrollTop = logOutput.scrollHeight;
};

const setBusy = (busy) => {
  suggestButton.disabled = busy;
  prepareButton.disabled = busy;
  renderButton.disabled = busy;
  channelProfileSelect.disabled = busy;
  presetSelect.disabled = busy;
  thumbnailModelSelect.disabled = busy;
  backgroundPresetSelect.disabled = busy;
  teamCountSelect.disabled = busy;
  teamSearchInput.disabled = busy;
};

const formDataToPayload = () => {
  syncSelectedTeamsToForm();
  return Object.fromEntries(new FormData(form).entries());
};

const normalizeTeamLabel = (value) =>
  String(value ?? '')
    .replace(/\.(png|jpg|jpeg|webp)$/i, '')
    .replace(/-\d+$/g, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const inferTeamAccentColor = (team) => {
  const label = `${team.label} ${team.path}`.toLowerCase();
  if (label.includes('flamengo') || label.includes('athletico') || label.includes('vitoria')) return '#E3222A';
  if (label.includes('corinthians') || label.includes('botafogo') || label.includes('santos')) return '#F0F4F8';
  if (label.includes('palmeiras') || label.includes('fluminense') || label.includes('goias')) return '#27AE60';
  if (label.includes('cruzeiro') || label.includes('bahia') || label.includes('gremio')) return '#1E5AA8';
  if (label.includes('fortaleza')) return '#1D4ED8';
  return '#A7FF12';
};

const normalizeAvailableTeam = (team) => ({
  label: normalizeTeamLabel(team.label || team.path),
  path: team.path,
  accentColor: team.accentColor || inferTeamAccentColor(team),
});

const syncSelectedTeamsToForm = () => {
  teamFieldPrefixes.forEach((prefix, index) => {
    const team = selectedTeams[index];
    form.elements[`team${prefix}Name`].value = team?.label ?? '';
    form.elements[`team${prefix}LogoPath`].value = team?.path ?? '';
    form.elements[`team${prefix}AccentColor`].value = team?.accentColor ?? '';
  });
};

const setChannelDefaults = () => {
  const isEnglish = channelProfileSelect.value === 'en';
  if (!form.elements.accentColor.value || ['#F0A500', '#0A84FF'].includes(form.elements.accentColor.value)) {
    form.elements.accentColor.value = isEnglish ? '#0A84FF' : '#F0A500';
  }
  dashboardQuickStatus.textContent = isEnglish
    ? 'Build a standalone English-channel thumbnail.'
    : 'Build a standalone Portuguese-channel thumbnail.';
};

const renderCurrentJob = (job) => {
  if (!job) {
    currentJobRoot.innerHTML = '';
    return;
  }

  const teams = [job.teamA, job.teamB, job.teamC, job.teamD, job.teamE, job.teamF]
    .map((team) => team?.label)
    .filter(Boolean)
    .join(' x ');
  currentJobRoot.innerHTML = `
    <div class="job-status-card">
      <div>
        <strong>${escapeHtml(job.headline)} • ${escapeHtml(job.leagueName)}</strong>
        <span>${escapeHtml(job.preset)} • ${escapeHtml(teams)} • ${escapeHtml(job.outputName)}</span>
      </div>
      <div class="job-status-meta">
        <span class="chip subtle">1920x1080</span>
        <span class="chip subtle">${escapeHtml(job.channelProfile ?? 'pt')}</span>
      </div>
    </div>
  `;
};

const setRenderDownload = (render) => {
  if (!render?.outputPath) {
    renderDownloadRoot.innerHTML = '';
    return;
  }

  const downloadPath = `/${render.outputPath.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
  const cacheBustedPath = `${downloadPath}?t=${Date.now()}`;
  previewImage.src = cacheBustedPath;
  previewImage.hidden = false;
  previewEmpty.hidden = true;
  renderDownloadRoot.innerHTML = `
    <div class="job-status-card job-download-card">
      <div>
        <strong>PNG ready</strong>
        <span>${escapeHtml(render.outputPath)}</span>
      </div>
      <a class="preview-link" href="${downloadPath}" download>Download PNG</a>
    </div>
  `;
};

const submitThumbnail = async (endpoint, actionLabel) => {
  const payload = formDataToPayload();
  setBusy(true);
  log(`${actionLabel}...`);

  try {
    const response = await fetch(`${apiBase}${endpoint}`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Unknown thumbnail error');
    }

    renderCurrentJob(data.job);
    if (data.render) {
      setRenderDownload(data.render);
    }
    dashboardQuickStatus.textContent = data.message || `${actionLabel} finished.`;
    log(dashboardQuickStatus.textContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    dashboardQuickStatus.textContent = message;
    log(message);
  } finally {
    setBusy(false);
  }
};

const suggestCopy = async () => {
  const payload = formDataToPayload();
  setBusy(true);
  log('Requesting copy suggestion...');

  try {
    const response = await fetch(`${apiBase}/suggest`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Could not generate thumbnail suggestion');
    }

    form.elements.headline.value = data.suggestion.headline || form.elements.headline.value;
    form.elements.subheadline.value = data.suggestion.subheadline || form.elements.subheadline.value;
    form.elements.extraLabel.value = data.suggestion.extraLabel || form.elements.extraLabel.value;
    dashboardQuickStatus.textContent = 'Suggestion applied. Review the copy before rendering.';
    log(dashboardQuickStatus.textContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    dashboardQuickStatus.textContent = message;
    log(message);
  } finally {
    setBusy(false);
  }
};

const loadLogoOptions = async () => {
  const response = await fetch(`${apiBase}/logos`);
  const data = await response.json();
  if (!response.ok || !data.ok) return;
  availableTeams = data.logos.map(normalizeAvailableTeam);
  logoOptions.innerHTML = data.logos
    .map((logo) => `<option value="${escapeHtml(logo.path)}">${escapeHtml(logo.label)}</option>`)
    .join('');
  renderTeamSelector();
};

const getVisibleAvailableTeams = () => {
  const query = teamSearchInput.value.trim().toLowerCase();
  const selectedPaths = new Set(selectedTeams.map((team) => team.path));
  return availableTeams
    .filter((team) => !selectedPaths.has(team.path))
    .filter((team) => !query || `${team.label} ${team.path}`.toLowerCase().includes(query))
    .slice(0, 36);
};

const renderSelectedTeams = () => {
  const maxTeams = Number(teamCountSelect.value) || 4;
  selectedTeams = selectedTeams.slice(0, maxTeams);
  selectedTeamList.innerHTML = Array.from({length: maxTeams}, (_, index) => {
    const team = selectedTeams[index];
    return `
      <div class="selected-team-slot${team ? ' filled' : ''}" data-slot="${index}">
        <span class="slot-index">${index + 1}</span>
        ${
          team
            ? `
              <img src="${escapeHtml(team.path)}" alt="" />
              <strong>${escapeHtml(team.label)}</strong>
              <input type="text" data-team-accent="${index}" value="${escapeHtml(team.accentColor)}" aria-label="${escapeHtml(team.label)} accent color" />
              <button type="button" class="secondary" data-remove-team="${index}">Remove</button>
            `
            : '<span class="empty-slot">Choose a team below</span>'
        }
      </div>
    `;
  }).join('');
  syncSelectedTeamsToForm();
};

const renderAvailableTeams = () => {
  const maxTeams = Number(teamCountSelect.value) || 4;
  const isFull = selectedTeams.length >= maxTeams;
  const teams = getVisibleAvailableTeams();
  availableTeamList.innerHTML = teams
    .map(
      (team) => `
        <button type="button" class="available-team-option" data-team-path="${escapeHtml(team.path)}" ${isFull ? 'disabled' : ''}>
          <img src="${escapeHtml(team.path)}" alt="" />
          <span>${escapeHtml(team.label)}</span>
        </button>
      `
    )
    .join('');
};

const renderTeamSelector = () => {
  renderSelectedTeams();
  renderAvailableTeams();
};

const applyBackgroundPreset = () => {
  const option = backgroundPresetSelect.selectedOptions?.[0];
  if (!option) return;
  form.elements.backgroundImagePath.value = option.value;
  form.elements.accentColor.value = option.dataset.accent || form.elements.accentColor.value;
  form.elements.secondaryAccentColor.value =
    option.dataset.secondary || form.elements.secondaryAccentColor.value;
};

channelProfileSelect.addEventListener('change', setChannelDefaults);
backgroundPresetSelect.addEventListener('change', applyBackgroundPreset);
teamCountSelect.addEventListener('change', renderTeamSelector);
teamSearchInput.addEventListener('input', renderAvailableTeams);
availableTeamList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-team-path]');
  if (!button || button.disabled) return;
  const team = availableTeams.find((candidate) => candidate.path === button.dataset.teamPath);
  if (!team) return;
  const maxTeams = Number(teamCountSelect.value) || 4;
  selectedTeams = [...selectedTeams, team].slice(0, maxTeams);
  renderTeamSelector();
});
selectedTeamList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-team]');
  if (!button) return;
  const index = Number(button.dataset.removeTeam);
  selectedTeams = selectedTeams.filter((_, teamIndex) => teamIndex !== index);
  renderTeamSelector();
});
selectedTeamList.addEventListener('input', (event) => {
  const input = event.target.closest('[data-team-accent]');
  if (!input) return;
  const index = Number(input.dataset.teamAccent);
  if (!selectedTeams[index]) return;
  selectedTeams[index] = {
    ...selectedTeams[index],
    accentColor: input.value,
  };
  syncSelectedTeamsToForm();
});
prepareButton.addEventListener('click', () => submitThumbnail('/prepare', 'Preparing thumbnail'));
renderButton.addEventListener('click', () => submitThumbnail('/render', 'Rendering thumbnail'));
suggestButton.addEventListener('click', suggestCopy);

setChannelDefaults();
applyBackgroundPreset();
loadLogoOptions();
