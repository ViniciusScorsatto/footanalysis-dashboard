# FOOT ANALYSIS — CONTENT GENERATION SYSTEM

---

# Objective

Generate YouTube Shorts, TikTok captions, Instagram captions, titles, descriptions, and hooks that maximize:

- Swipe-through rate
- Retention
- Satisfaction
- Comments
- Subscriber conversion

Foot Analysis is not a football news channel.

The channel explains:

- What changed
- Why it matters
- Who benefits
- Who is in danger

---

# Core Principle

Never describe events.

Always describe consequences.

Bad:

- Rodada emocionante
- Muitas surpresas
- Classificação atualizada
- Pegou fogo

Good:

- Flamengo encosta no líder
- Corinthians respira
- Palmeiras abre ritmo de campeão
- Vitória deixa a final aberta

Every output must make the viewer understand the consequence in the first seconds.

---

# Primary Audience

Every video must define and write for one primary audience.

Use this field internally when choosing the angle:

```yaml
primaryAudience:
```

Examples:

```yaml
primaryAudience: Palmeiras fans
```

```yaml
primaryAudience: Flamengo fans
```

```yaml
primaryAudience: Série B promotion race audience
```

If multiple audiences are possible, prioritize:

- Fans of major clubs
- Fans directly affected by title, relegation, promotion, qualification, elimination, or final stakes
- Neutral fans only when the story has a clear table consequence

---

# Story Selection

Calculate a Story Score before writing.

## Major Clubs

- Palmeiras +5
- Flamengo +5
- Corinthians +5
- São Paulo +5
- Santos +5
- Vasco +5

## Major Stakes

- Title race +4
- Relegation race +4
- Promotion race +4
- Qualification +3
- Elimination +3
- Final +4

Prioritize the highest-scoring story.

If a smaller club creates a major consequence for a major club, frame the story through the consequence:

- "Vitória deixa o Fortaleza em alerta"
- "Mirassol pressiona o G4"
- "Juventude abre vantagem pelo acesso"

---

# Hook Rules

The first frame must create curiosity immediately.

Preferred hooks:

- Questions
- Consequences
- Risks
- Title race pressure
- Relegation danger
- Promotion race pressure
- Final advantage or survival

Examples:

- Palmeiras já está em ritmo de campeão?
- Corinthians voltou ao Z4?
- Flamengo ainda alcança o líder?
- Juventude disparou?
- Fortaleza deixou a taça escapar?
- Vitória abriu vantagem real?

Avoid generic hooks:

- Rodada emocionante
- Classificação atualizada
- Grandes surpresas
- Pegou fogo

unless paired with a specific consequence.

---

# Video Structure

Use this timing logic for the short-video copy and hook:

0-1s: Hook

1-3s: Main fact

3-6s: Supporting evidence

6-9s: Consequence

9-12s: Question

The formula is:

Hook

*

Statistic

*

Consequence

*

Question

---

# Estrutura Universal

Use this for all formats:

- Lead with the consequence, not the event
- Mention the team or audience affected
- Mention the competition when relevant
- Use one clear stat or table movement
- End with a specific comment trigger

---

## TÍTULO

### Fórmula Universal

TEAM + CONSEQUENCE + COMPETITION/STAKES

Examples:

- Flamengo encosta no líder!
- Corinthians respira no Brasileirão!
- Juventude dispara na Série B!
- Palmeiras abre ritmo de campeão!
- Fortaleza fica pressionado na final!
- Vasco acende alerta contra o Z4!

Avoid:

- Rodada emocionante
- Pegou fogo
- Disputa quente
- Grandes surpresas

unless paired with a specific consequence.

---

## Regras do Título

Every title must contain:

1. Team
2. Consequence
3. Competition or stakes when relevant

Rules:

- Start with the team or the consequence.
- Make the impact clear in the first 45 characters.
- Prefer verbs of movement and danger: encosta, dispara, respira, afunda, pressiona, ameaça, escapa, complica, abre vantagem.
- Use the competition only when it increases clarity or search relevance.
- Keep titles short and feed-readable.
- Avoid generic emotion unless there is a specific consequence.

Preferred:

- Flamengo encosta no líder!
- Corinthians respira no Brasileirão!
- Juventude dispara na Série B!
- Vitória abre vantagem na final!

Avoid:

- Rodada emocionante
- Classificação atualizada
- Pegou fogo
- Grandes surpresas

---

# DESCRIÇÃO UNIVERSAL

## Description Rules

Structure:

Opening consequence

3 bullets

Question

Hashtags

Template:

[Main consequence]

• Main statistic
• Main impact
• Main team affected

[Question]

#Shorts #[Competition] #[Team]

Rules:

- The opening line must explain the consequence.
- Use exactly 3 bullets unless the platform requires shorter copy.
- Every bullet must add a stat, impact, or affected team.
- Do not describe the match as "emocionante" unless the consequence is specific.
- End with a specific comment trigger.

Good example:

Flamengo encosta no líder e aumenta a pressão no Brasileirão.

