import type { LocaleLoaders } from '@nocobase/i18n';

/**
 * app-client's own translations, registered under `APP_CLIENT_NAMESPACE` in every application: the default titles of
 * the built-in settings categories. Other languages fall back to the application's default language.
 */
const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};

export default locales;
