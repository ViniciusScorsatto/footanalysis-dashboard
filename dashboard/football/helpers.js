export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const setNoticeStatus = (element, message, tone = 'info') => {
  if (!element) return;
  element.textContent = message;
  element.classList.add('notice');
  element.classList.remove('info', 'success', 'warning', 'error');
  element.classList.add(tone);
};

export const formDataToObject = (form) => Object.fromEntries(new FormData(form).entries());

export const slugifyOutputPart = (value) =>
  String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const normalizeSelectedDates = (value) => {
  const rawValues = Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((item) => item.trim());

  return [...new Set(rawValues.map((item) => String(item).trim()).filter(Boolean))];
};

export const copyText = async (value) => {
  const text = String(value ?? '');
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
};

export const normalizeStudioUrl = (value) => {
  const trimmed = String(value ?? '').trim();
  return trimmed || 'http://127.0.0.1:3000';
};

export const buildStudioPreviewUrl = ({
  studioUrl,
  compositionId,
  knownCompositionIds,
  refreshToken = Date.now().toString(),
}) => {
  const normalizedStudioUrl = normalizeStudioUrl(studioUrl);

  try {
    const url = new URL(normalizedStudioUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (
      pathParts.length &&
      knownCompositionIds.has(decodeURIComponent(pathParts[pathParts.length - 1]))
    ) {
      pathParts.pop();
    }
    const cleanPath = pathParts.length ? `/${pathParts.map(encodeURIComponent).join('/')}` : '';
    url.pathname = compositionId ? `${cleanPath}/${encodeURIComponent(compositionId)}` : cleanPath || '/';
    url.searchParams.set('codexPreviewTs', refreshToken);
    return url.toString();
  } catch {
    if (!compositionId) {
      return `${normalizedStudioUrl}${normalizedStudioUrl.includes('?') ? '&' : '?'}codexPreviewTs=${refreshToken}`;
    }

    return `${normalizedStudioUrl.replace(/\/+$/, '')}/${encodeURIComponent(compositionId)}?codexPreviewTs=${refreshToken}`;
  }
};
