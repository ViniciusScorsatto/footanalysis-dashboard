import {escapeHtml, setNoticeStatus} from '../football/helpers.js';

const apiBase = '/api/football';
const $ = (id) => document.getElementById(id);
const storiesSeasonInput = $('stories-season');
const storiesCompetitionSelect = $('stories-competition');
const storiesRoundSelect = $('stories-round');
const analyzeStoriesButton = $('analyze-stories-button');
const storiesStatus = $('stories-status');
const storiesResults = $('stories-results');
const shortContentReview = $('short-content-review');
const shortContentVersion = $('short-content-version');
const shortContentStatus = $('short-content-status');
const contentTitleInput = $('content-title');
const contentHookInput = $('content-hook');
const contentVoiceoverInput = $('content-voiceover');
const contentScreenTextsInput = $('content-screen-texts');
const contentDescriptionInput = $('content-description');
const contentCtaInput = $('content-cta');
const contentTagsInput = $('content-tags');
const saveContentButton = $('save-content-button');
const regenerateContentButton = $('regenerate-content-button');
const readyContentButton = $('ready-content-button');
const shortVisualReview = $('short-visual-review');
const shortVisualStatusChip = $('short-visual-status-chip');
const shortVisualPreview = $('short-visual-preview');
const shortVisualStatus = $('short-visual-status');
const visualTemplateSelect = $('visual-template-select');
const visualDurationInput = $('visual-duration-input');
const generateVisualButton = $('generate-visual-button');
const readyVisualButton = $('ready-visual-button');
let currentStories = [];
let currentContent = null;
let currentVisualComposition = null;

const storyTypeLabels = {MUDANCA_LIDERANCA: 'Mudança de liderança', MUDANCA_G4_G6: 'Mudança no G4/G6', MUDANCA_Z4: 'Mudança no Z4', GOLEADA: 'Goleada', SEQUENCIA_VITORIAS: 'Sequência de vitórias', SEQUENCIA_SEM_VENCER: 'Sequência sem vencer', INVENCIBILIDADE: 'Invencibilidade', CORRIDA_TITULO: 'Corrida pelo título'};
const storyFormatLabels = {CLASSIFICACAO: 'Classificação', RESULTADO: 'Resultado', SEQUENCIA: 'Sequência', TITULO: 'Título', REBAIXAMENTO: 'Rebaixamento'};

const renderStories = (stories = []) => {
  currentStories = stories;
  storiesResults.innerHTML = stories.length ? stories.map((story) => `<article class="story-card ${story.status === 'REJEITADA' ? 'story-card--rejected' : ''}"><div class="story-card-score">${escapeHtml(String(story.pontuacao))}</div><div class="story-card-body"><div class="story-card-meta"><span>${escapeHtml(storyTypeLabels[story.tipo] ?? story.tipo)}</span><span>${escapeHtml(story.status)}</span></div><h3>${escapeHtml(story.titulo)}</h3><p>${escapeHtml(story.resumo)}</p><small>${escapeHtml(story.justificativa)}</small><div class="story-card-footer"><span>Times: ${escapeHtml((story.times ?? []).join(' · ') || '—')}</span><span>Formato: ${escapeHtml(storyFormatLabels[story.formatoRecomendado] ?? story.formatoRecomendado)}</span></div>${story.status === 'DETECTADA' ? `<button type="button" class="ds-button ds-button--secondary btn btn-secondary story-action-button" data-story-action="approve" data-story-id="${escapeHtml(story.id)}">Aprovar história</button>` : ''}${story.status === 'APROVADA' ? `<button type="button" class="ds-button ds-button--primary btn btn-primary story-action-button" data-story-action="generate" data-story-id="${escapeHtml(story.id)}">Gerar conteúdo</button>` : ''}${story.status === 'CONTEUDO_GERADO' ? `<button type="button" class="ds-button ds-button--secondary btn btn-secondary story-action-button" data-story-action="view-content" data-story-id="${escapeHtml(story.id)}">Ver conteúdo</button><button type="button" class="ds-button ds-button--secondary btn btn-secondary story-action-button" data-story-action="generate" data-story-id="${escapeHtml(story.id)}">Gerar novamente</button>` : ''}</div></article>`).join('') : '<div class="empty-state">Nenhuma história forte foi encontrada nesta rodada.</div>';
};

