import { requireModule } from '@nocobase/utils';
import { resolve } from 'path';

export const getCronLocale = (lang: string) => {
  const lng = lang.replace('-', '_');
  const files = [resolve(__dirname, `./../locale/cron/${lng}`)];
  if (process.env.APP_ENV !== 'production') {
    files.push(`@nocobase/client/src/locale/cron/${lng}`, `@nocobase/client/lib/locale/cron/${lng}`);
  }
  for (const file of files) {
    try {
      require.resolve(file);
      return requireModule(file);
    } catch (error) {
      continue;
    }
  }
  return {};
};
