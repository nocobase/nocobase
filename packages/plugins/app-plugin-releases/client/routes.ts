import {
  defineAppRoutes,
  type AppClientAppRoutesContribution,
  type AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import { Server } from 'lucide-react';
import type { ComponentType } from 'react';

import type { Page } from '../shared/access.js';
import { withReleasesPaths, type ReleasesPaths } from './lib/paths.js';

export interface ReleasesRouteOptions {
  /** App-relative path of Apps and deployments. Defaults to `/releases`. */
  readonly appsPath?: string;
  /**
   * App-relative path of the environments settings page; an environment opens below it. Defaults to
   * `/release-environments`; an application with a settings area of its own routes `EnvironmentsSettings` and
   * `ReleasesEnvironmentPage` (`client/pages`) there instead.
   */
  readonly environmentsPath?: string;
}

const page = (id: Page) =>
  ({ resource: { type: 'page', id }, action: 'access' }) as const;

/** A page loaded with the paths it links to the other pages by. */
function loader(
  load: () => Promise<{ default: ComponentType }>,
  paths: ReleasesPaths,
): () => Promise<{ default: ComponentType }> {
  return async () => ({
    default: withReleasesPaths((await load()).default, paths),
  });
}

function pathsOf(options: ReleasesRouteOptions): ReleasesPaths {
  return {
    apps: normalizePath(options.appsPath ?? '/releases'),
    environments: normalizePath(
      options.environmentsPath ?? '/release-environments',
    ),
  };
}

export function appsDefinition(
  path = '/releases',
  paths: ReleasesPaths = pathsOf({ appsPath: path }),
): AppClientRoutePageDefinition {
  return {
    name: 'rel-apps',
    path: normalizePath(path),
    auth: 'required',
    authz: page('rel-apps'),
    // No list and no menu entry of its own: Apps are listed and created on their environment's page, and the address
    // alone leads there (`apps-outlet.tsx`).
    componentLoader: loader(() => import('./pages/apps-outlet.js'), paths),
    children: [
      // Before `:appId`: an App may not be called `new` or `requests`. Create App's old address leads to the
      // environments; `requests/:requestId` is kept for older links; the App's page opens its requests over itself.
      {
        name: 'rel-app-new',
        path: 'new',
        componentLoader: loader(
          () => import('./pages/new-app-redirect.js'),
          paths,
        ),
      },
      {
        name: 'rel-request',
        path: 'requests/:requestId',
        presentation: {
          kind: 'dialog',
          title: 'ui.requests.title',
          namespace: '@nocobase/app-plugin-releases',
        },
        componentLoader: loader(() => import('./pages/request-page.js'), paths),
      },
      {
        name: 'rel-app',
        path: ':appId',
        componentLoader: loader(() => import('./pages/app-page.js'), paths),
        children: [
          {
            name: 'rel-app-request',
            path: 'requests/:requestId',
            presentation: {
              kind: 'dialog',
              title: 'ui.requests.title',
              namespace: '@nocobase/app-plugin-releases',
            },
            componentLoader: loader(
              () => import('./pages/request-page.js'),
              paths,
            ),
          },
        ],
      },
    ],
  };
}

export function environmentsDefinition(
  path = '/release-environments',
  paths: ReleasesPaths = pathsOf({ environmentsPath: path }),
): AppClientRoutePageDefinition {
  return {
    name: 'rel-environments',
    path: normalizePath(path),
    auth: 'required',
    // The plugin's entry opens to environment readers (the `rel.environments` `read` setting) and to App readers (the
    // Apps page), who list and create an environment's Apps there, as the server reads environments for either
    // (`EnvironmentService.requireReader`). A route names a single grant, so this one names none and the page decides
    // (`canEnterEnvironments`, `environments-page.tsx`); its menu entry shows to every signed-in user. Each part of the
    // pages keeps its own check: the Apps and Create App the Apps grants, the variables, the connection check and the
    // shared hosts' capacity the setting, on the server and in the page.
    authz: 'skip',
    navigation: { title: 'ui.nav.environments', icon: Server },
    componentLoader: loader(
      () => import('./pages/environments-page.js'),
      paths,
    ),
    children: [
      {
        name: 'rel-environment',
        path: ':environmentId',
        componentLoader: loader(
          () => import('./pages/environment-page.js'),
          paths,
        ),
        children: [
          // Create App over the environment, the App going to it.
          {
            name: 'rel-environment-app-new',
            path: 'apps/new',
            presentation: {
              kind: 'dialog',
              title: 'ui.apps.create',
              namespace: '@nocobase/app-plugin-releases',
            },
            componentLoader: loader(
              () => import('./pages/new-app-page.js'),
              paths,
            ),
          },
        ],
      },
    ],
  };
}

/** The plugin's pages at the given paths. */
export function createReleasesRoutes(
  options: ReleasesRouteOptions = {},
): AppClientAppRoutesContribution {
  const paths = pathsOf(options);
  return defineAppRoutes([
    appsDefinition(paths.apps, paths),
    environmentsDefinition(paths.environments, paths),
  ]);
}

function normalizePath(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed)
    throw new TypeError('A releases route path must contain a path segment');
  return `/${trimmed}`;
}

const routes: AppClientAppRoutesContribution = createReleasesRoutes();

export default routes;
