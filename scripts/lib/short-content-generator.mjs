export const CONTENT_STATUSES = Object.freeze({
  DRAFT: 'RASCUNHO',
  GENERATED: 'GERADO',
  APPROVED: 'APROVADO',
  REJECTED: 'REJEITADO',
  READY: 'PRONTO_PARA_VIDEO',
  VIDEO_GENERATED: 'VIDEO_GERADO',
});

export const CONTENT_CONFIG = Object.freeze({
  language: 'pt-BR',
  wordsPerMinute: 155,
  minTitleCharacters: 12,
  maxTitleCharacters: 72,
  minYoutubeTags: 20,
  maxYoutubeTags: 28,
  maxTagCharacters: 500,
  maxHashtags: 8,
  targetSeconds: {
    SHORT_RAPIDO: {min: 8, max: 10},
    SHORT_PADRAO: {min: 10, max: 15},
    SHORT_EXPLICATIVO: {min: 15, max: 25},
  },
});

const clean = (value, fallback = '') => String(value ?? fallback).replace(/\s+/g, ' ').trim();
const upper = (value) => clean(value).toUpperCase();
const first = (values, fallback = '') => values.map((value) => clean(value)).find(Boolean) ?? fallback;
const unique = (values) => [...new Set(values.map((value) => clean(value)).filter(Boolean))];
const slug = (value) => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const storyTeams = (story) => unique(story.times ?? story.teams ?? []);
const storyPlayers = (story) => unique(story.jogadores ?? story.players ?? []);
const evidenceValue = (story, metric) => (story.evidencias ?? story.evidence ?? []).find((item) => item.metrica === metric)?.valor;
const pointsFromEvidence = (story) => {
  const evidence = story.evidencias ?? story.evidence ?? [];
  const item = evidence.find((entry) => entry.metrica === 'pontos' || entry.metrica === 'vantagem');
  return item?.depois ?? item?.valor;
};

const formatNumber = (value) => Number.isFinite(Number(value)) ? String(Number(value)) : clean(value);
const formatTeamPair = (story) => storyTeams(story).slice(0, 2).join(' e ');

const strategyFor = (story) => {
  const format = story.formatoRecomendado ?? story.formato ?? 'RESULTADO';
  if (format === 'CLASSIFICACAO') return 'classification';
  if (format === 'REBAIXAMENTO') return 'relegation';
  if (format === 'SEQUENCIA') return 'streak';
  if (format === 'ESTATISTICAS') return 'statistics';
  if (format === 'ARTILHARIA') return 'scoring';
  if (format === 'TITULO') return 'title';
  if (format === 'RESUMO_RODADA') return 'round-summary';
  return 'result';
};

const contextualCta = (story, strategy) => {
  if (strategy === 'classification' || story.tipo === 'MUDANCA_LIDERANCA') return 'Quem termina campeão?';
  if (strategy === 'relegation' || story.tipo === 'MUDANCA_Z4') return 'Quem consegue escapar?';
  if (strategy === 'statistics' || story.tipo === 'DOMINIO_ESTATISTICO' || story.tipo === 'VITORIA_EFICIENCIA') return 'O placar refletiu o jogo?';
  if (strategy === 'streak') return 'Até onde esse time pode chegar?';
  if (strategy === 'scoring') return 'Quem termina artilheiro?';
  if (strategy === 'title') return 'Quem aguenta a pressão até o fim?';
  if (story.tipo === 'GOLEADA') return 'Foi a atuação da rodada?';
  return 'Qual foi a história da rodada?';
};

