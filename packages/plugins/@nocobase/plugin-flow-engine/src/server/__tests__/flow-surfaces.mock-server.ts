/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginManager } from '@nocobase/server';
import { mockServer, MockServer, type MockServerOptions } from '@nocobase/test';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import mariadb from 'mariadb';
import mysql from 'mysql2/promise';
import pg from 'pg';
import qs from 'qs';
import { FLOW_SURFACES_TEST_PLUGINS, FLOW_SURFACES_TEST_PLUGIN_INSTALLS } from './flow-surfaces.test-plugins';

type FlowSurfacesMockServerOptions = MockServerOptions & {
  enabledPluginAliases?: readonly string[];
  knownPluginAliases?: readonly string[];
};

type FlowSurfacesDatabaseIsolation = {
  database?: MockServerOptions['database'];
  shouldCleanDbOnDestroy?: boolean;
  cleanup?: () => Promise<void>;
  selfManagedDatabase?: boolean;
};

const FLOW_SURFACES_READ_COMPATIBLE_AGENT = Symbol('flow-surfaces-read-compatible-agent');
const FLOW_SURFACES_FIXTURE_TABLE_SCOPE = Symbol('flow-surfaces-fixture-table-scope');
const FLOW_SURFACES_TEST_APP_KEY = 'flow-surfaces-test-app-key-0123456789abcdef';
const FLOW_SURFACES_TEST_AES_SECRET_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const FLOW_SURFACES_FIXTURE_TABLE_NAME_LIMIT = 63;

let flowSurfacesFixtureTableScopeSequence = 0;

export type FlowSurfacesFixtureCollectionApp = {
  db: {
    inDialect?: (dialect: string) => boolean;
    options?: Record<string, unknown>;
  };
};

type FlowSurfacesFixtureScopedApp = FlowSurfacesFixtureCollectionApp & {
  [FLOW_SURFACES_FIXTURE_TABLE_SCOPE]?: string;
};

function ensureFlowSurfacesBootstrapSecrets() {
  // Flow-surfaces server tests bootstrap many mock apps in parallel. If they all
  // fall back to storage/apps/main/*.dat, CI workers can race on partially
  // written secret files and fail during app initialization.
  process.env.UNSAFE_USE_DEFAULT_JWT_SECRET = 'true';
  if (!process.env.APP_KEY || process.env.APP_KEY === 'test-key' || process.env.APP_KEY === 'your-secret-key') {
    process.env.APP_KEY = FLOW_SURFACES_TEST_APP_KEY;
  }
  if (!process.env.APP_AES_SECRET_KEY) {
    process.env.APP_AES_SECRET_KEY = FLOW_SURFACES_TEST_AES_SECRET_KEY;
  }
}

export async function createFlowSurfacesMockServer(options: FlowSurfacesMockServerOptions = {}) {
  ensureFlowSurfacesBootstrapSecrets();
  const pluginAliasesFromOptions =
    Array.isArray(options.plugins) && options.plugins.every((plugin) => typeof plugin === 'string')
      ? (options.plugins as string[])
      : undefined;
  const {
    enabledPluginAliases = pluginAliasesFromOptions || FLOW_SURFACES_TEST_PLUGINS,
    knownPluginAliases = enabledPluginAliases,
    plugins = FLOW_SURFACES_TEST_PLUGIN_INSTALLS,
    skipInstall = false,
    skipStart = false,
    version,
    beforeInstall,
    database,
    ...restOptions
  } = options;

  let lastError: any;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const isolation = await createFlowSurfacesDatabaseIsolation(database, attempt);
    const app = createFlowSurfacesIsolatedMockServer(isolation, {
      skipSupervisor: true,
      registerActions: true,
      acl: true,
      plugins,
      database: isolation.database,
      ...restOptions,
    });
    if (isolation.shouldCleanDbOnDestroy || isolation.cleanup) {
      const originalDestroy = app.destroy.bind(app);
      app.destroy = async (destroyOptions: any = {}) => {
        try {
          await app.cleanDb();
        } catch (error) {
          // ignore teardown cleanup errors and continue destroying the app instance
        }
        try {
          await originalDestroy(destroyOptions);
        } finally {
          await isolation.cleanup?.().catch(() => undefined);
        }
      };
    }
    try {
      if (!skipInstall) {
        await app.cleanDb();
        await beforeInstall?.(app);
        await app.runCommandThrowError('install', '-f');
      }

      if (version) {
        await app.version.update(version);
      }

      if (!skipInstall) {
        await syncFlowSurfacesEnabledPlugins(app, enabledPluginAliases, knownPluginAliases);
      }

      if (!skipStart) {
        await app.runCommandThrowError('start');
      }

      return app;
    } catch (error: any) {
      lastError = error;
      await app.destroy().catch(() => undefined);
      if (!isRetriableFlowSurfacesBootstrapError(error) || attempt > 1) {
        throw error;
      }
      await waitForFlowSurfacesRetry(120);
    }
  }

  throw lastError;
}

