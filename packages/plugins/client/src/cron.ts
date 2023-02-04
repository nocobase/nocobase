export const getCronLocale = (lang: string) => {
  let packageName = '@nocobase/client';
  let locale = null;
  try {
    const file = `${packageName}/src/locale`;
    require.resolve(file);
    locale = require(file).cron?.[lang];
  } catch (error) {
    try {
      const file = `${packageName}/lib/locale`;
      require.resolve(file);
      locale = require(file).cron?.[lang];
    } catch (error) {}
  }
  return locale || require('react-js-cron/dist/cjs/locale').DEFAULT_LOCALE_EN;
};
