export {
  AUTHORIZATION_ERROR_DOMAIN,
  AuthorizationInputError,
  assertRuleKeyAvailable,
  createRouteHandler,
  createSettingsRouter,
  requireSettings,
  rethrowRuleConflict,
  ruleAlreadyExists,
  settingsAccess,
  toAuthorizationApiError,
  type AuthorizationErrorTranslator,
  type SettingsRouterEnv,
} from './http.js';
export { parse } from './parsing.js';
export {
  createRuleSupportRoutes,
  type RuleSupportRoutesOptions,
} from './options.js';
export {
  DataScopeRuleBody,
  DataScopeRulePatchBody,
  RecordSelectionInput,
  ReferenceInput,
  RESERVED_RULE_KEYS,
  RuleActionInput,
  RuleKeyInput,
  RuleParams,
  SubjectRuleBody,
  SubjectRulePatchBody,
  SubjectsInput,
  TitleInput,
} from './schemas.js';
export {
  validateDataScopeRule,
  type DataScopeRuleInput,
} from './rule-validation.js';
export {
  DatabaseConnectionHandle,
  type DatabaseConnectionSource,
} from '../stores/connection.js';
export { describeCollection } from '../database/collections.js';
export type { AuthorizationExtensionHost } from '../host.js';