export async function loginFlowSurfacesRootAgent(app: MockServer) {
  const rootUser = await findFlowSurfacesRootUser(app);

  const login = async () => wrapFlowSurfacesReadCompatibleAgent(await app.agent().login(rootUser), app);
  let currentAgent = await login();

  const callWithRetry = async <T>(
    execute: (agent: any) => Promise<T>,
    options: {
      resourceName?: string;
      action?: string;
    } = {},
  ) => {
    let lastError: any;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) {
        await waitForFlowSurfacesRetry();
        currentAgent = await login();
      }
      try {
        const result = await execute(currentAgent);
        if (isRetriableAgentResponse(result, options) && attempt === 0) {
          continue;
        }
        return result;
      } catch (error: any) {
        lastError = error;
        if (!isRetriableAgentError(error) || attempt > 0) {
          throw error;
        }
        await waitForFlowSurfacesRetry();
      }
    }
    throw lastError;
  };

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'resource') {
          return (resourceName: string, ...resourceArgs: any[]) =>
            new Proxy(
              {},
              {
                get(_resourceTarget, action) {
                  return async (...callArgs: any[]) =>
                    callWithRetry(
                      async (agent) => {
                        const resource = agent.resource(resourceName, ...resourceArgs);
                        const method = resource?.[action as keyof typeof resource];
                        if (typeof method !== 'function') {
                          return method;
                        }
                        return await method.apply(resource, callArgs);
                      },
                      {
                        resourceName,
                        action: String(action),
                      },
                    );
                },
              },
            );
        }

        const value = currentAgent?.[prop as keyof typeof currentAgent];
        if (typeof value !== 'function') {
          return value;
        }
        return (...callArgs: any[]) => {
          const method = currentAgent?.[prop as keyof typeof currentAgent];
          return method.apply(currentAgent, callArgs);
        };
      },
    },
  );
}

function isRetriableAgentError(error: any) {
  const message = String(error?.message || '');
  return (
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'HPE_INVALID_CONSTANT' ||
    /socket hang up|timed out|parse error|expected http\/, rtsp\/ or ice\//i.test(message)
  );
}

function isRetriableAgentResponse(
  response: any,
  options: {
    resourceName?: string;
    action?: string;
  } = {},
) {
  if (response?.status === 401) {
    return true;
  }

  if (response?.status !== 404) {
    return false;
  }

  return (
    options.resourceName === 'flowSurfaces' ||
    (options.resourceName === 'collections.fields' && options.action === 'create')
  );
}

function isRetriableRootUserError(error: any) {
  const message = String(error?.message || '');
  const code = error?.code || error?.parent?.code || error?.original?.code;
  return (
    isRetriableAgentError(error) ||
    code === '42P01' ||
    code === 'ER_NO_SUCH_TABLE' ||
    /relation .+ does not exist|table .+ doesn't exist/i.test(message)
  );
}

function isRetriableFlowSurfacesBootstrapError(error: any) {
  const message = String(error?.message || '');
  const code = error?.code || error?.parent?.code || error?.original?.code;
  const constraint = String(error?.constraint || error?.parent?.constraint || error?.original?.constraint || '');
  const sql = String(error?.sql || error?.parent?.sql || error?.original?.sql || '');
  return (
    code === '42P01' ||
    code === '23505' ||
    code === 'XX000' ||
    code === 'ER_NO_SUCH_TABLE' ||
    /relation .+ does not exist|table .+ doesn't exist|could not open relation with OID/i.test(message) ||
    (constraint === 'pg_type_typname_nsp_index' && /migrations/i.test(sql))
  );
}

