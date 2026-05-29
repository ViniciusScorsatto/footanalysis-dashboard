# AGENTS.md - Foot Analysis Project Contract

This project contains only the football / Foot Analysis Remotion workflow extracted from the original multi-sport workspace.

## Scope

- Brand: Foot Analysis
- Sport: Football
- Primary language: Brazilian Portuguese (pt-br), with English channel support
- Output: Remotion videos and football dashboard jobs

## Primary Paths

- src/compositions/ - football Remotion composition entry points
- src/components/ - football visual components
- src/data/ - football fallback and generated job data
- scripts/ - football sync, dashboard, and render orchestration
- scripts/lib/ - football API-Sports, copy, and video job helpers
- config/leagues/ - football league configs
- config/world-cup/ - World Cup group config
- public/logos/ - team and country logos
- public/audio/football/ - football soundtrack assets

## Guardrail

Do not add Formula 1 templates, F1 configs, F1 dashboard routes, FastF1 helpers, or Radio do Box assets here. Shared type changes should stay minimal and support football job JSON consumed by Remotion compositions.
