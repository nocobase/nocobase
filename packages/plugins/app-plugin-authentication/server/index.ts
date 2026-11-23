export { default } from './plugin.js';
export * from './auth.js';
export * from './auth-storage.js';
export {
  AUTH_PUBLIC_PATHS,
  BETTER_AUTH_SECRETS_PURPOSE,
  defineAuthConfig,
  resolveAuthSecret,
  resolveAuthSecrets,
  validateAuthConfig,
  type AuthSecretsSource,
  type ResolvedAuthSecrets,
} from './config.js';
export * from './better-auth/database-adapter.js';
export {
  AuthenticationProvider,
  createCookiePrefix,
  resolvePublicPath,
  toPublicRequest,
  type AuthenticationProviderConfig,
} from './providers/authentication.js';
export * from './tokens.js';
export * from './user-administration.js';

export type { AuthConfig, AuthEmailConfig } from './config.js';
export type { PasswordResetDiagnosis } from './password-reset.js';
export * from './sign-in-methods.js';
export type {
  AuthenticationSettings,
  AuthenticationSettingsIssue,
  AuthenticationSignInMethod,
  PasswordResetSenderDescription,
  SettingValue,
} from './settings.js';
export {
  authenticationSettingsServiceToken,
  type AuthenticationProviderSummary,
  type AuthenticationSettingsService,
} from './settings-service.js';
