import type { LocaleLoaders } from '@nocobase/i18n';

// The languages the application offers. A plugin's locale file supplies translations for the languages listed here;
// it never adds one, so a language belongs in this map before anything can be served in it.
const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};

export default locales;
