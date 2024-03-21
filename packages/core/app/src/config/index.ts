import { cacheManager } from './cache';
import { parseDatabaseOptions } from './database';
import logger from './logger';
import plugins from './plugins';
import resourcer from './resourcer';
import { telemetry } from './telemetry';

export async function getConfig() {
  return {
    database: await parseDatabaseOptions(),
    resourcer,
    plugins,
    cacheManager,
    logger,
    telemetry,
    perfHooks: process.env.ENABLE_PERF_HOOKS ? true : false,
  };
}