async function createFlowSurfacesDatabaseIsolation(
  database: MockServerOptions['database'] | undefined,
  attempt: number,
): Promise<FlowSurfacesDatabaseIsolation> {
  const dialect = getFlowSurfacesDatabaseDialect(database);
  if (shouldUseFlowSurfacesIsolatedSchema(database, dialect)) {
    const schema = buildFlowSurfacesSchemaName(attempt);
    return {
      database: {
        ...(database || {}),
        schema,
      },
      shouldCleanDbOnDestroy: true,
      selfManagedDatabase: true,
      cleanup: () => dropFlowSurfacesPostgresSchema(database, schema),
    };
  }

  if (shouldUseFlowSurfacesIsolatedSqliteDatabase(database, dialect)) {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'nocobase-flow-surfaces-'));
    return {
      database: {
        ...(database || {}),
        dialect,
        storage: path.join(root, 'db.sqlite'),
      },
      shouldCleanDbOnDestroy: true,
      selfManagedDatabase: true,
      cleanup: () => fs.promises.rm(root, { recursive: true, force: true }),
    };
  }

  if (!shouldUseFlowSurfacesIsolatedMySqlDatabase(dialect)) {
    return { database };
  }

  const databaseName = buildFlowSurfacesMySqlDatabaseName(attempt);
  await createFlowSurfacesMySqlDatabase(database, databaseName, dialect);

  return {
    database: {
      ...(database || {}),
      database: databaseName,
      dialect,
      username: getFlowSurfacesMySqlAdminUser(),
      password: getFlowSurfacesMySqlAdminPassword(database),
    },
    shouldCleanDbOnDestroy: true,
    selfManagedDatabase: true,
    cleanup: () => dropFlowSurfacesMySqlDatabase(database, databaseName, dialect),
  };
}

function getFlowSurfacesDatabaseDialect(database: MockServerOptions['database'] | undefined) {
  return String(database?.dialect || process.env.DB_DIALECT || '').toLowerCase();
}

function shouldUseFlowSurfacesIsolatedSchema(database: MockServerOptions['database'] | undefined, dialect: string) {
  return dialect === 'postgres' && !database?.schema;
}

function shouldUseFlowSurfacesIsolatedSqliteDatabase(
  database: MockServerOptions['database'] | undefined,
  dialect: string,
) {
  return dialect === 'sqlite' && !database?.storage;
}

function shouldUseFlowSurfacesIsolatedMySqlDatabase(dialect: string) {
  return dialect === 'mysql' || dialect === 'mariadb';
}

function buildFlowSurfacesSchemaName(attempt: number) {
  const nonce = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `fs_${process.pid}_${attempt}_${nonce}`.replace(/[^a-z0-9_]/gi, '_').slice(0, 63);
}

function buildFlowSurfacesMySqlDatabaseName(attempt: number) {
  return buildFlowSurfacesSchemaName(attempt).slice(0, 64);
}

function createFlowSurfacesIsolatedMockServer(isolation: FlowSurfacesDatabaseIsolation, options: MockServerOptions) {
  if (!isolation.selfManagedDatabase) {
    return mockServer(options);
  }

  // Flow-surfaces tests own their isolated schema/database. The shared CI DB
  // distributor owns DB_TEST_PREFIX databases and removes them after 3 minutes,
  // so do not let mockDatabase acquire these databases.
  return withoutFlowSurfacesTestDatabaseDistributor(() => mockServer(options));
}

function withoutFlowSurfacesTestDatabaseDistributor<T>(fn: () => T): T {
  const originalPrefix = process.env.DB_TEST_PREFIX;
  const originalDistributorPort = process.env.DB_TEST_DISTRIBUTOR_PORT;
  delete process.env.DB_TEST_PREFIX;
  delete process.env.DB_TEST_DISTRIBUTOR_PORT;

  try {
    return fn();
  } finally {
    restoreFlowSurfacesEnv('DB_TEST_PREFIX', originalPrefix);
    restoreFlowSurfacesEnv('DB_TEST_DISTRIBUTOR_PORT', originalDistributorPort);
  }
}

