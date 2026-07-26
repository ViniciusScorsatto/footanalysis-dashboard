import fs from 'node:fs/promises';

export const readJsonFile = async (filePath: string): Promise<unknown> => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as unknown;
};

export const writeJsonFile = async (filePath: string, payload: unknown) => {
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
