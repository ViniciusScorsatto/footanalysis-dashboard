import type {ShortVisualComposition} from '../visual-short/types';

export const sampleShortVisualComposition: ShortVisualComposition = {
  id: 'sample-short-visual:v1',
  contentId: 'sample-short-content',
  template: 'CLASSIFICACAO_DESTAQUE',
  templateVariant: 'championship',
  resolution: {width: 1080, height: 1920, aspectRatio: '9:16'},
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 330,
  durationSeconds: 11,
  scenes: [
    {id: 'hook', type: 'HOOK', from: 0, durationInFrames: 66, transition: 'FADE_CURTO', texts: [{text: 'TEM NOVO LÍDER! 🔥', role: 'HEADLINE', x: 72, y: 330, width: 936, height: 250, fontSize: 78, align: 'center', color: '#f0f4f8', fontFamily: 'Orbitron Teaser'}], data: {template: 'CLASSIFICACAO_DESTAQUE'}},
    {id: 'main', type: 'MAIN', from: 66, durationInFrames: 149, transition: 'FADE_CURTO', texts: [{text: 'Flamengo assumiu a ponta', role: 'SUBHEADLINE', x: 72, y: 710, width: 936, height: 150, fontSize: 42, align: 'center', color: '#f0f4f8', fontFamily: 'Orbitron Teaser'}, {text: '51 PONTOS', role: 'STAT', x: 72, y: 920, width: 936, height: 100, fontSize: 64, align: 'center', color: '#F0A500', fontFamily: 'Oxanium Teaser'}], data: {template: 'CLASSIFICACAO_DESTAQUE', teams: [{name: 'Flamengo', logoPath: '/logos/flamengo-127.png', accentColor: '#C8102E'}, {name: 'Palmeiras', logoPath: '/logos/palmeiras.png', accentColor: '#1D8A45'}], scoreline: '51 PONTOS'}},
    {id: 'consequence', type: 'CONSEQUENCE', from: 215, durationInFrames: 66, transition: 'FADE_CURTO', texts: [{text: 'Palmeiras cai para 2º', role: 'SUBHEADLINE', x: 72, y: 1040, width: 936, height: 220, fontSize: 42, align: 'center', color: '#f0f4f8', fontFamily: 'Orbitron Teaser'}], data: {template: 'CLASSIFICACAO_DESTAQUE'}},
    {id: 'cta', type: 'CTA', from: 281, durationInFrames: 49, transition: 'FADE_CURTO', texts: [{text: 'QUEM TERMINA CAMPEÃO?', role: 'CTA', x: 72, y: 1420, width: 936, height: 140, fontSize: 44, align: 'center', color: '#f0f4f8', fontFamily: 'Orbitron Teaser'}], data: {template: 'CLASSIFICACAO_DESTAQUE'}},
  ],
  assets: [{name: 'Flamengo', logoPath: '/logos/flamengo-127.png', accentColor: '#C8102E'}, {name: 'Palmeiras', logoPath: '/logos/palmeiras.png', accentColor: '#1D8A45'}],
  safeAreas: {top: 148, right: 72, bottom: 190, left: 72, center: {x: 72, width: 936}},
  animations: {entrance: 'SLIDE_FADE', transition: 'FADE_CURTO', stat: 'POP'},
  colors: {bg: '#0b0d12', surface: '#0f1318', card: '#141c24', border: '#1e2a3a', gold: '#F0A500', silver: '#c0ccd8', steel: '#3a5060', white: '#f0f4f8', danger: '#E74C3C', win: '#27AE60'},
  metadata: {competition: 'Brasileirão Série A', season: 2026, round: '5', sourceStoryType: 'MUDANCA_LIDERANCA'},
  version: 1,
  status: 'PREVIEW_VALIDADO',
};