function restoreFlowSurfacesEnv(key: 'DB_TEST_PREFIX' | 'DB_TEST_DISTRIBUTOR_PORT', value: string | undefined) {
  if (typeof value === 'undefined') {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

async function createFlowSurfacesMySqlDatabase(
  database: MockServerOptions['database'] | undefined,
  databaseName: string,
  dialect: string,
) {
  try {
    await withFlowSurfacesMySqlConnection(database, dialect, async (connection) => {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${assertFlowSurfacesMySqlIdentifier(databaseName)}\``);
    });
  } catch (error: any) {
    throw new Error(
      `Failed to create isolated ${dialect} database '${databaseName}' for flow-surfaces tests. ` +
        `Ensure the test MySQL user can create and access isolated databases. ${error?.message || error}`,
    );
  }
}

async function dropFlowSurfacesMySqlDatabase(
  database: MockServerOptions['database'] | undefined,
  databaseName: string,
  dialect: string,
) {
  await withFlowSurfacesMySqlConnection(database, dialect, async (connection) => {
    await connection.query(`DROP DATABASE IF EXISTS \`${assertFlowSurfacesMySqlIdentifier(databaseName)}\``);
  });
}

async function dropFlowSurfacesPostgresSchema(database: MockServerOptions['database'] | undefined, schema: string) {
  const client = new pg.Client({
    host: String(database?.host || process.env.DB_HOST || '127.0.0.1'),
    port: Number(database?.port || process.env.DB_PORT || 5432),
    user: String(database?.username || process.env.DB_USER || process.env.DB_USERNAME || 'postgres'),
    password: String(database?.password || process.env.DB_PASSWORD || ''),
    database: String(database?.database || process.env.DB_DATABASE || 'postgres'),
  });

  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${assertFlowSurfacesPostgresIdentifier(schema)}" CASCADE`);
  } finally {
    await client.end();
  }
}

async function withFlowSurfacesMySqlConnection(
  database: MockServerOptions['database'] | undefined,
  dialect: string,
  fn: (connection: any) => Promise<void>,
) {
  const connectionOptions = {
    host: String(database?.host || process.env.DB_HOST || '127.0.0.1'),
    port: Number(database?.port || process.env.DB_PORT || 3306),
    user: getFlowSurfacesMySqlAdminUser(),
    password: getFlowSurfacesMySqlAdminPassword(database),
  };
  const connection =
    dialect === 'mariadb'
      ? await mariadb.createConnection(connectionOptions)
      : await mysql.createConnection(connectionOptions);

  try {
    await fn(connection);
  } finally {
    await (connection.end?.() ?? connection.close?.());
  }
}

function getFlowSurfacesMySqlAdminUser() {
  return 'root';
}

function getFlowSurfacesMySqlAdminPassword(database: MockServerOptions['database'] | undefined) {
  return String(database?.password || process.env.DB_PASSWORD || '');
}

function assertFlowSurfacesMySqlIdentifier(identifier: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
    throw new Error(`Invalid isolated MySQL database identifier: ${identifier}`);
  }
  return identifier;
}

function assertFlowSurfacesPostgresIdentifier(identifier: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
    throw new Error(`Invalid isolated Postgres schema identifier: ${identifier}`);
  }
  return identifier;
}

async function findFlowSurfacesRootUser(app: MockServer) {
  let lastError: any;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const rootUser = await app.db.getRepository('users').findOne({
        filter: {
          'roles.name': 'root',
        },
      });
      if (rootUser) {
        return rootUser;
      }
      lastError = new Error('root user not found');
    } catch (error: any) {
      lastError = error;
      if (!isRetriableRootUserError(error) || attempt > 1) {
        throw error;
      }
    }
    await waitForFlowSurfacesRetry();
  }
  throw lastError;
}

