# Foot Analysis — Brand Guide
> Living document. Last updated: 2026-04-16.
> Maintained as part of the Remotion / design workflow. Update this file whenever a design decision is made or a new competition is added.

---

## 01 — Logo System

### Usage Rules
- The FA mark is **always bottom-right** on every piece of content — no exceptions
- One size, one position, every card, every platform
- Never place the logo on a busy background without a semi-transparent backing pill
- Minimum logo width: **80px on a 1080px canvas**

### Variants

| Variant | Background | Use When |
|---|---|---|
| Primary | Dark (#0b0d12) | All standard content cards |
| Reversed | Light (#f0f0ee) | Print, white-bg contexts |
| Icon only (FA circle) | Any | Profile avatars, watermarks |
| Inline (icon + wordmark) | Dark | Channel headers, website nav |

### Clearspace Rule
Always maintain clearspace equal to the height of the "FA" mark on **all four sides**. No text, no other elements inside that boundary.

---

## 02 — Color Palette

### Brand Colors

| Name | Hex | Role |
|---|---|---|
| Gold | `#F0A500` | Primary accent · CTAs · headline numbers |
| Pitch Black | `#0b0d12` | Background for all content cards |
| Card Dark | `#0f1318` | Card surfaces · secondary backgrounds |
| Ice White | `#c0ccd8` | Body text · team names · data labels |
| Slate | `#3a5060` | Meta text · labels · disclaimers |
| Muted | `#1e2a34` | Borders · subtle dividers |

### Data Status Colors

| Status | Hex | Use |
|---|---|---|
| Win | `#27AE60` | Green dot in FORMA column |
| Draw | `#5A6A7A` | Gray dot in FORMA column |
| Loss | `#E74C3C` | Red dot in FORMA column |

---

## 03 — Typography

**Two fonts only. Never mix others in.**

- **Display font:** Barlow Condensed — for everything that commands attention
- **Data font:** Barlow — for everything that communicates information

> ⚠️ **Render server note:** Barlow and Barlow Condensed are not system fonts and may not be available on headless Linux render servers. They must be loaded via `@remotion/google-fonts` before the render pipeline is considered production-safe. Until then, the Arial Narrow fallback will be used on the server. This is tracked as a known issue.

### Type Scale (video canvas — 1080×1920px)

| Role | Font | Size | Weight | Color | Transform |
|---|---|---|---|---|---|
| Hero Title | Barlow Condensed | 96px | 900 | Gold (`#F0A500`) | UPPERCASE |
| Competition Badge | Barlow | 20px | 600 | Gold | UPPERCASE · letter-spacing 2px |
| Round / Subtitle | Barlow Condensed | 56px | 600 | Slate (`#3a5060`) | UPPERCASE |
| Team Name | Barlow Condensed | 34px | 700 | Ice White (`#c0ccd8`) | UPPERCASE |
| Score / Stat | Barlow Condensed | 56px | 900 | Gold | — |
| Label / Meta | Barlow | 20px | 600 | Slate | UPPERCASE · letter-spacing 2px |

> Note: The original brand guide type scale was authored for static social graphics. The video canvas sizes above are the calibrated equivalents at 1080×1920px at 30fps.

---

## 04 — Competition Identity

The brand base (black + gold) stays constant across **all competitions**. Only the competition accent stripe changes. This means a viewer immediately knows the brand AND the competition within one glance.

### Accent Color Map

| Competition | Accent | Hex | Rationale |
|---|---|---|---|
| Brasileirão Série A | Gold | `#F0A500` | Brand default — flagship competition |
| Copa do Brasil | Red | `#C0392B` | Knockout energy, high stakes |
| Brasileirão Série B | Blue | `#2E86DE` | Aspirational, premium, "the climb" |
| Brasileirão Série C | Green | `#27AE60` | Growth, emerging talent |
| Brasileirão Série D | Purple | `#8E44AD` | Grassroots, distinct from upper divisions |
| Brasileirão Sub-20 | Orange | `#E67E22` | Youth energy — warm but ≠ brand gold |
| Copa Libertadores | Deep Gold | `#F39C12` | Richer gold than brand — continental prestige |
| Copa Sul-Americana | Teal | `#1ABC9C` | Fresh and distinct from Libertadores gold |
| Copa do Mundo 2026 | Special | tri-color | **One-off treatment only** — never reused |

### World Cup 2026 Special Treatment
The World Cup gets a unique template using Brazil's national colors (green `#009B3A`, yellow `#FEDF00`, blue `#002776`) as a tri-stripe element. This treatment is used **exclusively for Copa do Mundo content** — never apply it to any domestic or continental competition.

---

## 05 — Template System

### Three Core Templates

Every piece of content uses one of three templates. The structure never changes — only the competition accent color and data inside.

**Template anatomy — always in this exact order, top to bottom:**
1. Competition badge (accent color, UPPERCASE label)
2. Content type headline (Barlow Condensed 900, Gold)
3. Round / date subtitle (Barlow Condensed 600, Slate)
4. Data body (rows, table, or list)
5. Logo mark — **bottom-right, always, appears last**

---

**Template A — Classificação** (`FootballStandingsShort`)
- Format: ranked table
- Columns: #, Club, Games, Points, Goal Diff, Form dots
- Top rows in promotion zone: green left-border rail
- Bottom rows in relegation zone: red left-border rail
- Used for: Série A, B, C, D, Sub-20, Libertadores, Sul-Americana

---

**Template B — Resultados / Palpites** (`FootballResultsShort` / `FootballPredictionsShort`)
- Format: match rows, score format (Team A  3 × 1  Team B)
- Score in Gold, teams in Ice White
- Predictions show "VS" instead of score
- Results: dark solid background only — no photos, no stadium images
- Predictions: atmospheric blue gradient with stadium lights effect (exception to no-photo rule, this is an art direction choice)

---

**Template C — World Cup** (`FootballWorldCupGroupShort` / `FootballWorldCupKnockoutShort`)
- Uses Brazil tri-color stripe at top — exclusively for Copa do Mundo 2026
- Never reuse this tri-color treatment for any other competition

---

## 06 — Spacing & Grid

**Base-8 rule:** Every gap, padding, and margin must be a multiple of 8px.

| Token | Value | Use |
|---|---|---|
| XS | 8px | Inner element gap |
| SM | 16px | Row gap between data items |
| MD | 24px | Section separation |
| LG | 40px | Card internal padding |
| XL | 56px | Section padding |
| XXL | 80px | Hero / cover padding |

### Content Card Safe Zones (9:16 canvas — 1080×1920px)

| Zone | Value |
|---|---|
| Top padding | 40px |
| Bottom padding | 32px |
| Left / Right margins | 28px |
| Logo clearspace from edges | 16px |
| Minimum font size | 18px |

---

## 07 — Do & Don't

### DO
- Use **one background style** — solid dark `#0b0d12` only for data templates. No blurred photos, no stadium aerials, no gradients behind data.
- Place the **logo bottom-right** on every single piece of content. Same size. Same position. Every time.
- Use the **competition accent color only on the title strip and key accents** — not as a full background fill.
- Keep **maximum 2 font weights** visible per card — 900 for headline, 600 or 700 for data.
- Include a **teaser CTA in every description** — "Próxima rodada sexta" or "Palpites completos no link da bio."

### DON'T
- **Never use more than 2 accent colors** on a single card. Brand gold + competition accent. That's it.
- **Never change the logo position** between cards.
- **Never put a blurred stadium photo** as the background of a data card. It competes with the data and loses every time. (Predictions template is an intentional exception.)
- **Never mix Série A gold with Série B blue** on the same card unless explicitly comparing the two competitions.
- **Never use the World Cup tri-color treatment** for any Brazilian domestic competition, even Copa do Brasil.
- **Never scale the logo smaller than 80px wide** on a 1080px canvas.

---

## 08 — Motion & Timing

Data should feel like it's being **revealed**, not pasted. Every element enters with purpose.

### Timing Spec (at 30fps)

| Motion Event | Duration | Frames | Notes |
|---|---|---|---|
| Competition accent stripe wipe | 400ms | 12 frames | Left-to-right, runs from frame 0 |
| Header chip entrance | 400ms | starts frame 0 | Spring ease-out |
| Hero title entrance | 400ms | starts frame 7 | Spring ease-out, 1 stagger after chip |
| Subtitle entrance | 400ms | starts frame 14 | Spring ease-out, 2 staggers after chip |
| Title hold (before data) | 800ms | ~frames 14–48 | Title visible alone — builds anticipation |
| Row entry stagger | 200ms each | 6 frames apart | First row at frame 48, ease-out spring |
| Score pop | 150ms | 5 frames | Scale 0.8 → 1.0, after row enters |
| Logo / footer fade-in | 300ms | 9 frames | **Always last** — after all data is visible |

### Implementation in Code

These constants live in `src/lib/animations.ts`:

```ts
ROWS_START_FRAME = 48   // first row starts here (~0.8s hold after header)
ROW_STAGGER_FRAMES = 6  // 200ms per row at 30fps
HEADER_STAGGER_FRAMES = 7
ACCENT_WIPE_FRAMES = 12 // 400ms accent stripe wipe
```

Footer start frame is calculated dynamically per composition:
```ts
footerStartFrame(rowCount) = rowStartFrame(rowCount - 1) + 18
```

---

## Quick Reference

```
Background .......... #0b0d12
Card surface ........ #0f1318
Brand gold .......... #F0A500
Ice white (text) .... #c0ccd8
Slate (meta) ........ #3a5060
Muted (borders) ..... #1e2a34

Display font ........ Barlow Condensed
Data font ........... Barlow

Logo position ....... Bottom-right, always, appears last
Spacing base ........ 8px grid

Win ................. #27AE60
Draw ................ #5A6A7A
Loss ................ #E74C3C
```

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-04-16 | Initial version created from brand guide v1.0 + implementation calibration for 1080×1920 video canvas | Foot Analysis |
| 2026-04-16 | Added Implementation section with exact frame counts, code constants, and render server font warning | Foot Analysis |
| 2026-04-16 | Corrected round/subtitle type role: color → Slate (#3a5060), weight → 600 (was white/700 in code) | Foot Analysis |
| 2026-04-16 | Confirmed Results template background = solid dark only (no backgroundImagePath in Results jobs) | Foot Analysis |
