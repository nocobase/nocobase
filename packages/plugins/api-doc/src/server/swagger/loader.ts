import { PluginManager } from '@nocobase/server';
import { merge } from '@nocobase/utils';

export const loadSwagger = (packageName: string) => {
  let swaggers = {};
  const prefixes = ['src', 'lib'];
  const targets = ['swagger.ts', 'swagger', 'server/swagger'];
  for (const prefix of prefixes) {
    for (const dict of targets) {
      try {
        const file = `${packageName}/${prefix}/${dict}`;
        require.resolve(file);
        const content = require(file).default;
        swaggers = merge(swaggers, content);
      } catch (error) {
        //
      }
    }
    if (Object.keys(swaggers).length) {
      break;
    }
  }
  return swaggers;
};

export const getPluginsSwagger = async (db: any, pluginNames?: string[]) => {
  const nameFilter = pluginNames ? { name: { $in: pluginNames } } : {};
  const plugins = await db.getRepository('applicationPlugins').find({
    filter: {
      enabled: true,
      ...nameFilter,
    },
  });
  const swaggers = {};
  for (const plugin of plugins) {
    const packageName = PluginManager.getPackageName(plugin.get('name'));
    const res = loadSwagger(packageName);
    if (Object.keys(res).length) {
      swaggers[plugin.get('name')] = res;
    }
  }

  return swaggers;
};

export const mergeObjects = (objs: any[]) => {
  return objs.reduce((cur, obj) => {
    return merge(cur, obj);
  }, {});
};

export const getSwaggerDocument = async (db: any, pluginNames?: string[]) => {
  const swaggers = await getPluginsSwagger(db, pluginNames);
  return mergeObjects(Object.values(swaggers));
};