• Diferença no topo caiu para poucos pontos
• O líder perde margem de erro
• Flamengo volta a mirar a briga pelo título

Quem leva o título?

#Shorts #Brasileirao #Flamengo

---

# Comment Triggers

Always ask one specific question:

- Quem leva o título?
- Quem sobe?
- Quem escapa?
- Quem leva a vaga?
- Qual palpite você mudaria?
- Quem ainda briga?
- Quem sentiu mais a pressão?
- Quem sai em vantagem?

Never ask:

- O que achou?
- Gostou do vídeo?
- Comente abaixo

---

# Player-Based Content Rules

Use these rules when the video is about players instead of teams.

Examples:

- artilharia
- assistências
- goleiros menos vazados
- jogadores com mais participações em gols
- ranking de desempenho
- seleção da rodada
- craques da rodada
- disputa por prêmio individual

---

## Player vs Team Detection Rule

Before generating title and description, detect whether the video is about:

1. Team story
2. Player story
3. Match story
4. Table story
5. Prediction story

If the video is tagged as:

- top-scorers
- assists
- player-ranking
- golden-boot
- player-stats

then the main hook must be the player, not the team.

Do not generate team-led titles for player ranking videos unless the player name is unknown and the team is more recognizable.

Bad:

- Botafogo SP e Sport disputam a artilharia da Série B

Good:

- Morelli e Barletta empatados na artilharia da Série B

Better:

- Morelli, Barletta ou Mikael: quem termina artilheiro da Série B?

---

## Core Principle

When the story is about players, the player is the hook.

The team is supporting context.

Bad:

- Artilharia atualizada do Brasileirão
- Ranking de gols da rodada
- Veja os maiores artilheiros

Good:

- Pedro disparou na artilharia?
- Viveros ainda lidera os goleadores?
- Neymar voltou para a briga?
- Arrascaeta lidera em assistências?
- Quem alcança o artilheiro?

---

## Player Title Formula

Every player-based title should include:

1. Main player
2. Ranking or award
3. Statistic or consequence
4. Competition

Preferred structure:

[PLAYER] + [CONSEQUENCE] + [RANKING] + [COMPETITION]

Examples:

- Pedro disparou na artilharia do Brasileirão?
- Viveros lidera, mas quem ainda alcança?
- Arrascaeta domina as assistências no Brasileirão
- Greenwood perdeu a Chuteira de Ouro da Ligue 1?
- Quem é o artilheiro da Libertadores?

---

## Top Scorers Title Priority

For top scorer videos, title priority is:

1. Player names
2. Goal count
3. Race tension
4. Competition
5. Team names only as support

Preferred formula:

[PLAYER 1] + [PLAYER 2] + [RACE STATUS] + [COMPETITION]

Examples:

- Morelli e Barletta empatados na artilharia da Série B
- Pedro dispara na artilharia do Brasileirão
- Greenwood fica para trás na corrida da Ligue 1
- Viveros lidera, mas Pedro ainda encosta

---

## Player Story Types

Classify the video as one of these:

```yaml
playerStoryType:
```

Use the player story type to decide the hook, CTA, title, and description angle.

---

# BLOCOS DINÂMICOS POR FORMATO

---

# A) CLASSIFICAÇÃO

## Informações importantes

- líder
- time que encostou
- time que perdeu margem
- G4/G6
- Z4
- diferença de pontos
- sequência recente
- quem se beneficia
- quem fica em perigo

## Angle

Write around one table consequence:

- "Time X encosta no líder"
- "Time Y perde gordura"
- "Time Z respira fora do Z4"
- "Time A entra na zona de vaga"

## CTA

- Quem leva o título?
- Quem escapa?
- Quem pega Libertadores?
- Quem ainda tem chance?

---

# B) ÚLTIMOS JOGOS

## Informações importantes

- resultado que muda tabela
- vitória fora de casa
- tropeço de favorito
- sequência de vitórias/derrotas
- impacto em título, vaga, acesso ou rebaixamento

## Angle

Do not summarize all results equally.

Choose the result with the biggest consequence.

Examples:

- "Vitória surpreende e deixa a final aberta"
- "Flamengo aproveita tropeço do líder"
- "Corinthians respira com resultado direto"

## CTA

- Quem sai mais forte da rodada?
- Quem sentiu mais a pressão?
- Quem ainda briga?

---

# C) PALPITES

## Informações importantes

- favorito
- risco real
- confronto direto
- efeito na tabela
- consequência do resultado previsto
- que time tem histórico mais forte
- considerar rodadas inicias x rodadas finais
- considerar se o campeonato é pontos corridos (brasileirão por exemplo) ou mata-mata (copa do mundo)

## Angle

Every prediction must explain what changes if the pick happens.

Examples:

- "Se vencer, Palmeiras abre distância"
- "Se perder, Corinthians volta ao alerta"
- "Empate mantém a briga aberta"

## CTA

- Qual palpite você mudaria?
- Quem vence?
- Vai ter zebra?

---

# D) MATA-MATA

## Informações importantes

- agregado
- vantagem
- classificados
- eliminação
- viradas
- gols decisivos
- quem controla a volta

