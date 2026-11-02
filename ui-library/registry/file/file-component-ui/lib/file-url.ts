export function resolveSafeFileUrl(
  value: string,
  trustedBlobUrls: ReadonlySet<string> = new Set(),
): string | undefined {
  const url = value.trim();
  if (!url) return undefined;
  if (trustedBlobUrls.has(url) && url.startsWith('blob:')) return url;
  try {
    const resolved = new URL(url, window.location.href);
    return resolved.protocol === 'http:' || resolved.protocol === 'https:'
      ? url
      : undefined;
  } catch {
    return undefined;
  }
}

export function fileUrlCredentials(url: string): RequestCredentials {
  return new URL(url, window.location.href).origin === window.location.origin
    ? 'same-origin'
    : 'omit';
}
