import test from 'node:test';
import assert from 'node:assert/strict';
import {generateShortContent, validateShortContent} from '../scripts/lib/short-content-generator.mjs';

const story = (overrides = {}) => ({
  id: 'story-test', competition_name: 'Brasileirão Série A', season: 2026, round: 'Regular Season - 5',
  tipo: 'MUDANCA_LIDERANCA', pontuacao: 96, formatoRecomendado: 'CLASSIFICACAO',
  titulo: 'FLAMENGO ASSUME A LIDERANÇA! 🔥', resumo: 'O Flamengo ultrapassou o Palmeiras e assumiu a liderança.',
  justificativa: 'Houve mudança efetiva na liderança.', times: ['Flamengo', 'Palmeiras'], jogadores: [],
  evidencias: [{metrica: 'líder', antes: 'Palmeiras', depois: 'Flamengo'}], ...overrides,
});

test('gera conteúdo completo de mudança de liderança em português', () => {
  const content = generateShortContent(story());
  const validation = validateShortContent(content, story());
  assert.equal(validation.valid, true, validation.errors.join('; '));
  assert.match(content.hook, /novo líder/);
  assert.ok(content.voiceover.includes('Flamengo'));
  assert.ok(content.screenTexts.some((item) => item.type === 'CTA'));
  assert.equal(content.tags.length >= 20, true);
  assert.equal(content.tags.some((tag) => tag.includes('#')), false);
});

test('usa estratégias contextuais para Z4, goleada, sequência e artilharia', () => {
  const cases = [
    {tipo: 'MUDANCA_Z4', formatoRecomendado: 'REBAIXAMENTO', titulo: 'VASCO ENTRA NO Z4! 🚨', resumo: 'O Vasco entrou no Z4 após nova derrota.', times: ['Vasco'], expected: 'escapar'},
    {tipo: 'GOLEADA', formatoRecomendado: 'RESULTADO', titulo: 'PALMEIRAS ATROPELA VITORIA!', resumo: 'O Palmeiras venceu por 5 a 0.', times: ['Palmeiras', 'Vitoria'], expected: 'atropelou'},
    {tipo: 'SEQUENCIA_VITORIAS', formatoRecomendado: 'SEQUENCIA', titulo: 'PALMEIRAS CHEGA À 5ª VITÓRIA SEGUIDA!', resumo: 'O Palmeiras venceu cinco jogos seguidos.', times: ['Palmeiras'], expected: 'Até onde'},
    {tipo: 'ARTILHARIA', formatoRecomendado: 'ARTILHARIA', titulo: 'CALLERI ASSUME A ARTILHARIA!', resumo: 'Calleri virou o líder da artilharia.', times: ['São Paulo'], jogadores: ['Calleri'], expected: 'artilheiro'},
  ];
  for (const item of cases) {
    const content = generateShortContent(story(item));
    assert.match(`${content.hook} ${content.cta}`, new RegExp(item.expected, 'i'));
    assert.equal(validateShortContent(content, story(item)).valid, true);
  }
});

test('trata dados curtos sem inventar estatísticas e estima duração', () => {
  const source = story({tipo: 'GOLEADA', formatoRecomendado: 'RESULTADO', titulo: 'GOLEADA NA RODADA', resumo: 'O time venceu com autoridade.', justificativa: 'Placar de 4 a 0.', times: ['Bahia'], evidencias: [{metrica: 'placar', valor: '4–0'}]});
  const content = generateShortContent(source, {version: 2});
  assert.equal(content.version, 2);
  assert.ok(content.duracaoEstimada.seconds >= 5 && content.duracaoEstimada.seconds <= 30);
  assert.equal(content.screenTexts.some((item) => item.text.includes('xG')), false);
  assert.equal(validateShortContent(content, source).valid, true);
});

test('rejeita conteúdo editado com inglês ou placeholders', () => {
  const source = story();
  const content = generateShortContent(source);
  const invalid = {...content, titulo: 'Watch this TBD', hook: 'Watch now'};
  const validation = validateShortContent(invalid, source);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes('inglês')));
  assert.ok(validation.errors.some((error) => error.includes('placeholder')));
});
