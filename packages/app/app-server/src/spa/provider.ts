import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { Hono } from 'hono';
import {
  defineRootRoutes,
  type AppRootRouteContribution,
} from '../router/index.js';

import { registerSpaRoutes } from './routes.js';
import {
  type AppIdentityConfig,
  type AppConfigAccessor,
} from '../config/index.js';
import { type SpaConfig } from './config.js';
import { createMountedOriginProxyHandler } from '../proxy/index.js';
import { joinBasePath } from '../support/index.js';
import type { SpaClientConfigMap } from './types.js';

export interface SpaRoutesApplication {
  readonly config: AppConfigAccessor;
  readonly mode: 'standalone' | 'embedded';
  readonly publicBasePath: string;
  /** Where the application's `package.json` is, read for the name and version the page shows. */
  readonly paths: { readonly rootDir: string };
}

export const spaRootRoutes: AppRootRouteContribution<SpaRoutesApplication> =
  defineRootRoutes((app: SpaRoutesApplication): Hono => {
    const router = new Hono();
    const identity = app.config.get<AppIdentityConfig>('app')!;
    const spa = app.config.get<SpaConfig>('spa')!;
    const apiUrl = joinBasePath(app.publicBasePath, '/api');
    const appPackage = readAppPackage(app.paths.rootDir);
    registerSpaRoutes(router, {
      basePath: identity.internalBasePath,
      publicBasePath: app.publicBasePath,
      handler:
        app.mode === 'standalone' && spa.viteDevUrl
          ? createMountedOriginProxyHandler(new URL(spa.viteDevUrl), {
              publicBasePath: app.publicBasePath,
              unavailableMessage: 'Vite dev server is unavailable.',
            })
          : undefined,
      indexPath: spa.indexPath,
      clientConfig: createClientConfig(
        app.config.get<SpaClientConfigMap>('client') ?? {},
        { appBasePath: app.publicBasePath, apiUrl },
      ),
      // Computed per page so a configuration reload reaches the next page load.
      publicConfig: () =>
        createPublicConfig(
          (app.config.publicValues?.() ?? {}) as SpaClientConfigMap,
          // Read by path rather than through the definition, so these routes stay usable in an application composed
          // without the i18n config registered. The browser falls back to its own default when nothing is published.
          app.config.get<string>('i18n.defaultLocale'),
          appPackage,
        ),
    });
    return router;
  });

function createClientConfig(
  configured: SpaClientConfigMap,
  runtime: { readonly appBasePath: string; readonly apiUrl: string },
): SpaClientConfigMap {
  return {
    ...configured,
    app: {
      ...readConfigSection(configured.app),
      basePath: runtime.appBasePath,
    },
    api: {
      ...readConfigSection(configured.api),
      baseURL: runtime.apiUrl,
    },
  };
}

/**
 * What sections publish through `public`, plus what the runtime itself publishes. The browser starts in the same
 * `i18n.defaultLocale` the server does, rather than a separate client-side copy that could disagree with it, and shows
 * the application's `displayName` and `version` from its own `package.json` rather than values baked in at build time.
 */
function createPublicConfig(
  published: SpaClientConfigMap,
  defaultLocale: string | undefined,
  appPackage: AppPackageIdentity,
): SpaClientConfigMap {
  const withLocale: SpaClientConfigMap =
    defaultLocale === undefined
      ? published
      : {
          ...published,
          i18n: { ...readConfigSection(published.i18n), defaultLocale },
        };
  if (!appPackage.displayName && !appPackage.version) return withLocale;
  return {
    ...withLocale,
    app: {
      ...readConfigSection(withLocale.app),
      ...(appPackage.displayName
        ? { displayName: appPackage.displayName }
        : {}),
      ...(appPackage.version ? { version: appPackage.version } : {}),
    },
  };
}

interface AppPackageIdentity {
  readonly displayName?: string;
  readonly version?: string;
}

function readAppPackage(rootDir: string): AppPackageIdentity {
  const packagePath = path.join(rootDir, 'package.json');
  if (!existsSync(packagePath)) return {};
  const value = JSON.parse(readFileSync(packagePath, 'utf8')) as unknown;
  if (typeof value !== 'object' || value === null) return {};
  const { displayName, version } = value as Record<string, unknown>;
  return {
    ...(typeof displayName === 'string' ? { displayName } : {}),
    ...(typeof version === 'string' ? { version } : {}),
  };
}

function readConfigSection(
  value: SpaClientConfigMap[string] | undefined,
): SpaClientConfigMap {
  return isClientConfigMap(value) ? value : {};
}

function isClientConfigMap(
  value: SpaClientConfigMap[string] | undefined,
): value is SpaClientConfigMap {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
