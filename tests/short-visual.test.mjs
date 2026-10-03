import test from 'node:test';
import assert from 'node:assert/strict';
import {buildShortVisualComposition, selectVisualTemplate, validateShortVisualComposition} from '../scripts/lib/short-visual-composition.mjs';

const content = (overrides = {}) => ({
  id: 'content-test:v1', storyId: 'story-test', competition: 'Brasileirão Série A', season: 2026, round: '5', formato: 'CLASSIFICACAO',
  titulo: 'FLAMENGO ASSUME A LIDERANÇA!', hook: 'Tem novo líder no Brasileirão.', voiceover: 'Tem novo líder no Brasileirão. Flamengo assumiu a ponta. Quem termina campeão?',
  screenTexts: [{type: 'HOOK', text: 'TEM NOVO LÍDER!'}, {type: 'PRIMARY', text: 'Flamengo assumiu a ponta'}, {type: 'STAT', text: '51 PONTOS'}, {type: 'CTA', text: 'QUEM TERMINA CAMPEÃO?'}],
  descricao: 'Flamengo assumiu a ponta.', cta: 'Quem termina campeão?', duracaoEstimada: {seconds: 11}, ...overrides,
});
const story = (overrides = {}) => ({tipo: 'MUDANCA_LIDERANCA', times: ['Flamengo', 'Palmeiras'], jogadores: [], ...overrides});

test('seleciona templates por formato e tipo', () => {
  assert.equal(selectVisualTemplate({content: content(), story: story()}), 'CLASSIFICACAO_DESTAQUE');
  assert.equal(selectVisualTemplate({content: content({formato: 'RESULTADO'}), story: story({tipo: 'GOLEADA'})}), 'RESULTADO_DESTAQUE');
  assert.equal(selectVisualTemplate({content: content({formato: 'SEQUENCIA'}), story: story({tipo: 'SEQUENCIA_VITORIAS'})}), 'SEQUENCIA');
  assert.equal(selectVisualTemplate({content: content({formato: 'ESTATISTICAS'}), story: story({tipo: 'DOMINIO_ESTATISTICO'})}), 'ESTATISTICA_COMPARATIVA');
  assert.equal(selectVisualTemplate({content: content({formato: 'ARTILHARIA'}), story: story({tipo: 'ARTILHARIA'})}), 'ARTILHARIA');
  assert.equal(selectVisualTemplate({content: content({formato: 'RESUMO_RODADA'}), story: story({tipo: 'RESUMO_RODADA'})}), 'RESUMO_RODADA');
  assert.equal(selectVisualTemplate({content: content({formato: 'REBAIXAMENTO'}), story: story({tipo: 'MUDANCA_Z4'})}), 'REBAIXAMENTO');
});

test('gera composição 1080x1920 com safe area e timing fechado', () => {
  const composition = buildShortVisualComposition({content: content(), story: story(), assets: [{name: 'Flamengo', logoPath: '/logos/flamengo-127.png'}, {name: 'Palmeiras'}]});
  const validation = validateShortVisualComposition(composition, content());
  assert.equal(composition.width, 1080);
  assert.equal(composition.height, 1920);
  assert.equal(composition.resolution.aspectRatio, '9:16');
  assert.equal(composition.scenes.length, 4);
  assert.equal(composition.scenes.at(-1).from + composition.scenes.at(-1).durationInFrames, composition.durationInFrames);
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.ok(validation.warnings.some((warning) => warning.includes('fallback')));
});

test('é determinística, suporta nomes longos e permite override de template/duração', () => {
  const source = {content: content({id: 'long:v1', formato: 'RESULTADO', duracaoEstimada: {seconds: 18}}), story: story({tipo: 'GOLEADA', times: ['Red Bull Bragantino', 'Atlético-Mineiro']})};
  const first = buildShortVisualComposition({...source, options: {templateOverride: 'RESULTADO_DESTAQUE', durationSeconds: 18}});
  const second = buildShortVisualComposition({...source, options: {templateOverride: 'RESULTADO_DESTAQUE', durationSeconds: 18}});
  assert.deepEqual(first, second);
  assert.equal(first.template, 'RESULTADO_DESTAQUE');
  assert.equal(first.durationSeconds, 18);
  assert.equal(validateShortVisualComposition(first, source.content).valid, true);
});

test('rejeita texto fora da safe area e composição sem cenas', () => {
  const composition = buildShortVisualComposition({content: content(), story: story()});
  const invalid = {...composition, scenes: [{...composition.scenes[0], texts: [{...composition.scenes[0].texts[0], y: 1800}]}]};
  const validation = validateShortVisualComposition(invalid, content());
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes('safe area')));
});
