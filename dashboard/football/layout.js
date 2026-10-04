// Reorganize existing controls without duplicating their IDs, form values or listeners.
const form = document.querySelector('#job-form');
const command = form.querySelector('.football-command-bar');
const title = command.querySelector('.command-title');
form.prepend(title);
const heading = document.createElement('h2');heading.textContent = 'Configuração';command.prepend(heading);
const workspace = document.createElement('div');workspace.className = 'studio-workspace';
const controls = document.createElement('div');controls.className = 'studio-controls';
form.append(workspace);workspace.append(controls);controls.append(command);
const detailsPanel = form.querySelector('.compact-form-panel');
const intro = detailsPanel.querySelector('#intro-voiceover-field');
const advanced = [...detailsPanel.querySelectorAll(':scope > details')].find((node) => node !== intro);
const accordion = (label) => {
  const element = document.createElement('details');element.className = 'studio-disclosure';
  const summary = document.createElement('summary');summary.textContent = label;element.append(summary);
  const body = document.createElement('div');body.className = 'studio-disclosure-body';element.append(body);
  return {element, body};
};
const data = accordion('Dados e ajustes');
detailsPanel.querySelector(':scope > .panel-header')?.remove();
data.body.append(detailsPanel);controls.append(data.element);
const audio = accordion('Trilha sonora');
for (const selector of ['#soundtrack-select', '#soundtrack-volume-range']) {
  const field = advanced.querySelector(selector)?.closest('label');if (field) audio.body.append(field);
}
controls.append(audio.element, intro, advanced);
intro.classList.add('studio-disclosure');advanced.classList.add('studio-disclosure');
intro.querySelector('summary').textContent = 'Intro e narração';
advanced.querySelector('summary').textContent = 'Avançado';
const narration = document.createElement('span');narration.className = 'studio-narration-state';intro.querySelector('summary').append(narration);
const checkbox = form.querySelector('input[type=checkbox][name=voiceoverEnabled]');
const updateNarration = () => {narration.textContent = checkbox.checked ? 'Ativada' : 'Desativada';};
checkbox.addEventListener('change', updateNarration);intro.addEventListener('toggle', updateNarration);updateNarration();
// Options load asynchronously; reflect restored jobs without polling or altering their value.
new MutationObserver(updateNarration).observe(document.querySelector('#current-job'), {childList: true, subtree: true});
workspace.append(form.querySelector('.preview-rail'));
form.querySelector('.production-grid').remove();
const frame = document.querySelector('#preview-frame');
const empty = document.createElement('div');empty.className = 'studio-preview-empty';
const emptyTitle = document.createElement('strong');emptyTitle.textContent = 'Prévia do vídeo';
const emptyNote = document.createElement('p');emptyNote.textContent = 'Prepare os dados para visualizar.';
empty.append(emptyTitle, emptyNote);frame.parentElement.append(empty);
const syncPreview = () => {
  const src = frame.getAttribute('src');
  empty.hidden = Boolean(src && src !== 'about:blank' && src !== '/online/preview');
  frame.style.visibility = empty.hidden ? 'visible' : 'hidden';
};
new MutationObserver(syncPreview).observe(frame, {attributes: true, attributeFilter: ['src']});syncPreview();
document.querySelector('.studio-create-link').setAttribute('aria-current', location.pathname.includes('football-static') ? 'false' : 'page');
