export function providerErrorCode(error: unknown): string | undefined {
  let current = error;
  const seen = new Set<object>();
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    if (
      'code' in current &&
      (typeof current.code === 'string' || typeof current.code === 'number')
    )
      return String(current.code);
    current = 'cause' in current ? current.cause : undefined;
  }
  return undefined;
}

const MAX_PROVIDER_ERROR_MESSAGE_LENGTH = 512;

export function sanitizeProviderErrorMessage(
  value: unknown,
  fallback: string,
): string {
  const message =
    value instanceof Error
      ? value.message
      : typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          typeof value === 'bigint'
        ? String(value)
        : '';
  const sanitized = message
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/(https?:\/\/[^\s?#]+)[?#][^\s]*/gi, '$1?[redacted]')
    .replace(
      /\b(authorization|api[-_ ]?key|access[-_ ]?token|secret|password)\s*[:=]\s*[^\s,;]+/gi,
      '$1=[redacted]',
    )
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!sanitized) return fallback;
  return sanitized.length <= MAX_PROVIDER_ERROR_MESSAGE_LENGTH
    ? sanitized
    : `${sanitized.slice(0, MAX_PROVIDER_ERROR_MESSAGE_LENGTH - 1)}…`;
}
