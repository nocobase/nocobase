import { AppCacheManagerOptions, newAppCacheManager } from '@nocobase/cache';
import Application from '../application';

export const createCacheManager = async (app: Application, options: AppCacheManagerOptions) => {
  const cacheManager = newAppCacheManager(options);
  const defaultCache = await cacheManager.createCache({ name: app.name });
  app.cache = defaultCache;
  app.context.cache = defaultCache;
  return cacheManager;
};
