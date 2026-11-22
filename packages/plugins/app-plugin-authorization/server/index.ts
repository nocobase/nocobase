export { default } from './plugin.js';
export {
  createAppAuthorization,
  type AppAuthorization,
  type AppPermissionSetsConfig,
  type AuthorizationConfig,
  type CreateAppAuthorizationOptions,
} from './authorization.js';
export { authorizationToken } from './tokens.js';
export { AuthorizationProvider } from './providers/authorization.js';
export { databasePlugin, type DatabasePlugin } from './database/plugin.js';
export type { DatabaseApi, DatabaseAuthorizationApi } from './database/api.js';
export type { DatabaseCollectionDefinition } from './database/collection-registry.js';
export type { AuthorizeRepositoryOptions } from './authorize-repository.js';
export {
  pagesPlugin,
  type PagesApi,
  type PagesAuthorizationApi,
  type PagesPlugin,
} from './pages-authorization.js';
export {
  settingsPlugin,
  type SettingsApi,
  type SettingsAuthorizationApi,
  type SettingsItemDefinition,
  type SettingsPlugin,
} from './settings.js';
export {
  AUTHORIZATION_SETTINGS_SECTION,
  reportAuthorizationUi,
  uiPlugin,
  type AuthorizationUiApi,
  type AuthorizationUiGroup,
  type AuthorizationUiGroups,
  type AuthorizationUiPlacement,
  type AuthorizationUiReport,
  type AuthorizationUiReportOptions,
  type AuthorizationUiSection,
  type AuthorizationUiSectionDefinition,
  type AuthorizationUiSectionNode,
  type AuthorizationUiSections,
  type AuthorizationUiTarget,
  type UiAuthorizationApi,
  type UiPlugin,
} from './ui.js';
export {
  DatabasePermissionBuilder,
  DatabasePermissionDefinitionBuilder,
  defineDatabasePermission,
} from './database/builders.js';
export {
  PermissionFieldsBuilder,
  PermissionUpsertBuilder,
  ReadPermissionBuilder,
  RelationPermissionBuilder,
  ThroughPermissionBuilder,
  WritePermissionBuilder,
} from './database/permission-builders.js';
export {
  recordAccess,
  type CustomFilterParams,
  type RecordOwnerParams,
} from './database/record-access.js';
export {
  anyScope,
  condition,
  scopeAst,
  type DatabaseScope,
} from './database/scope.js';
export type {
  AuthorizationCollection,
  DatabaseAuthorizationConditions,
  DatabaseAuthorizationParams,
} from './database/model.js';
export type {
  SubjectAdministration,
  SubjectOption,
  SubjectSelectionContext,
} from './subjects.js';
export { AUTHORIZATION_NAMESPACE } from '../shared.js';
// Re-exported so a plugin can register and check without depending on the library.
export { grantBacked } from '@nocobase/authorization/core';
export type {
  Authorization,
  AuthorizationContext,
  AuthorizationEnv,
  AuthorizationPlugin,
} from '@nocobase/authorization/core';
export type { PermissionSetsApi } from '@nocobase/authorization/permission-sets';
// The workspace catalogue, whole or limited to what a caller holds, for a plugin serving an editor of its own, such as
// the API keys plugin's for one key.
export {
  authorizationOptions,
  grantableAuthorizationOptions,
  type AuthorizationOptions,
} from './options.js';
export { AuthorizationOptionsSchema } from './extension/schemas.js';
export {
  createInspectorApi,
  type InspectorApi,
  type InspectorIdentityResolver,
} from './inspector-identities.js';
