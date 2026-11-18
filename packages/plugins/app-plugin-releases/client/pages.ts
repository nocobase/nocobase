/**
 * The pages, for an application that routes them itself (`releases({ routes: false })`): the route definitions with
 * their page grants, and the components bound to this plugin's namespace for use inside the application's own pages.
 * An environment's page goes below the environments page (`:environmentId`) with Create App over it (`apps/new`), as an
 * App's goes below the Apps path, which has no page of its own (an environment's page lists its Apps), beside Create
 * App's old address (`new`, `ReleasesNewAppRedirect`) and a deployment request (`requests/:requestId`), both declared
 * before `:appId`.
 * When the application mounts them elsewhere than `/releases` and `/release-environments`, it provides
 * `ReleasesPathsContext` (or wraps them with `withReleasesPaths`) so the pages link to one another.
 */
import { withNamespace } from '@nocobase/i18n/client';
import type { ComponentType } from 'react';

import { ACCESS_NAMESPACE } from '../shared/access.js';
import AppPage from './pages/app-page.js';
import EnvironmentPage from './pages/environment-page.js';
import EnvironmentsPage, {
  type EnvironmentsPageProps,
} from './pages/environments-page.js';
import NewAppPage from './pages/new-app-page.js';
import NewAppRedirect from './pages/new-app-redirect.js';
import RequestPage from './pages/request-page.js';

export { appsDefinition, environmentsDefinition } from './routes.js';
export {
  ReleasesPathsContext,
  withReleasesPaths,
  type ReleasesPaths,
} from './lib/paths.js';

export const ReleasesAppPage: ComponentType = withNamespace(
  ACCESS_NAMESPACE,
  AppPage,
);
export const ReleasesNewAppPage: ComponentType = withNamespace(
  ACCESS_NAMESPACE,
  NewAppPage,
);
/** Create App's old address below the Apps page, leading to the environment it names or to the environments. */
export const ReleasesNewAppRedirect: ComponentType = NewAppRedirect;
export const ReleasesRequestPage: ComponentType = withNamespace(
  ACCESS_NAMESPACE,
  RequestPage,
);
export type { EnvironmentsPageProps };
/** The environments page; `title` and `description` name it in the mounting application's words. */
export const EnvironmentsSettings: ComponentType<EnvironmentsPageProps> =
  withNamespace(ACCESS_NAMESPACE, EnvironmentsPage);
export const ReleasesEnvironmentPage: ComponentType = withNamespace(
  ACCESS_NAMESPACE,
  EnvironmentPage,
);
