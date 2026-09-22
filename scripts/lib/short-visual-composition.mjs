export const VISUAL_CONFIG = Object.freeze({
  width: 1080,
  height: 1920,
  fps: 30,
  aspectRatio: '9:16',
  safeArea: {top: 148, right: 72, bottom: 190, left: 72},
  timing: {hook: 0.2, main: 0.45, consequence: 0.2, cta: 0.15},
  colors: {bg: '#0b0d12', surface: '#0f1318', card: '#141c24', border: '#1e2a3a', gold: '#F0A500', silver: '#c0ccd8', steel: '#3a5060', white: '#f0f4f8', danger: '#E74C3C', win: '#27AE60'},
});

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const storyType = (story) => story?.tipo ?? story?.story_type ?? story?.metadata?.sourceStoryType ?? '';
const format = (content) => content?.formato ?? content?.format ?? 'RESULTADO';
const sourceTeams = (story) => story?.times ?? story?.teams ?? [];

export const selectVisualTemplate = ({content, story} = {}) => {
  const type = storyType(story);
  const contentFormat = format(content);
  if (type === 'ARTILHARIA' || contentFormat === 'ARTILHARIA') return 'ARTILHARIA';
  if (type === 'DOMINIO_ESTATISTICO' || type === 'VITORIA_EFICIENCIA' || type === 'RESULTADO_CRUEL' || type === 'PLACAR_ENGANOSO' || contentFormat === 'ESTATISTICAS') return 'ESTATISTICA_COMPARATIVA';
  if (type === 'SEQUENCIA_VITORIAS' || type === 'SEQUENCIA_SEM_VENCER' || type === 'INVENCIBILIDADE' || contentFormat === 'SEQUENCIA') return 'SEQUENCIA';
  if (type === 'MUDANCA_Z4' || type === 'LUTA_REBAIXAMENTO' || contentFormat === 'REBAIXAMENTO') return 'REBAIXAMENTO';
  if (type === 'MUDANCA_LIDERANCA' || type === 'MUDANCA_G4_G6' || type === 'CORRIDA_TITULO' || contentFormat === 'CLASSIFICACAO') return 'CLASSIFICACAO_DESTAQUE';
  if (contentFormat === 'RESUMO_RODADA') return 'RESUMO_RODADA';
  return 'RESULTADO_DESTAQUE';
};

const templateVariant = (template) => ({
  RESULTADO_DESTAQUE: 'results', CLASSIFICACAO_DESTAQUE: 'championship', SEQUENCIA: 'championship',
  ESTATISTICA_COMPARATIVA: 'results', ARTILHARIA: 'championship', RESUMO_RODADA: 'results', REBAIXAMENTO: 'relegation',
}[template] ?? 'results');

const buildText = (text, role, y, safeArea, overrides = {}) => ({
  text: clean(text), role, x: safeArea.left, y, width: 1080 - safeArea.left - safeArea.right, height: overrides.height ?? 120,
  fontSize: overrides.fontSize ?? (role === 'HEADLINE' ? 78 : role === 'CTA' ? 44 : role === 'STAT' ? 64 : 34),
  align: overrides.align ?? 'center', color: overrides.color ?? (role === 'STAT' ? '#F0A500' : '#f0f4f8'),
  fontFamily: role === 'LABEL' ? 'Audiowide Teaser' : role === 'STAT' ? 'Oxanium Teaser' : 'Orbitron Teaser',
});

const splitScreenTexts = (content) => {
  const entries = Array.isArray(content?.screenTexts) ? content.screenTexts : [];
  return Object.fromEntries(entries.map((entry) => [String(entry.type ?? '').toUpperCase(), clean(entry.text)]).filter(([, text]) => text));
};

const distributeTiming = (durationInFrames, timing) => {
  const hook = Math.max(1, Math.round(durationInFrames * timing.hook));
  const main = Math.max(1, Math.round(durationInFrames * timing.main));
  const consequence = Math.max(1, Math.round(durationInFrames * timing.consequence));
  return {hook, main, consequence, cta: Math.max(1, durationInFrames - hook - main - consequence)};
};

const scene = (id, type, from, durationInFrames, texts, data = {}) => ({id, type, from, durationInFrames, texts, data, transition: 'FADE_CURTO'});