const buildEditorial = (story) => {
  const strategy = strategyFor(story);
  const competition = clean(story.competition_name ?? story.competicao ?? 'Brasileirão');
  const summary = first([story.summary, story.resumo], 'A rodada trouxe uma mudança importante.');
  const title = first([story.title, story.titulo], `${competition}: a rodada mudou de cenário`);
  const teams = storyTeams(story);
  const players = storyPlayers(story);
  const pair = formatTeamPair(story);
  let hook = 'A rodada acabou, mas a disputa ficou ainda mais quente.';
  let primary = summary;
  let consequence = 'Esse resultado muda o contexto da competição.';
  if (story.tipo === 'MUDANCA_LIDERANCA') {
    hook = 'Tem novo líder no Brasileirão.';
    primary = teams[0] ? `${teams[0]} assumiu a liderança da competição.` : summary;
    consequence = teams[1] ? `${teams[1]} perdeu a ponta, e a disputa ficou aberta.` : consequence;
  } else if (story.tipo === 'MUDANCA_Z4' || strategy === 'relegation') {
    hook = teams[0] ? `${teams[0]} está no limite do rebaixamento.` : 'A luta contra o rebaixamento apertou.';
    primary = summary;
    consequence = 'Cada ponto agora pode mudar a linha de segurança.';
  } else if (story.tipo === 'GOLEADA') {
    hook = teams[0] ? `${teams[0]} atropelou o adversário.` : 'A rodada teve uma goleada pesada.';
    primary = summary;
    consequence = 'Foi um dos resultados mais impactantes da rodada.';
  } else if (strategy === 'streak') {
    hook = title.replace(/[!.]+$/, '.') || 'A sequência não para.';
    primary = summary;
    consequence = 'O momento muda o peso desse time na disputa.';
  } else if (strategy === 'statistics') {
    hook = 'Os números contam uma história diferente.';
    primary = summary;
    consequence = 'A leitura do jogo vai além do placar.';
  } else if (strategy === 'scoring' && players[0]) {
    hook = `${players[0]} disparou na artilharia.`;
    primary = summary;
    consequence = 'A briga pelo topo ganhou um novo protagonista.';
  } else if (strategy === 'title') {
    hook = 'A corrida pelo título esquentou.';
    primary = summary;
    consequence = 'A pressão sobre os candidatos aumentou.';
  }
  const cta = contextualCta(story, strategy);
  const voiceover = `${hook} ${primary} ${consequence} ${cta}`;
  return {strategy, competition, title, hook, primary, consequence, cta, voiceover, teams, players, pair, points: pointsFromEvidence(story), scoreline: evidenceValue(story, 'placar')};
};

const estimateDuration = (voiceover, config = CONTENT_CONFIG) => {
  const words = clean(voiceover).split(/\s+/).filter(Boolean).length;
  const rawSeconds = (words / config.wordsPerMinute) * 60;
  const tier = rawSeconds <= 10 ? 'SHORT_RAPIDO' : rawSeconds <= 15 ? 'SHORT_PADRAO' : 'SHORT_EXPLICATIVO';
  const range = config.targetSeconds[tier];
  return {words, seconds: Math.round(rawSeconds * 10) / 10, tier, minSeconds: range.min, maxSeconds: range.max, wordsPerMinute: config.wordsPerMinute};
};

const buildScreenTexts = (editorial) => [
  {type: 'HOOK', text: upper(editorial.hook)},
  {type: 'PRIMARY', text: clean(editorial.primary)},
  ...(editorial.scoreline ? [{type: 'STAT', text: editorial.scoreline}] : []),
  ...(editorial.points ? [{type: 'STAT', text: `${formatNumber(editorial.points)} PONTOS`}] : []),
  {type: 'CONSEQUENCE', text: clean(editorial.consequence)},
  {type: 'CTA', text: upper(editorial.cta)},
];

const buildYoutubeTags = (story, editorial, config = CONTENT_CONFIG) => {
  const format = clean(story.formatoRecomendado ?? 'resultado').toLowerCase();
  const fixed = ['shorts futebol', `futebol ${story.season ?? new Date().getFullYear()}`, 'youtube shorts futebol', 'futebol brasileiro', 'match highlights', 'futebol', 'analise de futebol', 'rodada do brasileirao'];
  const competition = [slug(editorial.competition), 'brasileirao', 'brasileirao serie a'];
  const teams = editorial.teams.map(slug);
  const players = editorial.players.map(slug);
  const events = [format, 'resultados', 'classificacao', 'tabela atualizada', 'futebol brasileiro'];
  const tags = unique([...fixed, ...competition, ...teams, ...players, ...events]).slice(0, config.maxYoutubeTags);
  while (tags.length < config.minYoutubeTags) tags.push(['futebol hoje', 'noticias de futebol', 'short de futebol', 'analise brasileirao', 'campeonato brasileiro'][tags.length % 5]);
  let result = unique(tags);
  while (result.join(', ').length > config.maxTagCharacters && result.length > config.minYoutubeTags) result.pop();
  return result;
};

const buildHashtags = (story, editorial, config = CONTENT_CONFIG) => unique(['#brasileirao', '#futebol', ...editorial.teams.map((team) => `#${slug(team)}`), ...editorial.players.map((player) => `#${slug(player)}`), `#${slug(story.tipo ?? 'futebol')}`]).slice(0, config.maxHashtags);

const platformCopy = (story, editorial, tags, hashtags) => ({
  youtube: {title: editorial.title, description: `${editorial.primary}\n\n${editorial.consequence}\n\n${editorial.cta} 👇`, tags},
  instagram: {caption: `${editorial.hook}\n\n${editorial.primary}\n\n${editorial.cta} 👇\n\n${hashtags.join(' ')}`, hashtags},
  tiktok: {caption: `${editorial.hook} ${editorial.primary} ${editorial.cta} 👇`, hashtags},
});

