/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