function waitForFlowSurfacesRetry(delayMs = 80) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export function wrapFlowSurfacesReadCompatibleAgent<T extends Record<string, any>>(agent: T, app: MockServer): T {
  if (!agent || agent[FLOW_SURFACES_READ_COMPATIBLE_AGENT as keyof T]) {
    return agent;
  }

  const prefix = app.resourcer.options.prefix || '';

  const wrapped = new Proxy(agent, {
    get(target, prop, receiver) {
      if (prop === FLOW_SURFACES_READ_COMPATIBLE_AGENT) {
        return true;
      }

      if (prop === 'resource') {
        return (name: string, resourceOf?: any) => {
          const resource = target.resource(name, resourceOf);
          if (name === 'collections') {
            return wrapFlowSurfacesCollectionsResource(resource, app);
          }
          if (name !== 'flowSurfaces') {
            return resource;
          }
          return new Proxy(resource, {
            get(resourceTarget, action, resourceReceiver) {
              if (!['get', 'list'].includes(String(action))) {
                return Reflect.get(resourceTarget, action, resourceReceiver);
              }
              return (params: Record<string, any> = {}) => {
                let { filterByTk } = params;
                const { file: _file, values, ...restParams } = params;
                if (params.associatedIndex) {
                  resourceOf = params.associatedIndex;
                }
                if (params.resourceIndex) {
                  filterByTk = params.resourceIndex;
                }

                const queryParams: Record<string, any> = {
                  ...restParams,
                };

                if (Object.prototype.hasOwnProperty.call(params, 'values')) {
                  queryParams.values = isEmptyPlainObject(values) ? '' : values;
                }

                if (queryParams.filter) {
                  queryParams.filter = JSON.stringify(queryParams.filter);
                }

                let url = `${prefix}/${name}:${String(action)}`;
                if (filterByTk) {
                  url += `/${filterByTk}`;
                }
                const queryString = qs.stringify(queryParams, { arrayFormat: 'brackets' });
                return target.get(`${url}?${queryString}`);
              };
            },
          });
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  });

  return wrapped as T;
}

function wrapFlowSurfacesCollectionsResource(resource: Record<PropertyKey, unknown>, app: MockServer) {
  return new Proxy(resource, {
    get(resourceTarget, action, resourceReceiver) {
      const value = Reflect.get(resourceTarget, action, resourceReceiver);
      if (!['create', 'apply'].includes(String(action)) || typeof value !== 'function') {
        return value;
      }

      return (...callArgs: unknown[]) =>
        value.apply(resourceTarget, withFlowSurfacesFixtureCollectionTableName(app, callArgs));
    },
  });
}

function withFlowSurfacesFixtureCollectionTableName(app: MockServer, callArgs: unknown[]) {
  const [params, ...restArgs] = callArgs;
  if (!isPlainRecord(params) || !isPlainRecord(params.values)) {
    return callArgs;
  }

  const values = prepareFlowSurfacesFixtureCollectionValues(app, params.values);
  if (values === params.values) {
    return callArgs;
  }

  return [
    {
      ...params,
      values,
    },
    ...restArgs,
  ];
}

export function prepareFlowSurfacesFixtureCollectionValues(
  app: FlowSurfacesFixtureCollectionApp,
  values: Record<string, unknown>,
) {
  const fixtureValues = {
    ...values,
  };
  let changed = false;

  if (
    !fixtureValues.tableName &&
    !fixtureValues.view &&
    !fixtureValues.viewName &&
    typeof fixtureValues.name === 'string' &&
    fixtureValues.name.trim()
  ) {
    fixtureValues.tableName = buildFlowSurfacesFixtureCollectionTableName(app, fixtureValues.name);
    changed = true;
  }

  const schema = getFlowSurfacesFixtureCollectionSchema(app);
  if (schema && !fixtureValues.schema) {
    fixtureValues.schema = schema;
    changed = true;
  }

  return changed ? fixtureValues : values;
}

function getFlowSurfacesFixtureCollectionSchema(app: FlowSurfacesFixtureCollectionApp) {
  if (!app.db.inDialect?.('postgres')) {
    return undefined;
  }

  const schema = app.db.options?.schema;
  return typeof schema === 'string' && schema.trim() ? schema.trim() : undefined;
}

function buildFlowSurfacesFixtureCollectionTableName(app: FlowSurfacesFixtureCollectionApp, collectionName: string) {
  const scope = getFlowSurfacesFixtureTableScope(app);
  const normalizedCollectionName = normalizeFlowSurfacesFixtureIdentifierPart(collectionName, 'collection');
  const prefix = `${scope}_`;
  const maxCollectionNameLength = FLOW_SURFACES_FIXTURE_TABLE_NAME_LIMIT - prefix.length;

  if (normalizedCollectionName.length <= maxCollectionNameLength) {
    return `${prefix}${normalizedCollectionName}`;
  }

  const suffix = shortFlowSurfacesHash(normalizedCollectionName);
  const truncatedCollectionName = normalizedCollectionName.slice(
    0,
    Math.max(1, maxCollectionNameLength - suffix.length - 1),
  );
  return `${prefix}${truncatedCollectionName}_${suffix}`;
}

function getFlowSurfacesFixtureTableScope(app: FlowSurfacesFixtureCollectionApp) {
  const scopedApp = app as FlowSurfacesFixtureScopedApp;
  if (!scopedApp[FLOW_SURFACES_FIXTURE_TABLE_SCOPE]) {
    flowSurfacesFixtureTableScopeSequence += 1;
    const options = app.db.options || {};
    const identity = [
      process.pid,
      flowSurfacesFixtureTableScopeSequence,
      options.schema,
      options.database,
      options.storage,
      randomBytes(4).toString('hex'),
    ]
      .filter(Boolean)
      .join('_');
    scopedApp[FLOW_SURFACES_FIXTURE_TABLE_SCOPE] = `fs_${shortFlowSurfacesHash(identity)}`;
  }
  return scopedApp[FLOW_SURFACES_FIXTURE_TABLE_SCOPE];
}

function normalizeFlowSurfacesFixtureIdentifierPart(value: unknown, fallback: string) {
  const normalized = String(value || '')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  const resolved = normalized || fallback;
  return /^[a-z]/.test(resolved) ? resolved : `t_${resolved}`;
}

function shortFlowSurfacesHash(value: string) {
  return createHash('sha1').update(value).digest('hex').slice(0, 10);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isEmptyPlainObject(value: any) {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0;
}

export async function syncFlowSurfacesEnabledPlugins(
  app: MockServer,
  enabledPluginAliases: readonly string[],
  knownPluginAliases: readonly string[] = FLOW_SURFACES_TEST_PLUGINS,
) {
  const repository = app.db.getRepository('applicationPlugins');
  const existing = await repository.find({
    fields: ['id', 'packageName', 'enabled'],
  });

  const existingByPackageName = new Map(
    existing
      .map((record: any) => ({
        id: record?.get?.('id') ?? record?.id,
        packageName: record?.get?.('packageName') || record?.packageName,
        enabled: record?.get?.('enabled') ?? record?.enabled,
      }))
      .filter((record: any) => typeof record.packageName === 'string' && record.packageName.trim())
      .map((record: any) => [record.packageName, record]),
  );

  const desiredPackageNames = new Set(
    await Promise.all(
      enabledPluginAliases.map(
        async (pluginAlias) => (await resolveFlowSurfacesPluginIdentity(app, pluginAlias)).packageName,
      ),
    ),
  );

  for (const pluginAlias of knownPluginAliases) {
    const { name, packageName } = await resolveFlowSurfacesPluginIdentity(app, pluginAlias);
    const existingRecord = existingByPackageName.get(packageName);
    const shouldEnable = desiredPackageNames.has(packageName);

    if (!existingRecord && !shouldEnable) {
      continue;
    }

    if (!existingRecord) {
      await repository.create({
        values: {
          name,
          packageName,
          enabled: true,
          installed: true,
        },
      });
      continue;
    }

    if (Boolean(existingRecord.enabled) === shouldEnable) {
      continue;
    }

    await repository.update({
      filterByTk: existingRecord.id,
      values: {
        enabled: shouldEnable,
      },
    });
  }
}

async function resolveFlowSurfacesPluginIdentity(app: MockServer, pluginAlias: string) {
  const plugin = app.pm.get(pluginAlias);
  const name = plugin?.options?.name;
  const packageName = plugin?.options?.packageName;

  if (typeof name === 'string' && name.trim() && typeof packageName === 'string' && packageName.trim()) {
    return {
      name: name.trim(),
      packageName: packageName.trim(),
    };
  }

  return await PluginManager.parseName(pluginAlias);
}
