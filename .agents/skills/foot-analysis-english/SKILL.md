---
name: foot-analysis-english
description: >
  Brand and design system for the Foot Analysis English-language YouTube/Instagram/TikTok channel.
  Use this skill whenever the user asks to create, redesign, or render any visual content for the
  English channel — including standings cards, results/fixtures cards, European competition cards,
  brand assets, screen mockups, or any football data visualization. Also use when the user asks
  about the English channel's colors, typography, card anatomy, competition accents, or how the
  English system differs from the Portuguese channel. If the user says "make a card", "show the
  standings", "render the results", "redesign a screen", or mentions any league covered by this
  channel (Premier League, Championship, La Liga, Serie A, Bundesliga, Ligue 1, UCL, UEL),
  always read this skill first.
---

# Foot Analysis — English Channel Design System

## The Brief

> "European football at the palm of your hand. Simple. Trustable."

Emotion comes from hierarchy, not decoration. The most important number is always the most
visible. Every card readable in 2 seconds.

---

## 1. Core Identity — What Makes This Channel Different

The English channel shares **structural DNA** with the Portuguese channel but has a completely
different **soul**:

| | Portuguese Channel | English Channel |
|---|---|---|
| Primary accent | Gold `#F0A500` | Electric Blue `#0A84FF` |
| Competitions | Brazilian leagues | European leagues |
| Palette feel | Warm · high energy | Cool · premium data |
| Match card style | Warm dark cards + gold emphasis | Cool dark cards + blue emphasis |
| Base | Black + Gold | Black + Blue |

**What is identical:** local Teaser typography package, card anatomy, base 8px spacing grid,
form dot colors, logo rules, hierarchy system (leader/mid/danger/faded), 1080×1920px canvas,
18px minimum font floor.

---

## 2. Color Palette

```
BG       #0b0d12   Pitch Black    — all card backgrounds (NEVER change this)
SURFACE  #0f1318   Card Surface   — row surfaces, containers
CARD     #141c24   Card Dark      — match cards, nested containers
BORDER   #1e2a3a   Border         — all dividers and card edges
BLUE     #0A84FF   Electric Blue  — PRIMARY accent, points, highlights, CTA
BLUE_DIM #0a1828   Leader Tint    — background tint for leader row
SILVER   #c0ccd8   Ice Steel      — body text, mid-table teams
STEEL    #4a6070   Slate Blue     — meta text, labels, venue names
WHITE    #f0f4f8   Off White      — team names, headlines
DANGER   #E74C3C   Red            — relegation zone numbers and tints
DANG_BG  #140808   Danger Tint    — background tint for relegation rows
WIN      #27AE60   Green          — form dot W, playoff zone
DRAW     #5A6A7A   Grey           — form dot D
LOSS     #E74C3C   Red            — form dot L (same as DANGER)
```

### Hierarchy colors — how each row feels

| Zone | Background | Number color | Meaning |
|---|---|---|---|
| Leader row | `#0a1828` | `#0A84FF` blue | Eye goes here first |
| Promoted / UCL | `#080e18` | `#0A84FF` blue | Top zone |
| Playoff / UEL | `#081410` | `#27AE60` green | Conference/Europa |
| Mid-table | `#0f1318` | `#c0ccd8` silver | Readable, not prominent |
| Relegation | `#140808` | `#E74C3C` red | Feels like risk |

---

## 3. Typography

**Use the local Teaser typography package. Never introduce remote font dependencies.**

- `Orbitron Teaser` — hero titles, template titles, big editorial statements
- `Oxanium Teaser` — scores, points, ranks, team names, key stats
- `Audiowide Teaser` — competition chips, section labels, compact metadata

These fonts are shipped in `public/fonts/` and loaded by `FootballShortFontFaces`.
Poppins and Barlow are not the Shorts default.

### Scale (1080×1920px canvas)

