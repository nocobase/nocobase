export { resolveLocalesContribution } from './contribution.js';
export {
  describeLocale,
  getLocaleDirection,
  getLocaleLabel,
  parseAcceptLanguage,
  resolveSupportedLocale,
} from './locales.js';
export {
  APP_NS,
  BASE_LOCALE,
  BASE_NAMESPACE,
  I18nRegistry,
  type LoadLocaleResult,
  type LoadedNamespaceResource,
} from './registry.js';
export {
  I18nRuntime,
  type I18nRuntimeOptions,
  type I18nTranslateOptions,
  type Translator,
} from './runtime.js';
export type {
  FlattenKeys,
  LocaleResource,
  PartialLocaleResource,
  TranslationKey,
} from './keys.js';
export type {
  Locale,
  LocaleDefinition,
  LocaleDirection,
  LocaleLoader,
  LocaleLoaders,
  LocaleModule,
  LocaleModuleExport,
  LocalesContribution,
  LocalesModule,
  Namespace,
  TranslationOverrides,
  TranslationResource,
} from './types.js';
