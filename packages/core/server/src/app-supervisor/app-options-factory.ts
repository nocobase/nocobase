/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, IDatabaseOptions } from '@nocobase/database';
import Application from '../application';
import lodash from 'lodash';
import path from 'path';
import { AppModelOptions } from './types';
import _ from 'lodash';

function getDatabaseConfig(app: Application): IDatabaseOptions {
  let oldConfig =
    app.options.database instanceof Database
      ? (app.options.database as Database).options
      : (app.options.database as IDatabaseOptions);

  if (!oldConfig && app.db) {
    oldConfig = app.db.options;
  }

  return lodash.cloneDeep(lodash.omit(oldConfig, ['migrator']));
}

export const appOptionsFactory = (appName: string, mainApp: Application, options: AppModelOptions) => {
  const rawDatabaseOptions = getDatabaseConfig(mainApp);
  let dbConnType = 'new_database';

  if (rawDatabaseOptions.dialect === 'sqlite') {
    const mainAppStorage = rawDatabaseOptions.storage;
    if (mainAppStorage !== ':memory:') {
      const mainStorageDir = path.dirname(mainAppStorage);
      rawDatabaseOptions.storage = path.join(mainStorageDir, `${appName}.sqlite`);
    }
  } else if (
    process.env.USE_DB_SCHEMA_IN_SUBAPP === 'true' &&
    ['postgres', 'kingbase'].includes(rawDatabaseOptions.dialect)
  ) {
    rawDatabaseOptions.schema = appName;
    dbConnType = 'new_schema';
  } else if (options?.dbConnType !== 'new_schema') {
    rawDatabaseOptions.database = appName;
  }

  const defaultOptions = {
    dbConnType,
    database: {
      ...rawDatabaseOptions,
      tablePrefix: '',
    },
    plugins: ['nocobase'],
    resourcer: {
      prefix: process.env.API_BASE_PATH,
    },
    cacheManager: {
      ...mainApp.options.cacheManager,
      prefix: appName,
    },
    logger: mainApp.options.logger,
  };

  return _.merge({}, defaultOptions, { ...options, name: appName });
};
