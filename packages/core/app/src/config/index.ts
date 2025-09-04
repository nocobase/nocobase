/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ApplicationOptions } from '@nocobase/server';
import { cacheManager } from './cache';
import { parseDatabaseOptions } from './database';
import logger from './logger';
import plugins from './plugins';
import resourcer from './resourcer';
import { telemetry } from './telemetry';

export async function getConfig(): Promise<ApplicationOptions> {
  return {
    database: await parseDatabaseOptions(),
    redisConfig: {
      connectionString: process.env.REDIS_URL,
    },
    resourcer,
    plugins,
    cacheManager,
    logger,
    telemetry,
    perfHooks: process.env.ENABLE_PERF_HOOKS ? true : false,
  };
}
