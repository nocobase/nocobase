/** A navigation destination, independent of the application deployment prefix. */
export type SendingTarget =
  | { readonly type: 'route'; readonly path: string }
  | { readonly type: 'url'; readonly url: string };

export function isSendingTarget(value: unknown): value is SendingTarget {
  if (!value || typeof value !== 'object') return false;
  const target = value as Record<string, unknown>;
  if (target.type === 'route') {
    return (
      typeof target.path === 'string' &&
      target.path.startsWith('/') &&
      !target.path.startsWith('//') &&
      !hasUnsafeCharacters(target.path)
    );
  }
  if (
    target.type !== 'url' ||
    typeof target.url !== 'string' ||
    !/^https?:\/\//i.test(target.url) ||
    hasUnsafeCharacters(target.url)
  )
    return false;
  try {
    const url = new URL(target.url);
    return Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateSendingTarget(
  value: unknown,
): SendingTarget | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isSendingTarget(value))
    throw new Error(
      'Invalid notification target: use an internal route path or a complete HTTP(S) URL.',
    );
  return value.type === 'route'
    ? { type: 'route', path: value.path }
    : { type: 'url', url: value.url };
}

function hasUnsafeCharacters(value: string): boolean {
  return [...value].some(
    (character) =>
      character === '\\' ||
      character.charCodeAt(0) <= 32 ||
      character.charCodeAt(0) === 127,
  );
}