export const buildShortVisualComposition = ({content, story, assets = [], options = {}} = {}) => {
  const config = {...VISUAL_CONFIG, ...options, safeArea: {...VISUAL_CONFIG.safeArea, ...(options.safeArea ?? {})}, timing: {...VISUAL_CONFIG.timing, ...(options.timing ?? {})}};
  const durationSeconds = Number(content?.duracaoEstimada?.seconds ?? options.durationSeconds ?? 11);
  const durationInFrames = Math.max(config.fps * 5, Math.round(durationSeconds * config.fps));
  const template = options.templateOverride || selectVisualTemplate({content, story});
  const text = splitScreenTexts(content);
  const timing = distributeTiming(durationInFrames, config.timing);
  const teams = sourceTeams(story).map((name, index) => ({name: clean(name), ...(assets[index] ?? {})}));
  const safe = config.safeArea;
  const mainTexts = [
    text.PRIMARY && buildText(text.PRIMARY, 'SUBHEADLINE', 710, safe, {height: 150, fontSize: 42}),
    text.STAT && buildText(text.STAT, 'STAT', 920, safe, {height: 100}),
  ].filter(Boolean);
  const scenes = [
    scene('hook', 'HOOK', 0, timing.hook, [buildText(text.HOOK || content?.hook, 'HEADLINE', 330, safe, {height: 250})], {template}),
    scene('main', 'MAIN', timing.hook, timing.main, mainTexts, {template, teams, scoreline: text.STAT ?? null}),
    scene('consequence', 'CONSEQUENCE', timing.hook + timing.main, timing.consequence, [buildText(text.CONSEQUENCE || content?.descricao, 'SUBHEADLINE', 1040, safe, {height: 220, fontSize: 42})], {template}),
    scene('cta', 'CTA', timing.hook + timing.main + timing.consequence, timing.cta, [buildText(text.CTA || content?.cta, 'CTA', 1420, safe, {height: 140})], {template}),
  ];
  return {
    id: `${content.id}:visual-v${options.version ?? 1}`,
    contentId: content.id,
    template,
    templateVariant: templateVariant(template),
    resolution: {width: config.width, height: config.height, aspectRatio: config.aspectRatio},
    width: config.width,
    height: config.height,
    fps: config.fps,
    durationInFrames,
    durationSeconds,
    scenes,
    assets: teams,
    safeAreas: {top: safe.top, right: safe.right, bottom: safe.bottom, left: safe.left, center: {x: safe.left, width: config.width - safe.left - safe.right}},
    animations: {entrance: 'SLIDE_FADE', transition: 'FADE_CURTO', stat: 'POP'},
    colors: config.colors,
    metadata: {
      competition: content.competition,
      competitionLogoPath: 'branding/competition-badge-brasileirao.svg',
      season: content.season,
      round: content.round,
      storyId: content.storyId,
      sourceStoryType: storyType(story),
    },
    version: options.version ?? 1,
    status: 'COMPOSICAO_GERADA',
  };
};

export const validateShortVisualComposition = (composition, content) => {
  const errors = []; const warnings = [];
  if (composition.width !== 1080 || composition.height !== 1920 || composition.resolution?.aspectRatio !== '9:16') errors.push('A composição deve usar 1080x1920 em proporção 9:16.');
  if (composition.fps !== 30 || !Number.isInteger(composition.durationInFrames) || composition.durationInFrames <= 0) errors.push('FPS ou duração da composição inválidos.');
  if (!Array.isArray(composition.scenes) || composition.scenes.length < 4) errors.push('A composição precisa de pelo menos quatro cenas.');
  const safe = composition.safeAreas;
  for (const sceneItem of composition.scenes ?? []) {
    if (sceneItem.from < 0 || sceneItem.durationInFrames <= 0) errors.push(`Cena inválida: ${sceneItem.id}.`);
    for (const text of sceneItem.texts ?? []) {
      if (!clean(text.text)) errors.push(`Texto vazio na cena ${sceneItem.id}.`);
      if (text.x < safe.left || text.x + text.width > composition.width - safe.right || text.y < safe.top || text.y + text.height > composition.height - safe.bottom) errors.push(`Texto fora da safe area na cena ${sceneItem.id}.`);
      if (text.fontSize < 18) errors.push(`Texto abaixo do tamanho mínimo na cena ${sceneItem.id}.`);
    }
  }
  const last = composition.scenes.at(-1);
  if (last && last.from + last.durationInFrames !== composition.durationInFrames) errors.push('As cenas não cobrem exatamente a duração total.');
  if (!content?.titulo || !content?.hook || !content?.cta) errors.push('Conteúdo sem título, hook ou CTA obrigatório.');
  if ((composition.assets ?? []).some((asset) => !asset.logoPath)) warnings.push('Um ou mais times estão usando fallback sem logo.');
  return {valid: errors.length === 0, errors, warnings};
};
