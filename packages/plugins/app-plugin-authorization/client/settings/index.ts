// The Roles and permissions page's extension points. This entry stays light: a rule plugin's client service provider
// imports it at startup, so it holds types, the service token and lazy loaders, never a component.
export {
  AuthorizationSettings,
  AuthorizationTabRegistry,
  type AuthorizationContentTab,
  type AuthorizationPageTab,
  type AuthorizationRoleTabProps,
  type AuthorizationRuleTabProps,
  type AuthorizationSettingsOptions,
} from './extensions.js';
export {
  defaultPermissionPageCatalog,
  type PermissionNavigationItem,
  type PermissionPageCatalog,
  type PermissionPageCatalogSource,
  type PermissionSettingsCategory,
} from './page-catalog.js';
// What the role editor lists as page permissions, for an application's check that every page is named.
export {
  pagePermissionResources,
  pagePermissionTitle,
  type PagePermissionTitles,
} from './page-permissions.js';
export type { PermissionWorkspaceSelection } from './workspace-selection.js';
export { DATA_RULES_TAB, ROLES_TAB } from './tab-keys.js';
export { authorizationSettingsToken } from '../tokens.js';

/** The Default access rules, for the Default access plugin's tab under Data rules. */
export const loadDefaultAccessRules = (): Promise<
  typeof import('./default-access.js')
> => import('./default-access.js');
