/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Predicate } from './condition-registry';
import type { AppDbCreator, AppDbCreatorOptions } from './types';

async function createMySQLDatabase({
  host,
  port,
  username,
  password,
  database,
  driver,
}: {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  driver: any;
}) {
  const conn = await driver.createConnection({
    host,
    port,
    user: username,
    password,
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await (conn.end?.() ?? conn.close());
}

async function withPgClient(
  options: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  },
  fn: (client: any) => Promise<void>,
) {
  const { Client } = require('pg');
  const client = new Client(options);

  await client.connect();
  try {
    await fn(client);
  } catch (e) {
    console.log(e);
  } finally {
    await client.end();
  }
}

export const createDatabaseCondition: Predicate<AppDbCreatorOptions> = ({ appModel }) =>
  !appModel.options?.dbConnType || appModel.options.dbConnType === 'new_database';

export const createConnectionCondition: Predicate<AppDbCreatorOptions> = ({ appModel }) =>
  appModel.options?.dbConnType === 'new_connection';

export const createSchemaCondition: Predicate<AppDbCreatorOptions> = ({ appModel }) =>
  process.env.USE_DB_SCHEMA_IN_SUBAPP === 'true' || appModel.options.dbConnType === 'new_schema';

export const createDatabase: AppDbCreator = async ({ app }) => {
  const { host, port, username, password, dialect, database } = app.options.database as any;

  if (dialect === 'mysql') {
    const mysql = require('mysql2/promise');
    return createMySQLDatabase({
      host,
      port,
      username,
      password,
      database,
      driver: mysql,
    });
  }

  if (dialect === 'mariadb') {
    const mariadb = require('mariadb');
    return createMySQLDatabase({
      host,
      port,
      username,
      password,
      database,
      driver: mariadb,
    });
  }

  if (['postgres', 'kingbase'].includes(dialect)) {
    return withPgClient({ host, port, user: username, password, database: dialect }, (client) =>
      client.query(`CREATE DATABASE "${database}"`),
    );
  }
};

export const createConnection: AppDbCreator = async ({ app }) => {
  const { host, port, username, password, dialect, database, schema } = app.options.database as any;

  if (dialect === 'mysql') {
    const mysql = require('mysql2/promise');
    return createMySQLDatabase({
      host,
      port,
      username,
      password,
      database,
      driver: mysql,
    });
  }

  if (dialect === 'mariadb') {
    const mariadb = require('mariadb');
    return createMySQLDatabase({
      host,
      port,
      username,
      password,
      database,
      driver: mariadb,
    });
  }

  if (['postgres', 'kingbase'].includes(dialect)) {
    return withPgClient({ host, port, user: username, password, database: dialect }, (client) =>
      schema ? client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`) : client.query(`CREATE DATABASE "${database}"`),
    );
  }
};

export const createSchema: AppDbCreator = async ({ app }) => {
  const { host, port, username, password, dialect, schema } = app.options.database as any;

  if (!['postgres', 'kingbase'].includes(dialect)) {
    throw new Error('Schema is only supported for postgres/kingbase');
  }

  return withPgClient({ host, port, user: username, password, database: dialect }, (client) =>
    client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`),
  );
};
