import { requireModule } from '@nocobase/utils';

export const getCronLocale = (lang: string) => {
  const packageName = '@nocobase/client';
  let locale = null;
  try {
    const file = `${packageName}/src/locale/cron/${lang}`;
    require.resolve(file);
    locale = requireModule(file);
  } catch (error) {
    try {
      const file = `${packageName}/lib/locale/cron/${lang}`;
      require.resolve(file);
      locale = requireModule(file);
    } catch (error) {
      // empty
    }
  }
  return locale;
};
