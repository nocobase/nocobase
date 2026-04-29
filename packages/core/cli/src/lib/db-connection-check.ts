/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { translateCli } from './cli-locale.ts';
import type { PromptCatalogValues } from './prompt-catalog.ts';
import { validateTcpPort } from './prompt-validators.ts';

type SupportedExternalDbDialect = 'postgres' | 'kingbase' | 'mysql' | 'mariadb';

type ExternalDbConnectionConfig = {
  dialect: SupportedExternalDbDialect;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

const DB_CONNECTION_TIMEOUT_MS = 5_000;
const externalDbValidationCache = new Map<string, Promise<string | undefined>>();

function trimPromptValue(value: unknown): string {
  return String(value ?? '').trim();
}

export function readExternalDbConnectionConfig(values: PromptCatalogValues): ExternalDbConnectionConfig | undefined {
  const builtinDb = values.builtinDb === undefined ? true : Boolean(values.builtinDb);
  if (builtinDb) {
    return undefined;
  }

  const dialect = trimPromptValue(values.dbDialect || 'postgres');
  if (dialect !== 'postgres' && dialect !== 'kingbase' && dialect !== 'mysql' && dialect !== 'mariadb') {
    return undefined;
  }

  const host = trimPromptValue(values.dbHost);
  const portText = trimPromptValue(values.dbPort);
  const database = trimPromptValue(values.dbDatabase);
  const user = trimPromptValue(values.dbUser);
  const password = String(values.dbPassword ?? '');

  if (!host || !portText || !database || !user || !password) {
    return undefined;
  }

  if (validateTcpPort(portText)) {
    return undefined;
  }

  return {
    dialect,
    host,
    port: Number.parseInt(portText, 10),
    database,
    user,
    password,
  };
}

export function formatDbCheckAddress(config: Pick<ExternalDbConnectionConfig, 'host' | 'port' | 'database'>): string {
  return `${config.host}:${config.port}/${config.database}`;
}

function buildValidationCacheKey(config: ExternalDbConnectionConfig): string {
  return JSON.stringify(config);
}

function formatDbConnectionError(config: ExternalDbConnectionConfig, error: unknown): string {
  const maybeError = error as {
    code?: string;
    errno?: number;
    message?: string;
    sqlMessage?: string;
  };
  const code = String(maybeError?.code ?? '').trim().toUpperCase();
  const errno = typeof maybeError?.errno === 'number' ? maybeError.errno : undefined;
  const rawMessage = String(maybeError?.message || maybeError?.sqlMessage || error || '').trim();

  if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'EHOSTUNREACH' || code === 'ECONNRESET') {
    return translateCli('validators.dbConnection.unreachable', {
      host: config.host,
      port: config.port,
      details: rawMessage,
    });
  }

  if (code === 'ETIMEDOUT') {
    return translateCli('validators.dbConnection.timeout', {
      host: config.host,
      port: config.port,
      seconds: Math.ceil(DB_CONNECTION_TIMEOUT_MS / 1000),
    });
  }

  if (code === '28P01' || code === '28000' || code === 'ER_ACCESS_DENIED_ERROR' || errno === 1045) {
    return translateCli('validators.dbConnection.authenticationFailed', {
      user: config.user,
      database: config.database,
    });
  }

  if (code === '3D000' || code === 'ER_BAD_DB_ERROR' || errno === 1049) {
    return translateCli('validators.dbConnection.databaseNotFound', {
      database: config.database,
    });
  }

  return translateCli('validators.dbConnection.connectionFailed', {
    details: rawMessage || code || String(error),
  });
}

async function checkPostgresFamilyConnection(config: ExternalDbConnectionConfig): Promise<void> {
  const { default: pg } = await import('pg');
  const client = new pg.Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionTimeoutMillis: DB_CONNECTION_TIMEOUT_MS,
  });

  try {
    await client.connect();
    await client.query('SELECT 1');
  } finally {
    await Promise.resolve(client.end()).catch(() => undefined);
  }
}

async function checkMysqlConnection(config: ExternalDbConnectionConfig): Promise<void> {
  const { default: mysql } = await import('mysql2/promise');
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectTimeout: DB_CONNECTION_TIMEOUT_MS,
  });

  try {
    await connection.query('SELECT 1');
  } finally {
    await Promise.resolve(connection.end()).catch(() => undefined);
  }
}

async function checkMariaDbConnection(config: ExternalDbConnectionConfig): Promise<void> {
  const { default: mariadb } = await import('mariadb');
  const connection = await mariadb.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectTimeout: DB_CONNECTION_TIMEOUT_MS,
  });

  try {
    await connection.query('SELECT 1');
  } finally {
    await Promise.resolve(connection.end()).catch(() => undefined);
  }
}

async function performExternalDbConnectionCheck(config: ExternalDbConnectionConfig): Promise<string | undefined> {
  try {
    switch (config.dialect) {
      case 'postgres':
      case 'kingbase': {
        await checkPostgresFamilyConnection(config);
        return undefined;
      }
      case 'mysql': {
        await checkMysqlConnection(config);
        return undefined;
      }
      case 'mariadb': {
        await checkMariaDbConnection(config);
        return undefined;
      }
    }
  } catch (error: unknown) {
    return formatDbConnectionError(config, error);
  }
}

export async function checkExternalDbConnection(config: ExternalDbConnectionConfig): Promise<string | undefined> {
  const cacheKey = buildValidationCacheKey(config);
  const cached = externalDbValidationCache.get(cacheKey);
  if (cached) {
    return await cached;
  }

  const pending = performExternalDbConnectionCheck(config);
  externalDbValidationCache.set(cacheKey, pending);
  return await pending;
}

export async function validateExternalDbConfig(values: PromptCatalogValues): Promise<string | undefined> {
  const config = readExternalDbConnectionConfig(values);
  if (!config) {
    return undefined;
  }

  return await checkExternalDbConnection(config);
}

export function clearExternalDbValidationCache(): void {
  externalDbValidationCache.clear();
}
