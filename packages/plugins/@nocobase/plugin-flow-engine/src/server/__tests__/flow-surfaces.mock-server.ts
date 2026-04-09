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
import qs from 'qs';
import { FLOW_SURFACES_TEST_PLUGINS, FLOW_SURFACES_TEST_PLUGIN_INSTALLS } from './flow-surfaces.test-plugins';

type FlowSurfacesMockServerOptions = MockServerOptions & {
  enabledPluginAliases?: readonly string[];
  knownPluginAliases?: readonly string[];
};

const FLOW_SURFACES_READ_COMPATIBLE_AGENT = Symbol('flow-surfaces-read-compatible-agent');

export async function createFlowSurfacesMockServer(options: FlowSurfacesMockServerOptions = {}) {
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
    const isolatedDatabaseOptions = createFlowSurfacesIsolatedDatabaseOptions(database, attempt);
    const app = mockServer({
      registerActions: true,
      acl: true,
      plugins,
      database: isolatedDatabaseOptions,
      ...restOptions,
    });
    if (isolatedDatabaseOptions?.schema) {
      const originalDestroy = app.destroy.bind(app);
      app.destroy = async (destroyOptions: any = {}) => {
        try {
          await app.cleanDb();
        } catch (error) {
          // ignore teardown cleanup errors and continue destroying the app instance
        }
        await originalDestroy(destroyOptions);
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

  return options.resourceName === 'flowSurfaces' && response?.status === 404;
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

function createFlowSurfacesIsolatedDatabaseOptions(
  database: MockServerOptions['database'] | undefined,
  attempt: number,
) {
  if (!shouldUseFlowSurfacesIsolatedSchema(database)) {
    return database;
  }

  return {
    ...(database || {}),
    schema: buildFlowSurfacesSchemaName(attempt),
  };
}

function shouldUseFlowSurfacesIsolatedSchema(database: MockServerOptions['database'] | undefined) {
  const dialect = String(database?.dialect || process.env.DB_DIALECT || '').toLowerCase();
  return dialect === 'postgres' && !database?.schema;
}

function buildFlowSurfacesSchemaName(attempt: number) {
  const nonce = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `fs_${process.pid}_${attempt}_${nonce}`.replace(/[^a-z0-9_]/gi, '_').slice(0, 63);
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
