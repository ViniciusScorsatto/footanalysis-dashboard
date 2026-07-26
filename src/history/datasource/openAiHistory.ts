import type {RawCompetitionHistory} from '../types/index.js';
import {isRecord} from '../utils/json.js';

const historicalChampionsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['champions'],
  properties: {
    champions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['year', 'champion', 'country', 'runnerUp', 'score', 'notes'],
        properties: {
          year: {type: 'integer'},
          champion: {type: 'string'},
          country: {type: 'string'},
          runnerUp: {type: ['string', 'null']},
          score: {type: ['string', 'null']},
          notes: {type: ['string', 'null']},
        },
      },
    },
  },
} as const;

const extractOutputText = (payload: unknown) => {
  if (!isRecord(payload)) {
    return '';
  }

  if (typeof payload.output_text === 'string') {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload.output)) {
    return '';
  }

  return payload.output
    .flatMap((item) => {
      if (!isRecord(item) || !Array.isArray(item.content)) {
        return [];
      }

      return item.content.map((content) =>
        isRecord(content) && typeof content.text === 'string' ? content.text : ''
      );
    })
    .join('')
    .trim();
};

export const generateHistoricalChampions = async (
  competition: string,
  amount: number
): Promise<RawCompetitionHistory> => {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY. Add it to .env to generate historical football data.');
  }

  const model = process.env.OPENAI_HISTORICAL_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-5';
  const useWebSearch = process.env.OPENAI_HISTORICAL_WEB_SEARCH !== 'false';
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content:
            'Return only historically accurate football competition data. Use web search for current completed editions when available. Do not include prose outside JSON.',
        },
        {
          role: 'user',
          content:
            `Return the last ${amount} completed champions for ${competition}. ` +
            'For each item include year, champion, runnerUp, score when a final score exists, country, and optional notes. ' +
            'Use the current date to exclude competitions still in progress, and do not invent future editions that have not been completed.',
        },
      ],
      ...(useWebSearch ? {tools: [{type: 'web_search', search_context_size: 'medium'}]} : {}),
      text: {
        format: {
          type: 'json_schema',
          name: 'historical_champions',
          strict: true,
          schema: historicalChampionsSchema,
        },
      },
      ...(String(model).startsWith('gpt-5') ? {reasoning: {effort: 'low'}} : {}),
    }),
  });
  const payload: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === 'string'
        ? payload.error.message
        : `OpenAI request failed with ${response.status}`;
    throw new Error(message);
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error('OpenAI returned an empty historical champions response.');
  }

  const parsed: unknown = JSON.parse(outputText);
  if (!isRecord(parsed)) {
    throw new Error('OpenAI historical champions response was not a JSON object.');
  }

  return parsed;
};
