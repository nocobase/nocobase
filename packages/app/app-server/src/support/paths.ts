/**
 * Where an application is mounted when `APP_BASE_PATH` is not set. The server is the only place this default lives:
 * the client reads the mount path from the configuration the server renders, and a build is not tied to any path.
 */
export const DEFAULT_APP_BASE_PATH: string = '/main';

export function resolveAppName(value: string | undefined): string {
  const normalized = value?.trim() || 'app';
  return normalized.replace(/^\/+|\/+$/g, '') || 'app';
}

export function resolveAppNameFromBasePath(
  value: string | undefined,
  fallback = 'app',
): string {
  const segments = normalizeBasePath(value ?? '')
    .split('/')
    .filter(Boolean);
  return resolveAppName(segments.at(-1) ?? fallback);
}

export function normalizeBasePath(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/g, '');
  return normalized ? `/${normalized}` : '';
}

export function joinBasePath(basePath: string, pathInsideBase: string): string {
  const normalizedBasePath = normalizeBasePath(basePath);
  const normalizedPath = normalizeBasePath(pathInsideBase);
  return `${normalizedBasePath}${normalizedPath}` || '/';
}