const renderContent = (content) => {
  currentContent = content;
  if (!content) { shortContentReview.hidden = true; return; }
  shortContentReview.hidden = false;
  shortContentVersion.textContent = `v${content.version} · ${content.status}`;
  contentTitleInput.value = content.titulo ?? '';
  contentHookInput.value = content.hook ?? '';
  contentVoiceoverInput.value = content.voiceover ?? '';
  contentScreenTextsInput.value = (content.screenTexts ?? []).map((item) => `${item.type}: ${item.text}`).join('\n');
  contentDescriptionInput.value = content.descricao ?? '';
  contentCtaInput.value = content.cta ?? '';
  contentTagsInput.value = (content.tags ?? []).join(', ');
  currentVisualComposition = null;
  shortVisualPreview.innerHTML = '';
  shortVisualReview.hidden = false;
  setNoticeStatus(shortVisualStatus, 'Gere um preview para montar a composição visual.', 'info');
};

const renderVisualComposition = (composition) => {
  currentVisualComposition = composition;
  if (!composition) { shortVisualReview.hidden = true; return; }
  shortVisualReview.hidden = false;
  shortVisualStatusChip.textContent = `v${composition.version} · ${composition.status}`;
  visualTemplateSelect.value = composition.template ?? '';
  visualDurationInput.value = composition.durationSeconds ?? '';
  shortVisualPreview.innerHTML = `<div class="visual-preview-frame"><div class="visual-preview-stripe"></div><div class="visual-preview-meta">${escapeHtml(String(composition.metadata?.competition ?? 'BRASILEIRÃO').toUpperCase())}<span>${escapeHtml(String(composition.metadata?.round ?? ''))}</span></div><div class="visual-preview-scenes">${(composition.scenes ?? []).map((scene) => `<div class="visual-preview-scene"><span class="visual-preview-scene-label">${escapeHtml(scene.type)}</span>${(scene.texts ?? []).map((item) => `<strong>${escapeHtml(item.text)}</strong>`).join('')}</div>`).join('')}</div><div class="visual-preview-brand">FOOT ANALYSIS</div></div><div class="visual-preview-timeline">${(composition.scenes ?? []).map((scene) => `<span style="flex:${scene.durationInFrames}">${escapeHtml(scene.type)} · ${Math.round(scene.durationInFrames / composition.fps * 10) / 10}s</span>`).join('')}</div>`;
};

const json = async (url, options) => { const response = await fetch(url, options); const data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.error || data.validation?.errors?.join(' ') || 'Não foi possível concluir a operação.'); return data; };
const post = (url, body) => json(`${apiBase}${url}`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});

