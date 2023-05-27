import { PluginManager } from '@nocobase/server';
import { error } from '@nocobase/utils/client';

const arr2obj = (items: any[]) => {
  const obj = {};
  for (const item of items) {
    Object.assign(obj, item);
  }
  return obj;
};

const getResource = async (packageName: string, lang: string) => {
  const resources = [];
  const prefixes = ['src', 'lib'];
  const localeKeys = ['locale', 'client/locale', 'server/locale'];
  for (const prefix of prefixes) {
    for (const localeKey of localeKeys) {
      try {
        const file = `${packageName}/${prefix}/${localeKey}/${lang}`;
        const resource = await import(file);
        resources.push(resource);
      } catch (err) {
        error(err);
      }
    }
    if (resources.length) {
      break;
    }
  }
  if (resources.length === 0 && lang.replace('-', '_') !== lang) {
    return await getResource(packageName, lang.replace('-', '_'));
  }
  return arr2obj(resources);
};

export const getResourceLocale = async (lang: string, db: any) => {
  const resources = {};
  const res = await getResource('@nocobase/client', lang);
  const defaults = await getResource('@nocobase/client', 'zh-CN');
  for (const key in defaults) {
    if (Object.prototype.hasOwnProperty.call(defaults, key)) {
      defaults[key] = key;
    }
  }
  if (res) {
    resources['client'] = { ...defaults, ...res };
  } else {
    resources['client'] = defaults;
  }
  const plugins = await db.getRepository('applicationPlugins').find({
    filter: {
      'name.$ne': 'client',
    },
  });
  for (const plugin of plugins) {
    const packageName = PluginManager.getPackageName(plugin.get('name'));
    const res = await getResource(packageName, lang);
    const defaults = await getResource(packageName, 'zh-CN');
    for (const key in defaults) {
      if (Object.prototype.hasOwnProperty.call(defaults, key)) {
        defaults[key] = key;
      }
    }
    if (res) {
      resources[plugin.get('name')] = { ...defaults, ...res };
    } else {
      resources['client'] = defaults;
    }
  }
  return resources;
};
