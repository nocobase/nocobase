export {
  I18nProvider,
  NamespaceScope,
  useI18nRuntime,
  useOptionalI18nRuntime,
  useNamespace,
  useTranslation,
  withNamespace,
  type I18nProviderProps,
  type NamespaceScopeProps,
  type UseTranslationOptions,
  type UseTranslationResponse,
} from './context.js';
export {
  applyDocumentLocale,
  useLocale,
  type UseLocaleResult,
} from './locale.js';
export { APP_NS, BASE_NAMESPACE, I18nRuntime } from '../core/index.js';
export type {
  Locale,
  LocaleDefinition,
  LocaleLoaders,
  LocalesModule,
  Namespace,
  TranslationKey,
} from '../core/index.js';
