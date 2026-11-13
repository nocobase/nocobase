import { createHash } from 'node:crypto';

import { Hono } from 'hono';

import {
  defineAppConfig,
  envBoolean,
  type AppConfigFactory,
  type AppIdentityConfig,
  type AppConfigAccessor,
} from '../config/index.js';
import {
  defineRootRoutes,
  type AppRootRouteContribution,
} from '../router/index.js';
import { joinBasePath, normalizeBasePath } from '../support/paths.js';

export interface PwaManifestIcon {
  /** A path inside the application, such as `assets/pwa-192.png`, or an absolute `https://` URL kept as it is. */
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface PwaManifestOptions {
  name: string;
  shortName: string;
  description?: string;
  themeColor?: string;
  backgroundColor?: string;
  icons?: readonly PwaManifestIcon[];
}

export interface PwaManifest {
  id: string;
  name: string;
  short_name: string;
  description?: string;
  start_url: string;
  scope: string;
  display: 'standalone';
  theme_color?: string;
  background_color?: string;
  icons: PwaManifestIcon[];
}

/**
 * Installation metadata for an application served at `base`, its public base path. The installed identity, the start
 * page and the scope are all the application's own root, so an application keeps one installation whatever page it
 * was installed from, and moving the application to another base path is a different installed application.
 */
export function pwaManifest(
  base: string,
  options: PwaManifestOptions,
): PwaManifest {
  const scope = `${base.replace(/\/$/u, '')}/`;
  return {
    id: scope,
    name: options.name,
    short_name: options.shortName,
    description: options.description,
    start_url: scope,
    scope,
    display: 'standalone',
    theme_color: options.themeColor,
    background_color: options.backgroundColor,
    icons: (options.icons ?? []).map((icon) => ({
      ...icon,
      src: resolvePwaPath(scope, icon.src),
    })),
  };
}

function resolvePwaPath(scope: string, src: string): string {
  return /^https?:\/\//iu.test(src)
    ? src
    : `${scope}${src.replace(/^\/+/u, '')}`;
}

export interface PwaConfig {
  /** Whether browsers are offered installation. `APP_PWA_ENABLED` sets it; the browser reads it to link the manifest. */
  readonly enabled: boolean;
  /** Defaults to the client's `app.title`, then `NocoBase`. */
  readonly name?: string;
  /** The name under the icon; defaults to `name`. */
  readonly shortName?: string;
  readonly description?: string;
  readonly themeColor?: string;
  readonly backgroundColor?: string;
  /** Paths inside the application's public base path, or absolute `https://` URLs. */
  readonly icons: readonly PwaManifestIcon[];
  /** The icon iOS and iPadOS show on the home screen, resolved like `icons`. The browser reads it to link it. */
  readonly appleTouchIcon: string;
}

export const defaultPwaIcons: readonly PwaManifestIcon[] = Object.freeze([
  { src: 'assets/pwa-192.png', sizes: '192x192', type: 'image/png' },
  { src: 'assets/pwa-512.png', sizes: '512x512', type: 'image/png' },
]);

/**
 * The `pwa` configuration section. Only `enabled` and `appleTouchIcon` reach the browser; the manifest itself is
 * served by {@link createPwaRoutes}.
 */
export function definePwaConfig(
  defaults: Partial<PwaConfig> = {},
): AppConfigFactory<PwaConfig> {
  return defineAppConfig<PwaConfig>({
    env: {
      APP_PWA_ENABLED: envBoolean('enabled', {
        description:
          'Offer browsers to install the application as a standalone app; false turns the manifest off.',
        required: false,
      }),
    },
    public: ['enabled', 'appleTouchIcon'],
    defaults: {
      enabled: true,
      icons: defaultPwaIcons,
      appleTouchIcon: 'assets/pwa-192.png',
      ...defaults,
    },
    validate(value, context) {
      if (typeof value.enabled !== 'boolean')
        context.error('enabled', 'Must be a boolean.');
      for (const key of [
        'name',
        'shortName',
        'description',
        'themeColor',
        'backgroundColor',
      ] as const) {
        if (value[key] !== undefined && typeof value[key] !== 'string')
          context.error(key, 'Must be a string.');
      }
      if (!isPwaPath(value.appleTouchIcon))
        context.error(
          'appleTouchIcon',
          'Must be a path inside the application or an absolute http(s) URL.',
        );
      if (!Array.isArray(value.icons) || value.icons.length === 0) {
        context.error('icons', 'Must list at least one icon.');
        return;
      }
      value.icons.forEach((icon: unknown, index) => {
        const entry = (icon ?? {}) as Record<string, unknown>;
        if (!isPwaPath(entry.src))
          context.error(
            `icons.${index}.src`,
            'Must be a path inside the application or an absolute http(s) URL.',
          );
        for (const key of ['sizes', 'type'] as const) {
          if (typeof entry[key] !== 'string' || !entry[key])
            context.error(`icons.${index}.${key}`, 'Must be a string.');
        }
        if (entry.purpose !== undefined && typeof entry.purpose !== 'string')
          context.error(`icons.${index}.purpose`, 'Must be a string.');
      });
    },
  });
}

function isPwaPath(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (/^https?:\/\//iu.test(value)) return true;
  // Another scheme, a protocol-relative URL or a path leaving the application would not belong to it.
  return (
    !/^[a-z][a-z\d+.-]*:/iu.test(value) &&
    !value.startsWith('//') &&
    !value.split(/[/\\]/u).includes('..')
  );
}

export interface PwaRoutesApplication {
  readonly config: AppConfigAccessor;
  readonly publicBasePath: string;
}

/**
 * Serves `<publicBasePath>/manifest.webmanifest` from the `pwa` section, without authentication: it carries only the
 * name, colors and icons. Mount it before the SPA routes, whose catch-all would otherwise answer with the page.
 */
export function createPwaRoutes(): AppRootRouteContribution<PwaRoutesApplication> {
  return defineRootRoutes((app: PwaRoutesApplication): Hono => {
    const router = new Hono();
    const identity = app.config.get<AppIdentityConfig>('app');
    const path = joinBasePath(
      normalizeBasePath(identity?.internalBasePath ?? ''),
      '/manifest.webmanifest',
    );
    router.get(path, (context) => {
      const manifest = resolvePwaManifest(app);
      if (!manifest)
        return context.json({ error: 'Not found' }, 404, {
          'cache-control': 'no-cache',
        });
      const body = JSON.stringify(manifest);
      const etag = `"${createHash('sha256').update(body).digest('base64url').slice(0, 27)}"`;
      const headers = {
        'cache-control': 'no-cache',
        'content-type': 'application/manifest+json; charset=utf-8',
        etag,
      };
      if (matchesEtag(context.req.header('if-none-match'), etag))
        return context.body(null, 304, headers);
      return context.body(body, 200, headers);
    });
    return router;
  });
}

/** Read for every request, so a configuration reload reaches the next manifest the browser revalidates. */
function resolvePwaManifest(app: PwaRoutesApplication): PwaManifest | null {
  const config = app.config.get<Partial<PwaConfig>>('pwa') ?? {};
  if (config.enabled === false) return null;
  const title = app.config.get<unknown>('client.app.title');
  const name =
    config.name?.trim() ||
    (typeof title === 'string' && title.trim()) ||
    'NocoBase';
  return pwaManifest(app.publicBasePath, {
    name,
    shortName: config.shortName?.trim() || name,
    description: config.description,
    themeColor: config.themeColor,
    backgroundColor: config.backgroundColor,
    icons: config.icons ?? defaultPwaIcons,
  });
}

function matchesEtag(header: string | undefined, etag: string): boolean {
  if (!header) return false;
  return header
    .split(',')
    .some((value) => value.trim().replace(/^W\//u, '') === etag);
}
