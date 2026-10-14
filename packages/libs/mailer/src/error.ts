export function mailErrorCode(error: unknown): string | undefined {
  let current = error;
  const seen = new Set<object>();
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    const code: unknown = Reflect.get(current, 'code');
    if (typeof code === 'string' && /^[A-Z_]{1,40}$/u.test(code)) return code;
    current = Reflect.get(current, 'cause');
  }
  return undefined;
}
