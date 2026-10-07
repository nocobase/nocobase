export { AppConfig, resolveDefaultAppConfigFile } from './app-config.js';
export {
  envBoolean,
  envInteger,
  envString,
  envStrings,
  isSecretPath,
  type EnvironmentMapping,
  type EnvironmentMetadata,
  type EnvironmentValueGenerator,
} from '@nocobase/config/providers/env';
export {
  buildVariablesManifest,
  isExamplePlaceholder,
  KNOWN_EXAMPLE_PLACEHOLDERS,
  requiredOf,
  type BuildVariablesManifestOptions,
  type VariablesManifest,
  type VariablesManifestEntry,
} from './variables.js';
export {
  defineAppConfig,
  defaultAppConfigs,
  type AppConfigDefinition,
  type AppConfigFactory,
  type AppConfigRules,
  type AppIdentityConfig,
  type ConfigIssueOptions,
  type ConfigValidationContext,
  type ConfigValidator,
} from './define-app-config.js';
export {
  AppConfigInvalidError,
  findAppConfigInvalid,
  formatConfigIssues,
  type ConfigIssue,
} from './validation.js';
export type * from './app-config-types.js';
export * from './context.js';
export * from './not-configured.js';
export * from './placeholder-secret.js';
export * from './paths.js';
export {
  RUNTIME_ENVIRONMENT_VARIABLES,
  type RuntimeEnvironmentVariable,
} from './runtime-environment.js';
export type * from './types.js';
