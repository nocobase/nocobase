// The plugin's public client surface. The default export is the registration factory an application lists in its
// client/plugins.ts; it keeps every implementation entry behind a dynamic import, so importing this module costs the
// application only the descriptor.
export { default } from './plugin.js';
export {
  AUTHORIZATION_PERMISSIONS_CHANGED_TOPIC,
  AUTHORIZATION_GLOBAL_PERMISSIONS_CHANGED_TOPIC,
} from '../shared.js';
export {
  AuthorizationClient,
  type AuthorizationCheck,
  type AuthorizationDecision,
  type AuthorizationEffect,
  type AuthorizationInspectInput,
  type AuthorizationInspection,
  type AuthorizationOptionsResponse,
  type AuthorizationPermission,
  type AuthorizationReason,
  type AuthorizationRequirement,
  type AuthorizationRecordOption,
  type AuthorizationSnapshot,
  type AuthorizationSubject,
  type ConfiguredAccess,
  type ConfiguredPermissionSet,
  type LocalizedText,
  type PermissionAssignmentInput,
  type PermissionGrant,
  type PermissionGrantAction,
  type PermissionSet,
  type PermissionSetAssignment,
  type PermissionSetInput,
  type PermissionSetProtection,
  type PermissionSetWriteOperation,
  type ResourceRef,
  type SubjectOption,
  type SubjectPage,
} from './authorization-client.js';
export { authorizationClientToken } from './tokens.js';
export { useAuthorizationRevision } from './use-authorization-revision.js';
export { useCan, type UseCanOptions, type UseCanResult } from './use-can.js';
export { useAuthorizationClient } from './use-authorization-client.js';