## Angle

Frame the knockout story through danger or advantage.

Examples:

- "Vitória abre vantagem, mas não mata a final"
- "Fortaleza precisa reagir em casa"
- "Empate deixa a decisão aberta"

## CTA

- Quem passa?
- Quem leva a taça?
- Quem sai em vantagem?

---

# E) ARTILHARIA

## Informações importantes

- líder de gols
- perseguidor
- diferença de gols
- jogador em alta
- time do jogador apenas como contexto

## Angle

The player is the story.

Focus on the scoring race, the leader, the chasers, and who can overtake.

Mention the player's team only as supporting context.

Do not frame the draft around the team unless the player stat directly changes the individual race.

Examples:

- "Pedro disparou na artilharia?"
- "Viveros ainda lidera os goleadores?"
- "Quem alcança o artilheiro?"
- "A disputa pela artilharia apertou"

## CTA

- Quem termina artilheiro?
- Quem decide mais?
- Quem alcança o líder?

---

# F) JOGOS DO DIA

## Informações importantes

- confronto direto
- clássico
- jogo que muda tabela
- time que precisa vencer
- risco de perder vaga

## Angle

Focus on why the match matters before kickoff.

Examples:

- "Flamengo joga para encostar no líder"
- "Corinthians precisa vencer para respirar"
- "Confronto direto pode mudar o G4"

## CTA

- Quem precisa vencer mais?
- Qual jogo muda a rodada?
- Quem sente a pressão?

---

# G) TITLE RACE / DISPUTA PELO TÍTULO

## Informações importantes

- distância em pontos
- aproveitamento
- sequência recente
- rodada decisiva
- perseguidor mais perigoso
- margem de erro do líder

## Angle

Use title-race language with consequence.

Examples:

- "Palmeiras abre ritmo de campeão"
- "Flamengo encosta e pressiona o líder"
- "Líder perde margem de erro"

## CTA

- Quem leva o título?
- Ainda dá para buscar?
- Quem é favorito agora?

---

# H) REBAIXAMENTO

## Informações importantes

- Z4
- distância para sair da zona
- confronto direto
- sequência ruim
- time que respirou
- time que afundou

## Angle

Use survival and danger language.

Examples:

- "Corinthians respira fora do Z4"
- "Vasco acende alerta"
- "Derrota afunda o time na zona"

## CTA

- Quem escapa?
- Quem cai?
- Quem ainda tem chance?

---

# TEMPLATE DE HASHTAGS

---

# Regras

- Sempre em minúsculo
- Separadas por vírgula
- Sem #
- 20 tags no mínimo
- Máximo 500 caracteres
- Priorizar competição, time, consequência e formato

---

# Estrutura Inteligente

## BLOCO FIXO

Sempre usar:

- shorts futebol
- futebol 2026
- youtube shorts futebol
- futebol brasileiro
- football analysis

---

## BLOCO COMPETIÇÃO

Exemplos:

- brasileirao
- serie b
- copa do nordeste
- copa do brasil
- libertadores
- premier league
- champions league

---

## BLOCO TIMES

Adicionar os principais times do vídeo.

Exemplo:

- flamengo
- palmeiras
- corinthians
- fortaleza
- vitoria
- vasco

---

## BLOCO EVENTO

Exemplos:

- disputa pelo titulo
- rebaixamento
- acesso
- final
- classificacao
- rodada
- resultados
- artilharia
- palpites

---

# Fórmula de Conteúdo por Plataforma

---

# YouTube Shorts

## Objetivo

- Swipe-through rate
- Retenção rápida
- Clareza de consequência
- Comentários específicos

## Estrutura

- título com time + consequência
- descrição escaneável
- 3 bullets de impacto
- hashtags específicas
- pergunta final específica

---

# TikTok / Instagram

## Objetivo

- impacto imediato
- curiosidade
- compartilhamento
- comentários

## Estrutura

- primeira frase com consequência
- menos contexto
- mais tensão
- CTA curto e específico

## Exemplos de CTA

- Quem leva o título?
- Quem sobe?
- Quem escapa?
- Quem leva a vaga?
- Qual palpite você mudaria?

---

# Emojis mais usados

⚽🔥👀😱💥🚨📊⚠️😬🏆

Use emojis only when they support the consequence.

---

# Estratégia de Automação

## Ideal para n8n

Criar um classificador automático para identificar:

- primaryAudience
- storyScore
- team affected
- competition
- title race
- relegation race
- promotion race
- qualification
- elimination
- final
- match result with table impact

## O sistema deve trocar automaticamente:

- hook
- título
- CTA
- hashtags
- descrição
- ângulo editorial

---

# Estratégia Final

Every piece of copy must follow the Foot Analysis Formula:

Hook

*

Statistic

*

Consequence

*

Question

The content must always transmit:

- consequence
- pressure
- table movement
- who benefits
- who is in danger
- why the viewer should care now

Avoid:

- generic news language
- slow context
- long journalistic summaries
- describing events without consequences
- "rodada emocionante"
- "pegou fogo" without a specific team and consequence
