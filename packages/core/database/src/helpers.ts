/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { Database, IDatabaseOptions } from './database';
import fs from 'fs';
import { MysqlDialect } from './dialects/mysql-dialect';
import { SqliteDialect } from './dialects/sqlite-dialect';
import { MariadbDialect } from './dialects/mariadb-dialect';
import { PostgresDialect } from './dialects/postgres-dialect';
import { PoolOptions } from 'sequelize';

function getEnvValue(key, defaultValue?) {
  return process.env[key] || defaultValue;
}

function isFilePath(value) {
  return fs.promises
    .stat(value)
    .then((stats) => stats.isFile())
    .catch((err) => {
      if (err.code === 'ENOENT') {
        return false;
      }

      throw err;
    });
}

function getValueOrFileContent(envVarName) {
  const value = getEnvValue(envVarName);

  if (!value) {
    return Promise.resolve(null);
  }

  return isFilePath(value)
    .then((isFile) => {
      if (isFile) {
        return fs.promises.readFile(value, 'utf8');
      }
      return value;
    })
    .catch((error) => {
      console.error(`Failed to read file content for environment variable ${envVarName}.`);
      throw error;
    });
}

function extractSSLOptionsFromEnv() {
  return Promise.all([
    getValueOrFileContent('DB_DIALECT_OPTIONS_SSL_MODE'),
    getValueOrFileContent('DB_DIALECT_OPTIONS_SSL_CA'),
    getValueOrFileContent('DB_DIALECT_OPTIONS_SSL_KEY'),
    getValueOrFileContent('DB_DIALECT_OPTIONS_SSL_CERT'),
    getValueOrFileContent('DB_DIALECT_OPTIONS_SSL_REJECT_UNAUTHORIZED'),
  ]).then(([mode, ca, key, cert, rejectUnauthorized]) => {
    const sslOptions = {};

    if (mode) sslOptions['mode'] = mode;
    if (ca) sslOptions['ca'] = ca;
    if (key) sslOptions['key'] = key;
    if (cert) sslOptions['cert'] = cert;
    if (rejectUnauthorized) sslOptions['rejectUnauthorized'] = rejectUnauthorized === 'true';

    return sslOptions;
  });
}

function getPoolOptions(): PoolOptions {
  const options: PoolOptions = {};
  if (process.env.DB_POOL_MAX) {
    options.max = Number.parseInt(process.env.DB_POOL_MAX, 10);
  }
  if (process.env.DB_POOL_MIN) {
    options.min = Number.parseInt(process.env.DB_POOL_MIN, 10);
  }
  if (process.env.DB_POOL_IDLE) {
    options.idle = Number.parseInt(process.env.DB_POOL_IDLE, 10);
  }
  if (process.env.DB_POOL_ACQUIRE) {
    options.acquire = Number.parseInt(process.env.DB_POOL_ACQUIRE, 10);
  }
  if (process.env.DB_POOL_EVICT) {
    options.evict = Number.parseInt(process.env.DB_POOL_EVICT, 10);
  }
  if (process.env.DB_POOL_MAX_USES) {
    options.maxUses = Number.parseInt(process.env.DB_POOL_MAX_USES, 10) || Number.POSITIVE_INFINITY;
  }
  return options;
}

export async function parseDatabaseOptionsFromEnv(): Promise<IDatabaseOptions> {
  const databaseOptions: IDatabaseOptions = {
    logging: process.env.DB_LOGGING == 'on' ? customLogger : false,
    dialect: process.env.DB_DIALECT as any,
    storage: process.env.DB_STORAGE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT as any,
    timezone: process.env.DB_TIMEZONE,
    tablePrefix: process.env.DB_TABLE_PREFIX,
    schema: process.env.DB_SCHEMA,
    underscored: process.env.DB_UNDERSCORED === 'true',
    pool: getPoolOptions(),
  };

  const sslOptions = await extractSSLOptionsFromEnv();

  if (Object.keys(sslOptions).length) {
    databaseOptions.dialectOptions = databaseOptions.dialectOptions || {};
    databaseOptions.dialectOptions['ssl'] = sslOptions;
  }

  return databaseOptions;
}

function customLogger(queryString, queryObject) {
  console.log(queryString);
  if (queryObject?.bind) {
    console.log(queryObject.bind);
  }
}

export async function checkDatabaseVersion(db: Database) {
  await db.dialect.checkDatabaseVersion(db);
}

export function registerDialects() {
  [SqliteDialect, MysqlDialect, MariadbDialect, PostgresDialect].forEach((dialect) => {
    Database.registerDialect(dialect);
  });
}
