import type { ComponentType } from 'react';
type DetailLoader = () => Promise<{ default: ComponentType }>;
import { FEATURE_OVERVIEWS } from './feature-overview-catalog.js';

// Keep the content and UI behind the selected detail route.
export const featureOverviewLoaders: Readonly<Record<string, DetailLoader>> =
  Object.fromEntries(
    Object.keys(FEATURE_OVERVIEWS).map((id) => [
      id,
      () => import('./feature-overview.js'),
    ]),
  );

const authorization = () => import('./authorization-overview.js');

export const builtInDetailLoaders: Readonly<Record<string, DetailLoader>> = {
  ...featureOverviewLoaders,
  db: () => import('./database-overview.js'),
  i18n: () => import('./i18n-overview.js'),
  'app-plugin-i18n': () => import('./i18n-overview.js'),
  'app-plugin-agents': () => import('./agents-overview.js'),
  'app-plugin-authentication': () => import('./authentication-overview.js'),
  'app-plugin-authorization': authorization,
  'app-plugin-authz-default-access': authorization,
  'app-plugin-authz-sharing-rules': authorization,
  'app-plugin-authz-restriction-rules': authorization,
  'app-plugin-concurrency': () => import('./concurrency-overview.js'),
  'app-plugin-database-explorer': () =>
    import('./database-explorer-overview.js'),
  'app-plugin-file': () => import('./file-overview.js'),
};
