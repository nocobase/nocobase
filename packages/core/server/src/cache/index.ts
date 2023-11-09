import { AppCacheOptions, CacheManager } from '@nocobase/cache';
import Application from '../application';

export const createCacheManager = (app: Application, options: AppCacheOptions) => {
  const cacheManager = new CacheManager();
  app.on('beforeStart', async () => {
    await cacheManager.init(options);
    const defaultCache = cacheManager.get(options.default || 'memory');
    app.cache = defaultCache;
    app.context.cache = defaultCache;
  });
  return cacheManager;
};
