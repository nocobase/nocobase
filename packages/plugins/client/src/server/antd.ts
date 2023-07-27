import { requireModule } from '@nocobase/utils';

export const getAntdLocale = (lang) => {
  const lng = lang.replace('-', '_');
  const files = [`antd/lib/locale/${lng}`, `../locale/antd/${lng}`, `antd/lib/locale/en_US`];
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
