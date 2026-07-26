export const trimExtraSpaces = (value: string) => value.replace(/\s+/g, ' ').trim();

export const normalizeKey = (value: string) =>
  trimExtraSpaces(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const slugify = (value: string) => normalizeKey(value).replace(/\s+/g, '-');

export const toOptionalString = (value: unknown) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  const normalized = trimExtraSpaces(String(value));
  return normalized ? normalized : undefined;
};

export const shortClubLabel = (name: string) => {
  const cleaned = trimExtraSpaces(
    name
      .replace(/\b(futebol clube|football club|sport club|sociedade esportiva|associacao atletica)\b/gi, '')
      .replace(/\b(fc|sc|ec|ac|afc|cf|u20)\b/gi, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
  );
  const source = cleaned || trimExtraSpaces(name);
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0]?.slice(0, 4).toUpperCase() ?? 'CLB';
  }

  return parts
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};
