---
name: foot-analysis-portuguese
description: >
  Brand and design system for the Foot Analysis Portuguese-language YouTube/Instagram/TikTok
  channel. Use this skill whenever the user asks to create, redesign, or render any visual
  content for the Portuguese channel — including standings cards, results/fixtures cards,
  artilheiros (top scorers) cards, palpites (predictions) cards, brand assets, screen mockups,
  or any Brazilian football data visualization. Also use when the user asks about the Portuguese
  channel's colors, typography, card anatomy, competition accents, or how the Portuguese system
  differs from the English channel. If the user says "make a card", "show the classificacao",
  "render the palpites", "artilheiros", "redesign a screen", or mentions any league covered
  by this channel (Brasileirao, Serie A, Serie B, Serie C, Serie D, Copa do Brasil,
  Copa Libertadores, Copa Sul-Americana, Sub-20, Copa do Mundo), always read this skill first.
---

# Foot Analysis — Portuguese Channel Design System

## The Brief

> "Football data at the palm of your hand. Simple. Trustable."

Emotion comes from hierarchy, not decoration. The most important number is always the most
visible. Every card readable in 2 seconds.

---

## 1. Core Identity — What Makes This Channel Different

The Portuguese channel shares **structural DNA** with the English channel but has a completely
different **soul**:

| | Portuguese Channel | English Channel |
|---|---|---|
| Primary accent | Gold `#F0A500` | Electric Blue `#0A84FF` |
| Competitions | Brazilian leagues | European leagues |
| Palette feel | Warm · high energy | Cool · premium data |
| Match card style | Hot pink separators | Dark slate cards |
| Base | Black + Gold | Black + Blue |

**What is identical:** Poppins font family, card anatomy, base 8px spacing grid, form dot
colors, logo rules, hierarchy system (leader/mid/danger/faded), 1080×1920px canvas, 18px
minimum font floor.

---

## 2. Color Palette

```
BG        #0b0d12   Pitch Black    — all card backgrounds (NEVER change this)
SURFACE   #0f1318   Card Surface   — row surfaces, containers
CARD      #141c24   Card Dark      — nested containers
BORDER    #1e2a3a   Border         — all dividers and card edges
GOLD      #F0A500   Gold           — PRIMARY accent, points, highlights, CTA
LEAD_BG   #0b1409   Leader Tint    — warm green background tint for leader row
SILVER    #c0ccd8   Ice White      — body text, mid-table teams
STEEL     #3a5060   Slate          — meta text, labels, venue names
WHITE     #f0f4f8   Off White      — team names, headlines
DANGER    #E74C3C   Red            — relegation zone numbers and tints
DANG_BG   #140808   Danger Tint    — background tint for relegation rows
WIN       #27AE60   Green          — form dot W, playoff zone
DRAW      #5A6A7A   Grey           — form dot D
LOSS      #E74C3C   Red            — form dot L (same as DANGER)
```

### Hierarchy colors — how each row feels

| Zone | Background | Number color | Meaning |
|---|---|---|---|
| Leader row | `#0b1409` | `#F0A500` gold | Eye goes here first |
| Promoted / Libertadores | `#090e05` | `#F0A500` gold | Top zone |
| Playoff / Sul-Americana | `#081410` | `#27AE60` green | Continental access |
| Mid-table | `#0f1318` | `#c0ccd8` silver | Readable, not prominent |
| Relegation | `#140808` | `#E74C3C` red | Feels like risk |

---

## 3. Typography

**Two fonts only. Never mix others.**

- `Poppins Bold` — everything that commands attention (headlines, team names, scores, stats)
- `Poppins Regular / Medium` — everything that communicates data (labels, meta, body)

### Scale (1080×1920px canvas)

| Role | Size | Weight | Case | Color |
|---|---|---|---|---|
| Hero / main title | 96px | 900 | UPPERCASE | White |
| Competition headline | 56px | 700 | UPPERCASE | White |
| Club / player name | 34px | 700 | UPPERCASE | White |
| Score / key stat | 56px | 900 | — | Gold `#F0A500` |
| Label / meta | 20px | 600 | UPPERCASE | Slate `#3a5060` |
| Disclaimer | 18px | 400 | Sentence case | Muted |
| **MINIMUM anywhere** | **18px** | — | — | — |

### Four rules

1. **Max 2 font weights per card** — Bold for headline, Regular or Medium for data
2. **Bold = command, Regular = inform** — fast-read = Bold, careful-read = Regular
3. **Uppercase for identity, mixed case for data** — PALMEIRAS is the brand, "19 pts" is the fact
4. **Size gap creates hierarchy** — the jump from name to score tells a story before you read it

