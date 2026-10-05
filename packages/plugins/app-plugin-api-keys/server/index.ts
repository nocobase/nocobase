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
  type ApiKeysPlugin,
  type ApiKeysPluginOptions,
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
