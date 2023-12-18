import { cacheManager } from './cache';
import { parseDatabaseOptions } from './database';
import logger from './logger';
import plugins from './plugins';
import resourcer from './resourcer';

export async function getConfig() {
  return {
    database: await parseDatabaseOptions(),
    resourcer,
    plugins,
    cacheManager,
    logger,
    perfHooks: process.env.ENABLE_PERF_HOOKS ? true : false,
  };
}
