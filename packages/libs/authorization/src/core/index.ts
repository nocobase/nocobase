export {
  Authorization,
  createAuthorization,
  type AuthorizationCheckRequest,
  type AuthorizationContext,
  type AuthorizationEnv,
  type AuthorizationPermission,
  type AuthorizationSnapshot,
  type CreateAuthorizationOptions,
} from './authorization.js';
export {
  CompositeResourceActionBuilder,
  CompositeResourceBuilder,
  CompositeResourceReference,
  dataScopeTarget,
  defineCompositeResource,
  type BindableCompositeResourcePermission,
  type CompositeResource,
  type CompositeResourceAction,
  type CompositeResourceActionAssignments,
  type CompositeResourceActionData,
  type CompositeResourceActions,
  type CompositeResourceApi,
  type CompositeResourceCheck,
  type CompositeResourceConditions,
  type CompositeResourceContribution,
  type CompositeResourceContributionData,
  type CompositeResourceGrant,
  type CompositeResourceGrantAction,
  type CompositeResourceGrantInput,
  type CompositeResourcePolicy,
  type CompositeResourceScopeTarget,
  type DataScope,
  type DataScopeValue,
  type InvalidGrant,
} from './composite.js';
export {
  AccessConstraintRegistry,
  type AccessConstraint,
  type AccessConstraintResolver,
  type AccessConstraintService,
  type ResolveAccessConstraintsInput,
  type RuleAction,
} from './constraints.js';
export type {
  AuthorizationGrant,
  AuthorizationGrantOrigin,
  AuthorizationGrantService,
  AuthorizationGrantSource,
  AuthorizationGrantsChangedListener,
  AuthorizationPolicy,
  PermissionGrant,
  PermissionGrantAction,
  ResolveAllAuthorizationGrantsInput,
  ResolveAuthorizationGrantsInput,
} from './grants.js';
export type {
  AuthorizationMiddleware,
  AuthorizationMiddlewareNext,
  AuthorizationMiddlewareRequest,
  AuthorizationSubjectCollection,
} from './middleware.js';
export type {
  AuthorizationPlugin,
  AuthorizationPluginApi,
  AuthorizationPluginApis,
  AuthorizationPluginSetup,
} from './plugin.js';
export {
  RecordAccessBuilder,
  RecordAccessRegistry,
  defineRecordAccess,
  type RecordAccessContext,
  type RecordAccessDefinition,
  type RecordAccessReference,
} from './record-access.js';
export {
  ResourceItems,
  ResourceTypeRegistry,
  grantBacked,
  type AuthorizationRuntimeContext,
  type GrantBackedOptions,
  type RegisteredResourceType,
  type ResourceAuthorize,
  type ResourceAuthorizeUnrestricted,
  type ResourceItem,
  type ResourceItemAction,
  type ResourceItemDefinition,
  type ResourceTypeAction,
  type ResourceTypeDefinition,
} from './resource-types.js';
export {
  AuthorizationRouteRegistry,
  type AuthorizationRouteEntry,
  type AuthorizationRouteHandler,
  type AuthorizationRouteRequest,
} from './routes.js';
export {
  parseRecordSelection,
  selection,
  type RecordSelection,
  type RecordSelectionHelpers,
} from './selection.js';
export {
  AuthorizationSubjectRegistry,
  type AuthorizationSubjectType,
  type AuthorizationSubjectTypeExtensions,
} from './subjects.js';
export {
  decodeAuthorizationTitle,
  encodeAuthorizationTitle,
  parseAuthorizationTitle,
  type AuthorizationTitle,
} from './titles.js';
export {
  AuthorizationDeniedError,
  type AuthorizationConditions,
  type AuthorizationDecision,
  type AuthorizationEffect,
  type AuthorizationIdentity,
  type AuthorizationReason,
  type AuthorizationRequest,
  type AuthorizationSubject,
  type Principal,
  type ResourceRef,
} from './types.js';
