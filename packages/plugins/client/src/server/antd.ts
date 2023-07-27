import { requireModule } from '@nocobase/utils';

export const getAntdLocale = (lang) => {
  const lng = lang.replace('-', '_');
  const files = [`antd/lib/locale/${lng}`, `../locale/antd/${lng}`];
  for (const file of files) {
    try {
      require.resolve(file);
      return requireModule(file);
    } catch (error) {
      continue;
    }
  }
  return requireModule(`antd/lib/locale/en_US`);
};