| Role | Font | Size | Weight | Case | Color |
|---|---|---|---|---|---|
| Hero / main title | Orbitron Teaser | 84-132px | 900-950 | UPPERCASE | White or Blue |
| Competition headline | Orbitron Teaser | 56-96px | 900 | UPPERCASE | White or Blue |
| Club / player name | Oxanium Teaser | 30-44px | 700-950 | UPPERCASE | White |
| Score / key stat | Oxanium Teaser | 44-98px | 900-950 | — | Blue `#0A84FF` |
| Label / meta | Audiowide Teaser | 18-25px | 600-900 | UPPERCASE | Steel `#4a6070` |
| Disclaimer | Audiowide Teaser or compact system text | 18px | 400-800 | Sentence case | Muted |
| **MINIMUM anywhere** | **18px** | — | — | — |

### Four rules

1. **Max 3 font families per Short** — Orbitron, Oxanium, Audiowide
2. **Orbitron = command, Oxanium = facts, Audiowide = labels** — each family has one job
3. **Uppercase for identity, mixed case for data** — ARSENAL is the brand, "70 pts" is the fact
4. **Size gap creates hierarchy** — the jump from name to score tells a story before you read it

---

## 4. Competition Identity

Brand base (Black + Blue) never changes. **Only the top accent stripe changes** per competition.

| Competition | Accent color | Hex | Feel |
|---|---|---|---|
| Premier League | Royal Blue | `#4A90D9` | Flagship English comp |
| Championship | Steel Grey | `#8CA0B4` | Second tier, grit |
| La Liga | Terracotta | `#E8623A` | Spanish heat |
| Serie A | Sapphire | `#3A78C9` | Italian precision |
| Bundesliga | Deep Red | `#D43020` | German power |
| Ligue 1 | Emerald | `#2ECC71` | French elegance |
| Champions League | Antique Gold | `#C8A84B` | Continental prestige |
| Europa League | Bronze-Orange | `#C86430` | Second-tier Europe |

The accent appears **only** in:
- The 4px top stripe on every card
- The score color on European cards (UCL = gold, UEL = bronze)
- Left border on European match cards

---

## 5. Card Anatomy — Universal Structure

Every single card follows this exact order, no exceptions:

```
┌─────────────────────────────────────┐
│ ████ 4px competition accent stripe  │  ← only place the league color lives
│                                     │
│  COMPETITION · COUNTRY              │  ← Audiowide Teaser, STEEL
│  CARD TITLE                         │  ← Orbitron Teaser, WHITE/BLUE, uppercase
│  Round X · Season                   │  ← Audiowide Teaser, STEEL
│ ─────────────────────────────────── │
│  [data body — see templates below]  │
│                                     │
│                      Foot Analysis  │  ← always bottom-right, never moves
└─────────────────────────────────────┘
```

**Logo rule:** Always bottom-right. Same size. Every card, every platform, without exception.
Minimum 80px wide at 1080px canvas. Never top, never center, never left.

---

## 6. Template A — Standings Card

Used for: league tables after each matchday.

```
Row structure: [POS]  [TEAM NAME]  [GMS]  [PTS]
```

- Position number color = zone color (blue/green/silver/red)
- Team name = White, Oxanium Teaser, uppercase
- Games played = Steel, small, optional
- Points = same color as position number, Oxanium Teaser
- Row background = zone tint color

**Legend strip at bottom:**
- Blue dot = Promoted / UCL
- Green dot = Playoff / UEL / UECL
- Red dot = Relegation

**Example row rendering for Premier League:**
```
1  ARSENAL          31  70   ← blue number, blue pts, #0a1828 bg
2  MAN CITY         30  61   ← blue number, blue pts, #080e18 bg
5  LIVERPOOL        31  49   ← green number, green pts, #081410 bg
6  CHELSEA          31  48   ← silver number, silver pts, #0f1318 bg
18 WEST HAM         31  29   ← red number, red pts, #140808 bg
```

---

## 7. Template B — Results / Fixtures Card

Used for: match results after each round, upcoming fixtures.

Match card structure (each match):
```
┌─────────────────────────────┐
│  VENUE / CITY               │  ← 7.5px, STEEL, uppercase, centered
│  HOME TEAM   2–1  AWAY TEAM │  ← team names SILVER, score WHITE centered
└─────────────────────────────┘
```

- Match card background: `#141c24` (CARD dark)
- Card border: `#1e2a3a` (BORDER)
- Score: Oxanium Teaser, White, centered — **no "X" separator, use "–" (en dash)**
- Postponed match: score shows "postponed" in STEEL at small size
- **No pink** anywhere on results cards

