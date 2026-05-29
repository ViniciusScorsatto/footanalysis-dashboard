export const footballLanguageProfiles = [
  {value: 'pt-br', label: 'Português (Brasil)'},
  {value: 'en', label: 'English'},
];

const copyByLanguage = {
  'pt-br': {
    hooks: {
      results: ['Olha o que aconteceu na rodada', 'Essa rodada teve surpresa', 'Seu time saiu bem dessa?'],
      standings: ['A tabela virou?', 'Quem lidera agora?', 'Tem briga até o fim'],
      'season-final-verdict': ['A temporada decidiu tudo', 'Quem cumpriu o objetivo?', 'O veredito final chegou'],
      'champion-final': ['A taça tem dono', 'Quem levantou o troféu?', 'O campeão está aqui'],
      'top-scorers': ['A artilharia pegou fogo', 'Quem está caçando o líder?', 'Esse top 10 muda?'],
      'player-of-round': ['Quem brilhou na rodada?', 'O craque saiu daqui', 'Essa nota te convence?'],
      'championship-pace': ['Quem tem ritmo de taça?', 'Esse ritmo segura o título?', 'A corrida pelo topo apertou'],
      'relegation-line': ['A linha está chegando', 'Quem escapa agora?', 'A briga contra a queda apertou'],
      'continental-groups-standings': ['Os grupos mudaram', 'Quem está passando agora?', 'Essa chave está viva'],
      predictions: ['Você crava esses placares?', 'Vai ter zebra aqui?', 'Seus palpites batem?'],
      'world-cup-group-standings': ['Quem sai desse grupo?', 'A vaga está aberta', 'Olho na tabela da Copa'],
      'world-cup-knockout': ['Agora é mata-mata', 'Quem sobrevive a essa fase?', 'A Copa afunilou'],
    },
    ctas: {
      results: [
        'Qual foi o melhor jogo?',
        'Quem te surpreendeu?',
        'Qual placar mais te chamou atenção?',
        'Seu time foi bem ou mal?',
      ],
      standings: [
        'Quem sobe e quem cai?',
        'Quem fica com a taça?',
        'A tabela está justa?',
        'Quem ainda pode reagir?',
      ],
      'season-final-verdict': [
        'Seu time cumpriu o objetivo?',
        'Quem surpreendeu na temporada?',
        'Foi justo assim?',
        'Quem decepcionou mais?',
      ],
      'champion-final': [
        'Campeão merecido?',
        'Quem decidiu a final?',
        'Foi o título mais difícil?',
        'Essa taça ficou em boas mãos?',
      ],
      'top-scorers': [
        'Quem termina artilheiro?',
        'Quem passa o líder?',
        'Quem faz mais gols?',
        'Esse top 10 muda na próxima?',
      ],
      'player-of-round': [
        'Quem foi o craque?',
        'Concorda com esse top 10?',
        'Quem merecia estar aí?',
        'Qual nota foi injusta?',
      ],
      'championship-pace': [
        'Quem leva o título?',
        'Quem mantém esse ritmo?',
        'Dá pra buscar o líder?',
        'Quem chega brigando até o fim?',
      ],
      'relegation-line': [
        'Quem cai esse ano?',
        'Quem escapa da degola?',
        'Quem reage a tempo?',
        'Quem está mais ameaçado?',
      ],
      'continental-groups-standings': [
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
      'world-cup-group-standings': [
        'Quem avança?',
        'Quem passa em 1º?',
        'Quem fica com a vaga?',
        'Quem surpreende nesse grupo?',
      ],
      'world-cup-knockout': [
        'Quem passa?',
        'Quem vai pra próxima fase?',
        'Qual zebra vem aí?',
        'Quem chega na final?',
      ],
    },
    templateLabels: {
      results: 'Últimos Resultados',
      standings: 'Classificação',
      'season-final-verdict': 'Resumo Final',
      'champion-final': 'Campeão',
      'top-scorers': 'Artilheiros',
      'player-of-round': 'Craque da Rodada',
      'championship-pace': 'Ritmo de Campeão',
      'relegation-line': 'Linha do Rebaixamento',
      'continental-groups-standings': 'Grupos Continentais',
      predictions: 'Palpites',
      'world-cup-group-standings': 'Grupos da Copa',
      'world-cup-knockout': 'Mata-Mata da Copa',
    },
    worldCup: {
      title: (season) => `Copa do Mundo ${season}`,
      group: (groupLetter) => `Grupo ${groupLetter}`,
      knockoutPhase: () => 'Oitavas de Final',
      tableLabels: {
        pos: 'Pos',
        team: 'Equipe',
        gd: 'SG',
        pts: 'Pts',
      },
      nextMatches: (groupLetter) => `Próximos Jogos - Grupo ${groupLetter}`,
      lastResults: (groupLetter) => `Últimos Resultados - Grupo ${groupLetter}`,
      qualificationLegend: {
        direct: '1º e 2º avançam',
        bestThird: '8 melhores terceiros',
      },
      cta: 'Quem avança?',
      output: (season, groupLetter) => `copa-do-mundo-${season}-grupo-${groupLetter.toLowerCase()}-pt-br.mp4`,
      knockoutOutput: (season) => `copa-do-mundo-${season}-mata-mata-pt-br.mp4`,
    },
  },
  en: {
    hooks: {
      results: ['This round had a twist', 'Look what just happened', 'Did your team survive it?'],
      standings: ['Did the table just change?', 'Who leads now?', 'The race is still alive'],
      'season-final-verdict': ['The season has spoken', 'Who met the target?', 'Final verdict time'],
      'champion-final': ['The trophy has a home', 'Who lifted it?', 'Champions decided'],
      'top-scorers': ['The scoring race is on', 'Who catches the leader?', 'Does this top 10 hold?'],
      'player-of-round': ['Who owned the round?', 'Your MVP is here', 'Does this rating hold up?'],
      'championship-pace': ['Who has title pace?', 'Can this pace win it?', 'The title race tightened'],
      'relegation-line': ['The drop zone is moving', 'Who escapes now?', 'Survival mode is on'],
      'continental-groups-standings': ['The groups just shifted', 'Who goes through now?', 'This group is alive'],
      predictions: ['Can you call these scores?', 'Where is the upset?', 'Lock in your picks'],
      'world-cup-group-standings': ['Who gets out of this group?', 'The spots are open', 'World Cup table check'],
      'world-cup-knockout': ['Knockout mode starts now', 'Who survives this round?', 'The World Cup tightens'],
    },
    ctas: {
      results: [
        'What was the best match?',
        'Who surprised you most?',
        'Which scoreline stood out?',
        'Did your team deliver?',
      ],
      standings: [
        'Who wins this?',
        'Is it over?',
        'Can they catch them?',
        'Who is climbing late?',
      ],
      'season-final-verdict': [
        'Did your team deliver?',
        'Who overachieved this season?',
        'Was this table fair?',
        'Who disappointed most?',
      ],
      'champion-final': [
        'Deserved champions?',
        'Who decided the final?',
        'Was this the toughest title?',
        'Who wins it next?',
      ],
      'top-scorers': [
        'Who finishes top scorer?',
        'Who catches the leader?',
        'Who scores next?',
        'Does this top 10 change?',
      ],
      'player-of-round': [
        'Who was your MVP?',
        'Do you agree with this top 10?',
        'Who deserved a spot?',
        'Was this rating fair?',
      ],
      'championship-pace': [
        'Who wins the title?',
        'Who can keep this pace?',
        'Can anyone catch the leaders?',
        'Who stays in the race?',
      ],
      'relegation-line': [
        'Who goes down?',
        'Who escapes the drop?',
        'Who turns it around?',
        'Who is in the most danger?',
      ],
      'continental-groups-standings': [
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
      'world-cup-group-standings': [
        'Who advances?',
        'Who wins this group?',
        'Who takes the top spot?',
        'Who is the dark horse?',
      ],
      'world-cup-knockout': [
        'Who goes through?',
        'Who reaches the next round?',
        'Where is the upset?',
        'Who makes the final?',
      ],
    },
    templateLabels: {
      results: 'Last Round Results',
      standings: 'Standings',
      'season-final-verdict': 'Season Wrap-up',
      'champion-final': 'Champions',
      'top-scorers': 'Top Scorers',
      'player-of-round': 'Player of the Round',
      'championship-pace': 'Title Pace',
      'relegation-line': 'Relegation Line',
      'continental-groups-standings': 'Continental Groups',
      predictions: 'Predictions',
      'world-cup-group-standings': 'World Cup Groups',
      'world-cup-knockout': 'World Cup Knockout',
    },
    worldCup: {
      title: (season) => `World Cup ${season}`,
      group: (groupLetter) => `Group ${groupLetter}`,
      knockoutPhase: () => 'Round of 16',
      tableLabels: {
        pos: 'Pos',
        team: 'Team',
        gd: 'GD',
        pts: 'Pts',
      },
      nextMatches: (groupLetter) => `Next Matches - Group ${groupLetter}`,
      lastResults: (groupLetter) => `Last Results - Group ${groupLetter}`,
      qualificationLegend: {
        direct: '1st and 2nd advance',
        bestThird: '8 best third-place teams',
      },
      cta: 'Who advances?',
      output: (season, groupLetter) => `world-cup-${season}-group-${groupLetter.toLowerCase()}-en.mp4`,
      knockoutOutput: (season) => `world-cup-${season}-knockout-en.mp4`,
    },
  },
};

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
  en: [
    {
      pattern: /^regular season\s*-\s*(\d+)$/i,
      format: (roundNumber) => `Round ${roundNumber}`,
    },
  ],
};

export const getFootballCopy = (languageProfile = 'pt-br') =>
  copyByLanguage[languageProfile] ?? copyByLanguage['pt-br'];

export const getFootballCtaOptions = (template, languageProfile = 'pt-br') => {
  const copy = getFootballCopy(languageProfile);
  return copy.ctas?.[template] ?? copy.ctas?.results ?? [];
};

export const getFootballDefaultCta = (template, languageProfile = 'pt-br') =>
  getFootballCtaOptions(template, languageProfile)[0] ?? '';

export const getFootballHookOptions = (template, languageProfile = 'pt-br') => {
  const copy = getFootballCopy(languageProfile);
  return copy.hooks?.[template] ?? copy.hooks?.results ?? [];
};

export const getFootballDefaultHook = (template, languageProfile = 'pt-br') =>
  getFootballHookOptions(template, languageProfile)[0] ?? '';

export const translateFootballRoundName = (round, languageProfile = 'pt-br') => {
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

export const deriveFootballRoundLabel = (
  template,
  round,
  languageProfile = 'pt-br'
) => {
  const translatedRound = translateFootballRoundName(round, languageProfile);

  if (languageProfile === 'en') {
    return template === 'predictions'
      ? `Predictions - ${translatedRound}`
      : translatedRound;
  }

  if (template === 'predictions') {
    return `Palpites da ${translatedRound}`;
  }

  return translatedRound;
};

export const resolveFootballDisplayLabel = (
  template,
  label,
  languageProfile = 'pt-br'
) => {
  const rawLabel = String(label ?? '').trim();

  if (languageProfile !== 'en') {
    return rawLabel;
  }

  const normalized = rawLabel
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  if (
    template === 'standings' &&
    ['classificacao atual', 'classificacao', 'tabela', 'tabela atual'].includes(normalized)
  ) {
    return 'Current Table';
  }

  return rawLabel;
};

export const getFootballIntroDefaults = ({
  template,
  languageProfile = 'pt-br',
  leagueName,
  season,
  roundLabel,
  groupLetter,
  phaseLabel,
}) => {
  const copy = getFootballCopy(languageProfile);
  const cleanLeagueName = String(leagueName ?? '').trim();
  const numericSeason = Number(season);
  const seasonDisplay =
    languageProfile === 'en' && Number.isFinite(numericSeason)
      ? `${numericSeason}/${String(numericSeason + 1).slice(-2)}`
      : String(season);
  const leagueWithoutSeason = cleanLeagueName
    .replace(new RegExp(`\\s+${season}$`), '')
    .replace(new RegExp(`\\s+${seasonDisplay.replace('/', '\\/')}$`), '')
    .trim() || cleanLeagueName;
  const title = cleanLeagueName || (languageProfile === 'en' ? `Football ${seasonDisplay}` : `Futebol ${seasonDisplay}`);
  const subtitle = resolveFootballDisplayLabel(
    template,
    roundLabel ?? phaseLabel ?? '',
    languageProfile
  );
  const worldCupTitle = copy.worldCup.title(season);
  const worldCupGroup = groupLetter ? copy.worldCup.group(groupLetter) : '';

  const pt = languageProfile !== 'en';
  const getPtCompetitionArticle = (competitionName) =>
    /^brasileir[ãa]o\b/i.test(competitionName) ? 'do' : 'da';
  const ptCompetition = `${getPtCompetitionArticle(leagueWithoutSeason)} ${leagueWithoutSeason}`;
  const withPtIntro = (subject) => `Fala Galera, pra vocês... ${subject}.`;
  const voiceoverByTemplate = {
    results: pt
      ? withPtIntro(`os últimos resultados ${ptCompetition}`)
      : `Latest ${leagueWithoutSeason} results`,
    predictions: pt
      ? withPtIntro(`os palpites ${ptCompetition}`)
      : `${leagueWithoutSeason} predictions`,
    standings: pt
      ? withPtIntro(`a classificação ${ptCompetition}`)
      : `${leagueWithoutSeason} standings`,
    'season-final-verdict': pt
      ? withPtIntro(`o resumo final ${ptCompetition}`)
      : `${leagueWithoutSeason} season wrap-up`,
    'champion-final': pt
      ? withPtIntro(`o campeão ${ptCompetition}`)
      : `${leagueWithoutSeason} champions`,
    'top-scorers': pt
      ? withPtIntro(`os artilheiros ${ptCompetition}`)
      : `${leagueWithoutSeason} top scorers`,
    'player-of-round': pt
      ? withPtIntro(`o craque da rodada ${ptCompetition}`)
      : `${leagueWithoutSeason} player of the round`,
    'championship-pace': pt
      ? withPtIntro(`o ritmo de campeão ${ptCompetition}`)
      : `Title pace in the ${leagueWithoutSeason}`,
    'relegation-line': pt
      ? withPtIntro(`a linha do rebaixamento ${ptCompetition}`)
      : `Relegation line in the ${leagueWithoutSeason}`,
    'continental-groups-standings': pt
      ? withPtIntro(`a tabela dos grupos ${ptCompetition}`)
      : `${leagueWithoutSeason} group standings`,
    'world-cup-group-standings': pt
      ? withPtIntro(`${worldCupGroup} da ${worldCupTitle}`)
      : `${worldCupGroup} at the ${worldCupTitle}`,
    'world-cup-knockout': pt
      ? withPtIntro(`o mata-mata da ${worldCupTitle}`)
      : `${worldCupTitle} knockout stage`,
  };

  return {
    introTitle: template === 'world-cup-group-standings' || template === 'world-cup-knockout'
      ? worldCupTitle
      : title,
    introSubtitle: template === 'world-cup-group-standings'
      ? worldCupGroup
      : subtitle,
    hookText: getFootballDefaultHook(template, languageProfile),
    voiceoverText: voiceoverByTemplate[template] ?? (pt ? withPtIntro(`o vídeo ${ptCompetition}`) : `${leagueWithoutSeason} video`),
  };
};
