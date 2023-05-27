import { error } from '@nocobase/utils/client';

export const getCronLocale = async (lang: string) => {
  const packageName = '@nocobase/client';
  let locale = null;
  try {
    const file = `${packageName}/src/locale`;
    locale = (await import(file)).cron?.[lang];
  } catch (err) {
    error(err);
    try {
      const file = `${packageName}/lib/locale`;
      locale = (await import(file)).cron?.[lang];
    } catch (err) {
      error(err);
    }
  }
  return locale;
};
