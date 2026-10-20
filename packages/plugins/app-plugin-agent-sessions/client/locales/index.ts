import type { LocaleLoaders } from '@nocobase/i18n';

// One dynamic import per locale, so an application downloads only the language it is showing.
const locales: LocaleLoaders = {
  'en-US': () => import('./en-US.js'),
  'zh-CN': () => import('./zh-CN.js'),
};

export default locales;
