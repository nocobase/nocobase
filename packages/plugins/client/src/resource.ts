import { PluginManager } from '@nocobase/server';
import isEmpty from 'lodash/isEmpty';

const arr2obj = (items: any[]) => {
  const obj = {};
  for (const item of items) {
    Object.assign(obj, item);
  }
  return obj;
};

const getResource = (packageName: string, lang: string) => {
  let resources = [];
  const prefixes = ['src', 'lib'];
  const localeKeys = ['locale', 'client/locale', 'server/locale'];
  for (const prefix of prefixes) {
    for (const localeKey of localeKeys) {
      try {
        const file = `${packageName}/${prefix}/${localeKey}/${lang}`;
        require.resolve(file);
        const resource = require(file).default;
        resources.push(resource);
      } catch (error) {}
    }
    if (resources.length) {
      break;
    }
  }
  if (resources.length === 0 && lang.replace('-', '_') !== lang) {
    return getResource(packageName, lang.replace('-', '_'));
  }
  return arr2obj(resources);
};

export const getResourceLocale = async (lang: string, db: any) => {
  const resources = {};
  const plugins = await db.getRepository('applicationPlugins').find({
    // filter: {
    //   enabled: true,
    // },
  });
  for (const plugin of plugins) {
    const packageName = PluginManager.getPackageName(plugin.get('name'));
    const res = getResource(packageName, lang);
    resources[plugin.get('name')] = isEmpty(res) ? getResource(packageName, 'en-US') : res;
  }
  const res = getResource('@nocobase/client', lang);
  resources['client'] = isEmpty(res) ? getResource('@nocobase/client', 'en-US') : res;
  return resources;
};
