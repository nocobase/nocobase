import { requireModule } from '@nocobase/utils';

export const getAntdLocale = (lang) => {
  const lng = lang.replace('-', '_');
  try {
    require.resolve(`antd/lib/locale/${lng}`);
    return requireModule(`antd/lib/locale/${lng}`);
  } catch (error) {
    return requireModule(`antd/lib/locale/en_US`);
  }
};
