import { readAppClientRuntimeConfig } from './runtime/browser-config.js';

/**
 * The path the application is mounted at, always with a leading and a trailing slash: `/main/` for an application
 * served from `/main`, and `/` for one served from the origin root.
 *
 * The server decides the mount path at run time and publishes it as `app.basePath` in the client configuration it
 * renders into the page. That is the only source: a page without it was not served by the application server, and
 * resolving URLs against a guess would send requests to the wrong application.
 */
export function resolveAppBase(): string {
  if (typeof document === 'undefined') {
    return '/';
  }
  const trimmed = readConfiguredBasePath().replace(/^\/+|\/+$/gu, '');
  return trimmed ? `/${trimmed}/` : '/';
}

export function resolveAppUrl(path: string = '/'): string {
  if (typeof window === 'undefined') {
    return path;
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) {
    return path;
  }
  const url = new URL(
    path.replace(/^\/+/, ''),
    `${window.location.origin}${resolveAppBase()}`,
  );
  return `${url.pathname}${url.search}${url.hash}`;
}

function readConfiguredBasePath(): string {
  const config = readAppClientRuntimeConfig();
  const app = isRecord(config) ? config.app : undefined;
  const basePath = isRecord(app) ? app.basePath : undefined;
  if (typeof basePath !== 'string') {
    throw new Error(
      'The page carries no app.basePath in its client configuration. Open the application through its server, which renders the configuration into the page.',
    );
  }
  return basePath;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