export const generateShortContent = (story, {version = 1, config = CONTENT_CONFIG, regenerationNote = null} = {}) => {
  const editorial = buildEditorial(story);
  const normalizedTitle = upper(editorial.title);
  const safeTitle = normalizedTitle.length > config.maxTitleCharacters
    ? `${normalizedTitle.slice(0, config.maxTitleCharacters - 1).trim()}…`
    : normalizedTitle;
  const tags = buildYoutubeTags(story, editorial, config);
  const hashtags = buildHashtags(story, editorial, config);
  const duration = estimateDuration(editorial.voiceover, config);
  const roteiro = [editorial.hook, editorial.primary, editorial.consequence, editorial.cta].join(' ');
  const content = {
    id: `${story.id}:v${version}`,
    storyId: story.id,
    competitionId: story.competition_id ?? story.competitionId,
    competition: story.competition_name ?? story.competicao ?? editorial.competition,
    season: story.season,
    round: story.round,
    formato: story.formatoRecomendado ?? story.formato ?? 'RESULTADO',
    titulo: safeTitle,
    hook: editorial.hook,
    roteiro,
    voiceover: editorial.voiceover,
    screenTexts: buildScreenTexts(editorial),
    descricao: platformCopy(story, editorial, tags, hashtags).youtube.description,
    cta: editorial.cta,
    tags,
    hashtags,
    duracaoEstimada: duration,
    platforms: platformCopy(story, {...editorial, title: safeTitle}, tags, hashtags),
    status: CONTENT_STATUSES.GENERATED,
    metadata: {
      strategy: editorial.strategy,
      language: config.language,
      sourceStoryType: story.tipo,
      sourceEvidence: story.evidencias ?? story.evidence ?? [],
      regenerationNote,
    },
    version,
  };
  return content;
};

const PLACEHOLDER_PATTERN = /\b(?:tbd|tbc|todo|lorem|undefined|null|insira|exemplo)\b/i;
const ENGLISH_PATTERN = /\b(?:watch|breaking|headline|top scorer|matchday|click here|subscribe now)\b/i;

export const validateShortContent = (content, story, config = CONTENT_CONFIG) => {
  const errors = [];
  if (!clean(content.titulo) || content.titulo.length < config.minTitleCharacters || content.titulo.length > config.maxTitleCharacters) errors.push('O título deve ter entre 12 e 72 caracteres.');
  for (const field of ['hook', 'roteiro', 'voiceover', 'cta', 'descricao']) if (!clean(content[field])) errors.push(`O campo ${field} não pode ficar vazio.`);
  if (!Array.isArray(content.screenTexts) || content.screenTexts.length < 3) errors.push('É necessário ter pelo menos três textos de tela.');
  if (!Array.isArray(content.tags) || content.tags.length < config.minYoutubeTags || content.tags.some((tag) => tag.includes('#') || tag !== tag.toLowerCase())) errors.push('As tags do YouTube devem ter pelo menos 20 itens, em minúsculas e sem #.');
  if (content.tags?.join(', ').length > config.maxTagCharacters) errors.push('As tags do YouTube ultrapassam 500 caracteres.');
  const allText = [content.titulo, content.hook, content.roteiro, content.voiceover, content.descricao, content.cta, ...(content.screenTexts ?? []).map((item) => item.text)].join(' ');
  if (PLACEHOLDER_PATTERN.test(allText)) errors.push('O conteúdo contém placeholder.');
  if (ENGLISH_PATTERN.test(allText)) errors.push('O conteúdo contém uma expressão editorial em inglês.');
  const storyText = [story.titulo, story.resumo, ...(story.times ?? story.teams ?? []), ...(story.jogadores ?? story.players ?? [])].map((value) => clean(value)).join(' ');
  const sourceTerms = [...(story.times ?? story.teams ?? []), ...(story.jogadores ?? story.players ?? [])].map((value) => clean(value)).filter(Boolean);
  if (sourceTerms.length && !sourceTerms.some((term) => allText.toLowerCase().includes(term.toLowerCase())) && !allText.toLowerCase().includes(clean(storyText).toLowerCase())) errors.push('O conteúdo não referencia nenhum time ou jogador da história.');
  const duration = content.duracaoEstimada?.seconds;
  if (!Number.isFinite(Number(duration)) || duration < 5 || duration > 30) errors.push('A duração estimada deve ficar entre 5 e 30 segundos.');
  return {valid: errors.length === 0, errors};
};

export const getStrategyName = (story) => strategyFor(story);
