import {
  defineAppConfig,
  envString,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppI18nConfig } from '@nocobase/app-server/i18n';

const i18n: AppConfigFactory<AppI18nConfig> = defineAppConfig({
  defaults: { defaultLocale: 'en-US' },
  env: {
    APP_DEFAULT_LOCALE: envString('defaultLocale', {
      description: 'The language the application starts in, such as zh-CN.',
    }),
  },
});

export default i18n;
