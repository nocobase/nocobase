/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginManager } from '@nocobase/server';
import { createMockServer, MockServer, type MockServerOptions } from '@nocobase/test';
import qs from 'qs';
import { FLOW_SURFACES_MINIMAL_TEST_PLUGINS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

type FlowSurfacesMockServerOptions = MockServerOptions & {
  enabledPluginAliases?: readonly string[];
};

const FLOW_SURFACES_READ_COMPATIBLE_AGENT = Symbol('flow-surfaces-read-compatible-agent');

export async function createFlowSurfacesMockServer(options: FlowSurfacesMockServerOptions = {}) {
  const {
    enabledPluginAliases = Array.isArray(options.plugins) ? options.plugins : FLOW_SURFACES_TEST_PLUGINS,
    plugins = [...FLOW_SURFACES_MINIMAL_TEST_PLUGINS],
    ...restOptions
  } = options;

  const app = await createMockServer({
    registerActions: true,
    acl: true,
    plugins,
    beforeInstall: async (app) => {
      await app.cleanDb();
    },
    ...restOptions,
  });

  await syncFlowSurfacesEnabledPlugins(app, enabledPluginAliases);

  return app;
}

export async function loginFlowSurfacesRootAgent(app: MockServer) {
  const rootUser = await app.db.getRepository('users').findOne({
    filter: {
      'roles.name': 'root',
    },
  });

  const login = async () => wrapFlowSurfacesReadCompatibleAgent(await app.agent().login(rootUser), app);
  let currentAgent = await login();

  const callWithRetry = async <T>(execute: (agent: any) => Promise<T>) => {
    let lastError: any;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) {
        currentAgent = await login();
      }
      try {
        const result = await execute(currentAgent);
        if (isUnauthorizedAgentResponse(result) && attempt === 0) {
          continue;
        }
        return result;
      } catch (error: any) {
        lastError = error;
        if (!isRetriableAgentError(error) || attempt > 0) {
          throw error;
        }
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
                    callWithRetry(async (agent) => {
                      const resource = agent.resource(resourceName, ...resourceArgs);
                      const method = resource?.[action as keyof typeof resource];
                      if (typeof method !== 'function') {
                        return method;
                      }
                      return await method.apply(resource, callArgs);
                    });
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

function isUnauthorizedAgentResponse(response: any) {
  return response?.status === 401;
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
      enabledPluginAliases.map(async (pluginAlias) => {
        const { packageName } = await PluginManager.parseName(pluginAlias);
        return packageName;
      }),
    ),
  );

  for (const pluginAlias of knownPluginAliases) {
    const { name, packageName } = await PluginManager.parseName(pluginAlias);
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