---

## 4. Competition Identity

Brand base (Black + Gold) never changes. **Only the top accent stripe changes** per competition.

| Competition | Accent color | Hex | Feel |
|---|---|---|---|
| Brasileirao Serie A | Gold | `#F0A500` | Brand default, flagship |
| Copa do Brasil | Red | `#C0392B` | Knockout energy, high stakes |
| Serie B | Blue | `#2E86DE` | Aspirational, the climb upward |
| Serie C | Green | `#27AE60` | Growth, emerging talent |
| Serie D | Purple | `#8E44AD` | Grassroots, never confused with upper divs |
| Sub-20 | Orange | `#E67E22` | Youth energy, warm but not brand gold |
| Copa Libertadores | Deep Gold | `#F39C12` | Continental prestige, richer than brand gold |
| Copa Sul-Americana | Teal | `#1ABC9C` | Fresh, distinct from Libertadores |
| Copa do Mundo 2026 | Special tri-color | See below | One-off, never reused |

**Copa do Mundo 2026 only:** Unique tri-color treatment using Brazil colors —
green `#009B3A`, yellow `#FEDF00`, blue `#002776`. NEVER apply to domestic or continental
competitions.

The accent appears **only** in:
- The top stripe on every card
- The score/stat color (Gold for Serie A cards)
- Left border accent on key callout boxes

---

## 5. Card Anatomy — Universal Structure

Every single card follows this exact order, no exceptions:

```
┌─────────────────────────────────────┐
│ ████ competition accent stripe      │  ← only place the competition color lives
│                                     │
│  COMPETITION · BRASILEIRAO          │  ← 9px, Poppins Regular, SLATE
│  CARD TITLE                         │  ← 20px, Poppins Bold, WHITE, uppercase
│  Rodada X · Season                  │  ← 8px, Poppins Regular, SLATE
│ ─────────────────────────────────── │
│  [data body — see templates below]  │
│                                     │
│                      Foot Analysis  │  ← always bottom-right, never moves
└─────────────────────────────────────┘
```

**Logo rule:** Always bottom-right. Same size. Every card, every platform, without exception.
Minimum 80px wide at 1080px canvas. Never top, never center, never left.

---

## 6. Template A — Classificacao (Standings) Card

Used for: league tables after each rodada.

```
Row structure: [POS]  [TEAM NAME]  [PTS]
```

- Position number color = zone color (gold/green/silver/red)
- Team name = White, Poppins Bold, uppercase
- Points = same color as position number, Poppins Bold, right-aligned
- Row background = zone tint color

**Legend strip at bottom:**
- Gold dot = Libertadores direct
- Green dot = Sul-Americana / qualifying
- Red dot = Relegation

**Example row rendering for Brasileirao:**
```
1  PALMEIRAS      19   ← gold number, gold pts, #0b1409 bg
2  ATHLETICO      16   ← gold number, gold pts, #090e05 bg
5  BAHIA          14   ← green number, green pts, #081410 bg
6  FORTALEZA      13   ← silver number, silver pts, #0f1318 bg
17 CORITIBA        8   ← red number, red pts, #140808 bg
```

---

## 7. Template B — Artilheiros (Top Scorers) Card

Used for: top goal scorers after each rodada.

```
Row structure: [RANK]  [PLAYER NAME]  [CLUB SHORT]  [GOALS]
```

- Rank 1 gets gold treatment (gold number, warm tint background)
- Player name = White, Poppins Bold
- Club abbreviation = Slate, Poppins Regular, small
- Goals = Gold (rank 1) or Silver (others), Poppins Bold, right-aligned
- Optional: player photo on right side, shoulder crop, dark overlay on left half

**Example:**
```
1  DANILO        BFR   5   ← gold, #0b1409 bg
2  C. VINICIUS   GRE   5   ← silver
3  CALLERI       SPA   4   ← silver
4  VITOR ROQUE   PAL   3   ← silver
```

---

## 8. Template C — Palpites (Predictions) Card

Used for: match predictions before each rodada.

```
Row structure: [HOME TEAM]  [PREDICTED SCORE]  [AWAY TEAM]
```

- Home team left-aligned, Away team right-aligned, both Poppins Bold uppercase
- Predicted score centered, Poppins Bold, Gold `#F0A500`
- Row background alternates between SURFACE and CARD for readability
- **Mandatory disclaimer** on every palpites card (legal protection, never remove):
  `"Os palpites têm caráter exclusivamente recreativo."`
