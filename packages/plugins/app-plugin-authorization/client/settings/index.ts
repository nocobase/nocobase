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
export { DATA_RULES_TAB, PERMISSION_CHECK_TAB, ROLES_TAB } from './tab-keys.js';
export { authorizationSettingsToken } from '../tokens.js';

/** The Default access rules, for the Default access plugin's tab under Data rules. */
export const loadDefaultAccessRules = (): Promise<
  typeof import('./default-access.js')
> => import('./default-access.js');

/** The Sharing rules, for the Sharing rules plugin's tab under Data rules. */
export const loadSharingRules = (): Promise<
  typeof import('./sharing-rules.js')
> => import('./sharing-rules.js');

/** The Restriction rules, for the Restriction rules plugin's tab under Data rules. */
export const loadRestrictionRules = (): Promise<
  typeof import('./restriction-rules.js')
> => import('./restriction-rules.js');

// What a credential such as an API key may do, limited to what the person giving it holds: for the API keys plugin.
export type {
  KeyPermissionCeiling,
  KeyPermissionCeilingAction,
  KeyPermissionEditorProps,
} from './key-permission-editor.js';

/** The permission table of a credential such as an API key, loaded when a page shows it. */
export const loadKeyPermissionEditor = (): Promise<
  typeof import('./key-permission-editor.js')
> => import('./key-permission-editor.js');
