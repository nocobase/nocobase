export { default } from './plugin.js';

/**
 * Better Auth's API Key plugin with NocoBase defaults and trusted server operations.
 *
 * It carries Better Auth's name, options, and behaviour, so Better Auth's
 * documentation applies unchanged. It is exported from here rather than
 * installed separately by each application because this package ships the
 * `apikey` table migration, and that table has to match the schema this
 * version of `@better-auth/api-key` declares.
 */
export {
  apiKey,
  findRequestApiKey,
  OWN_KEY_POLICY_SLOT,
  ownKeyPolicySlotOf,
  type ApiKeysPlugin,
  type ApiKeysPluginOptions,
  type OwnKeyPolicySlot,
} from './api-keys.js';
export { createApiKeyApiDocsAccess } from './api-docs.js';

export { API_KEY_ERROR_CODES, API_KEY_TABLE_NAME } from '@better-auth/api-key';

export type {
  ApiKey,
  ApiKeyConfigurationOptions,
  ApiKeyOptions,
} from '@better-auth/api-key';
export {
  ApiKeyService,
  removeUserApiKeys,
  type ServerApiKeySummary,
  type CreateServerApiKeyInput,
} from './service.js';

export {
  ApiKeyScopeError,
  createApiKeyScopes,
  type AccessMapping,
  type MappedAccess,
  type ApiKeyScopes,
  type KeyScopeObjectSource,
} from './scopes.js';
export {
  API_KEY_HEADER,
  DEVICE_APPROVAL_PATHS,
  KEY_MANAGEMENT_PATH_PREFIXES,
  isApiKeySession,
  isDeviceApprovalPath,
  isKeyManagementPath,
  requireSignInSession,
} from './key-sessions.js';
export {
  ApiKeyRequestError,
  connectOwnKeyPolicy,
  DEFAULT_SCOPED_KEY_DAYS,
  READ_ONLY_TEMPLATE_ID,
  ScopedApiKeys,
  type ApiKeysConfig,
  type CheckedApiKey,
  type OwnKeyPolicy,
  type LegacyUpgradeSummary,
  type ScopedApiKeysOptions,
} from './scoped-keys.js';
export {
  apiKeyScopesToken,
  idleApiKeysToken,
  memberApiKeysToken,
  scopedApiKeysToken,
  systemApiKeysToken,
} from './tokens.js';
export {
  assertSystemPermissions,
  SYSTEM_KEY_OWNER,
  SystemApiKeys,
  systemKeySet,
  type AdoptSystemKeyInput,
  type CreateSystemKeyInput,
  type SystemKeyAction,
  type SystemKeyEvent,
  type SystemKeyManagedBy,
  type SystemKeyManager,
  type SystemKeyView,
} from './system-keys.js';
export {
  MemberKeys,
  type MemberKeysFilter,
  type MemberKeyView,
} from './member-keys.js';
export {
  IdleKeys,
  IDLE_NOTICE_DAYS,
  type IdleReminder,
  type IdleSweepResult,
} from './idle.js';
export type { ApiKeyRules, ApiKeyRulesInput } from './rules.js';
export { API_KEYS_ERROR_DOMAIN, toApiKeysApiError } from './routes/errors.js';
export { ApiKeysProvider } from './providers/index.js';
export * from '../shared/scopes.js';
