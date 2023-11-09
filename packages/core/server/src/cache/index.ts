import { AppCacheOptions, CacheManager } from '@nocobase/cache';
import Application from '../application';

export const createCacheManager = (app: Application, options: AppCacheOptions) => {
  const cacheManager = new CacheManager();
  app.on('beforeLoad', async () => {
    await cacheManager.init(options);
    const defaultCache = cacheManager.create(app.name);
    app.cache = defaultCache;
    app.context.cache = defaultCache;
  });
  return cacheManager;
};