---

## 8. Template C — European Nights Card

Used for: UCL, UEL quarter-finals, semis, finals, group stage results.

Differences from Template B:
- UCL: accent `#C8A84B` (antique gold), match score color = gold
- UEL: accent `#C86430` (bronze-orange), match score color = bronze
- Each match card gets a 2px left border in the competition accent color
- "2ND LEG" or "1ST LEG" badge appears below the header, styled with competition accent
- Deep background tint: UCL = `#0e0c1e`, UEL = `#14100a`

---

## 9. Do & Don't

### DO
- Background: Pitch Black `#0b0d12` foundation with approved local Teaser backdrops only.
  Keep data rows/cards dark enough for instant readability.
- Logo: Bottom-right, same size, every card, every platform.
- Accent: Competition stripe and key stat colors only — never fills whole background.
- Typography: keep the three Teaser roles clear — Orbitron for commands, Oxanium for facts,
  Audiowide for labels.
- Form dots: Green = W, Gray = D, Red = L. Always this order, never swap.
- CTA: Specific forced-choice — "Comment your predicted score for Game 1", not "comment below".
- Score separator: Use `–` (en dash), never `X` or `x` or `vs`.

### DON'T
- Never use Gold `#F0A500` (Portuguese channel accent) on English channel cards.
- Never more than 2 accent colors on one card.
- Never move logo from bottom-right.
- Never add ad hoc blurred/colored photos. Use only approved local Teaser backdrops.
- Never use the old pink/magenta match card style.
- Never add a fourth font family to Shorts.
- Never go below 18px font size.
- Never write the score as "3 X 1" — always "3–1".

---

## 10. Content Pillars & Video Structure

### Three pillars
| Pillar | Format | Frequency |
|---|---|---|
| A — Standings | League tables after each matchday | Every round |
| B — Results | Match cards for round results | Every round |
| C — European | UCL/UEL knockout/group results | Match weeks |

### Hook structure (every video)
```
0–2s    HOOK     Show the payoff immediately — table position, score, or key stat NOW
2–18s   PAYLOAD  Rapid data reveal — scroll standings or results at pace
18–20s  CTA      Forced-choice specific action (not vague)
Loop    PROMISE  "Posting every matchday" — builds return habit
```

### Platforms
- **YouTube Shorts** — Revenue engine. All standings + results. 4× per week minimum.
- **Instagram Reels** — Affiliate + reach. Same content + follow promise every post.
- **TikTok** — Discovery only. Loop-optimised cuts. No affiliate push.

---

## 11. Quick Token Reference

When generating HTML/CSS for cards, use these exact values:

```css
--bg:       #0b0d12;
--surface:  #0f1318;
--card:     #141c24;
--border:   #1e2a3a;
--blue:     #0A84FF;
--blue-dim: #0a1828;
--silver:   #c0ccd8;
--steel:    #4a6070;
--white:    #f0f4f8;
--danger:   #E74C3C;
--dang-bg:  #140808;
--win:      #27AE60;
--draw:     #5A6A7A;

/* Competition accents */
--pl:   #4A90D9;
--ch:   #8CA0B4;
--ll:   #E8623A;
--sa:   #3A78C9;
--bl:   #D43020;
--l1:   #2ECC71;
--ucl:  #C8A84B;
--uel:  #C86430;
```

Shorts font package: `Orbitron Teaser`, `Oxanium Teaser`, `Audiowide Teaser`

---

## 12. Generating Cards — Checklist

Before outputting any card visual, verify:

- [ ] Background is `#0b0d12` — no exceptions
- [ ] Top stripe is the correct competition accent color
- [ ] Competition badge text is in STEEL, uppercase
- [ ] Title is Orbitron Teaser, WHITE/BLUE, uppercase
- [ ] Leader row has blue tint + blue number + blue points
- [ ] Relegation rows have red tint + red number + red points
- [ ] Mid-table rows are neutral SURFACE with SILVER text
- [ ] Score separator is `–` not `X`
- [ ] Logo appears bottom-right
- [ ] No gold `#F0A500` anywhere (that's the Portuguese channel)
- [ ] No pink/magenta anywhere
- [ ] Fonts use the local Teaser package, not Poppins/Barlow/Inter/Roboto