const loadStoryRounds = async () => { try { const data = await json(`${apiBase}/stories/rounds?leagueId=${encodeURIComponent(storiesCompetitionSelect.value)}&season=${Number(storiesSeasonInput.value)}`); storiesRoundSelect.innerHTML = '<option value="">Selecione a rodada</option>' + (data.rounds ?? []).map((round) => `<option value="${escapeHtml(round.round)}">${escapeHtml(round.round)} · ${round.finishedCount}/${round.fixtureCount} finalizados</option>`).join(''); setNoticeStatus(storiesStatus, `${data.rounds?.length ?? 0} rodadas disponíveis no banco local.`, 'info'); } catch (error) { setNoticeStatus(storiesStatus, error.message, 'error'); } };
const analyzeStories = async () => { const round = storiesRoundSelect.value; if (!round) return setNoticeStatus(storiesStatus, 'Selecione uma rodada antes de analisar.', 'warning'); analyzeStoriesButton.disabled = true; setNoticeStatus(storiesStatus, 'Analisando resultados, tabela e sequências…', 'info'); try { const data = await post('/stories/analyze', {leagueId: Number(storiesCompetitionSelect.value), season: Number(storiesSeasonInput.value), round, competitionName: storiesCompetitionSelect.options[storiesCompetitionSelect.selectedIndex]?.textContent ?? 'Brasileirão Série A'}); renderStories(data.stories); setNoticeStatus(storiesStatus, `${data.selecionadas} história(s) selecionada(s), ${data.descartadas} descartada(s).`, 'success'); } catch (error) { setNoticeStatus(storiesStatus, error.message, 'error'); } finally { analyzeStoriesButton.disabled = false; } };
const approveStory = async (storyId) => { const data = await post('/stories/status', {storyId, status: 'APROVADA'}); currentStories = currentStories.map((story) => story.id === storyId ? data.story : story); renderStories(currentStories); setNoticeStatus(storiesStatus, 'História aprovada. Agora você pode gerar o conteúdo editorial.', 'success'); };
const generateContent = async (storyId) => { const data = await post('/short-content/generate', {storyId}); renderContent(data.content); currentStories = currentStories.map((story) => story.id === storyId ? {...story, status: 'CONTEUDO_GERADO'} : story); renderStories(currentStories); setNoticeStatus(shortContentStatus, `Conteúdo ${data.content.version} gerado e validado em português.`, 'success'); shortContentReview.scrollIntoView({behavior: 'smooth', block: 'nearest'}); };
const loadContent = async (storyId) => { const data = await json(`${apiBase}/short-content?storyId=${encodeURIComponent(storyId)}&limit=1`); renderContent(data.contents[0]); const visual = await json(`${apiBase}/short-visual?contentId=${encodeURIComponent(data.contents[0].id)}`); if (visual.composition) renderVisualComposition(visual.composition); shortContentReview.scrollIntoView({behavior: 'smooth', block: 'nearest'}); };
const saveContent = async () => { if (!currentContent) return; const screenTexts = contentScreenTextsInput.value.split('\n').map((line, index) => { const separator = line.indexOf(':'); return separator > 0 ? {type: line.slice(0, separator).trim().toUpperCase(), text: line.slice(separator + 1).trim()} : {type: index === 0 ? 'PRIMARY' : 'SUPPORT', text: line.trim()}; }).filter((item) => item.text); const data = await post('/short-content/update', {storyId: currentContent.storyId, content: {titulo: contentTitleInput.value, hook: contentHookInput.value, voiceover: contentVoiceoverInput.value, roteiro: `${contentHookInput.value} ${contentVoiceoverInput.value}`, screenTexts, descricao: contentDescriptionInput.value, cta: contentCtaInput.value, tags: contentTagsInput.value.split(',').map((tag) => tag.trim()).filter(Boolean)}}); renderContent(data.content); setNoticeStatus(shortContentStatus, 'Edição salva e validada.', 'success'); };
const markContentReady = async () => { if (!currentContent) return; const data = await post('/short-content/status', {contentId: currentContent.id, status: 'PRONTO_PARA_VIDEO'}); renderContent(data.content); setNoticeStatus(shortContentStatus, 'Conteúdo marcado como pronto para vídeo.', 'success'); };
const generateVisual = async () => { const data = await post('/short-visual/generate', {contentId: currentContent.id, templateOverride: visualTemplateSelect.value || undefined, durationSeconds: Number(visualDurationInput.value) || undefined}); renderVisualComposition(data.composition); setNoticeStatus(shortVisualStatus, `Preview validado: ${data.composition.template}, ${data.composition.durationSeconds}s, ${data.composition.scenes.length} cenas.`, 'success'); };
const markVisualReady = async () => { const data = await post('/short-visual/status', {compositionId: currentVisualComposition.id, status: 'PRONTO_PARA_RENDER'}); renderVisualComposition(data.composition); setNoticeStatus(shortVisualStatus, 'Composição pronta para renderização.', 'success'); };

storiesSeasonInput.addEventListener('change', loadStoryRounds);
storiesCompetitionSelect.addEventListener('change', loadStoryRounds);
analyzeStoriesButton.addEventListener('click', analyzeStories);
storiesResults.addEventListener('click', async (event) => { const button = event.target.closest('[data-story-action]'); if (!button) return; button.disabled = true; try { if (button.dataset.storyAction === 'approve') await approveStory(button.dataset.storyId); if (button.dataset.storyAction === 'generate') await generateContent(button.dataset.storyId); if (button.dataset.storyAction === 'view-content') await loadContent(button.dataset.storyId); } catch (error) { setNoticeStatus(storiesStatus, error.message, 'error'); } finally { button.disabled = false; } });
generateVisualButton.addEventListener('click', async () => { try { await generateVisual(); } catch (error) { setNoticeStatus(shortVisualStatus, error.message, 'error'); } });
readyVisualButton.addEventListener('click', async () => { try { await markVisualReady(); } catch (error) { setNoticeStatus(shortVisualStatus, error.message, 'error'); } });
saveContentButton.addEventListener('click', async () => { try { await saveContent(); } catch (error) { setNoticeStatus(shortContentStatus, error.message, 'error'); } });
regenerateContentButton.addEventListener('click', async () => { try { await generateContent(currentContent?.storyId); } catch (error) { setNoticeStatus(shortContentStatus, error.message, 'error'); } });
readyContentButton.addEventListener('click', async () => { try { await markContentReady(); } catch (error) { setNoticeStatus(shortContentStatus, error.message, 'error'); } });
loadStoryRounds();