- Disclaimer: 18px minimum, Poppins Regular, Muted color

**CTA rule for palpites:** Always forced-choice, never vague.
- DO: `"Comenta teu placar no JOGO 1"`
- DON'T: `"Comenta aí"` or `"O que você acha?"`

---

## 9. Do & Don't

### DO
- Background: Solid `#0b0d12` only. No blurred stadium photos, no gradients.
- Logo: Bottom-right, same size, every card, every platform.
- Accent: Competition stripe and key stat colors only — never fills whole background.
- Font weights: Max 2 per card.
- Form dots: Green = W, Gray = D, Red = L. Always this order, never swap.
- Player photo: Artilheiros cards only. Right side. Shoulder crop. Dark overlay on left half.
- Disclaimer: On every palpites card. Legal protection. Never remove it.
- CTA: Specific forced-choice action, never vague.

### DON'T
- Never use Electric Blue `#0A84FF` (English channel accent) on Portuguese channel cards.
- Never more than 2 accent colors on one card.
- Never move logo from bottom-right.
- Never use a blurred or colored photo as card background.
- Never 4+ font style combinations on one card.
- Never go below 18px font size.
- Never apply Copa do Mundo tri-color to any domestic or continental competition.
- Never use vague CTA — "comenta aí" has no clear action, no engagement.
- Never remove the disclaimer from palpites cards.

---

## 10. Content Pillars & Video Structure

### Three pillars
| Pillar | Format | Purpose |
|---|---|---|
| A — Palpites | Match predictions before rodada | Main acquisition pillar |
| B — Classificacao | Standings table after each rodada | Shareable utility |
| C — Artilheiros / Benchmarks | Top scorers, stats comparisons | Differentiation |

### Hook structure (every video)
```
0–2s    HOOK     Show the payoff immediately — table position, score, or key stat NOW
2–18s   PAYLOAD  Rapid data reveal — scroll standings or results at pace
18–20s  CTA      Forced-choice specific action (not vague)
Loop    PROMISE  "Sigo postando toda rodada" — builds return habit
```

### Platforms
- **YouTube Shorts** — Revenue engine. All palpites + standings. 4× per week minimum.
- **Instagram Reels** — Affiliate + conversion. Same content + follow promise every post.
- **TikTok** — Discovery only. Loop-optimised cuts. No affiliate push.

### Monetization order
1. **Now** — Affiliate links (Betano, Bet365, Sportingbet) pinned in descriptions + bio
2. **90 days** — Hotsite with dedicated affiliate landing pages + email capture
3. **6 months** — YouTube AdSense + channel memberships (R$5–15/month)
4. **12 months** — Direct sponsorships + brand deals

---

## 11. Quick Token Reference

When generating HTML/CSS for cards, use these exact values:

```css
--bg:       #0b0d12;
--surface:  #0f1318;
--card:     #141c24;
--border:   #1e2a3a;
--gold:     #F0A500;
--lead-bg:  #0b1409;
--silver:   #c0ccd8;
--steel:    #3a5060;
--white:    #f0f4f8;
--danger:   #E74C3C;
--dang-bg:  #140808;
--win:      #27AE60;
--draw:     #5A6A7A;

/* Competition accents */
--serie-a:    #F0A500;
--copa-br:    #C0392B;
--serie-b:    #2E86DE;
--serie-c:    #27AE60;
--serie-d:    #8E44AD;
--sub20:      #E67E22;
--libertad:   #F39C12;
--sul-am:     #1ABC9C;
```

Font stack: `'Poppins', 'Liberation Sans', sans-serif`

---

## 12. Generating Cards — Checklist

Before outputting any card visual, verify:

- [ ] Background is `#0b0d12` — no exceptions
- [ ] Top stripe is the correct competition accent color
- [ ] Competition badge text is in SLATE, uppercase
- [ ] Title is Poppins Bold, WHITE, uppercase
- [ ] Leader row has warm green tint `#0b1409` + gold number + gold points
- [ ] Relegation rows have red tint `#140808` + red number + red points
- [ ] Mid-table rows are neutral SURFACE with SILVER text
- [ ] Palpites card includes the disclaimer
- [ ] CTA is a specific forced-choice, not vague
- [ ] Logo appears bottom-right
- [ ] No electric blue `#0A84FF` anywhere (that's the English channel)
- [ ] No pink/magenta anywhere (old style, replaced)
- [ ] Font is Poppins (not Inter, not Roboto, not system font)
- [ ] Never below 18px font size
