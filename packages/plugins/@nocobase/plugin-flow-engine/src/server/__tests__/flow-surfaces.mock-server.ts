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
import { FLOW_SURFACES_MINIMAL_TEST_PLUGINS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

type FlowSurfacesMockServerOptions = MockServerOptions & {
  enabledPluginAliases?: readonly string[];
};

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

  const login = async () => app.agent().login(rootUser);
  let currentAgent = await login();

  return new Proxy(currentAgent, {
    get(target, prop, receiver) {
      if (prop !== 'resource') {
        return Reflect.get(target, prop, receiver);
      }

      return (resourceName: string, ...resourceArgs: any[]) =>
        new Proxy(
          {},
          {
            get(_resourceTarget, action) {
              return async (...callArgs: any[]) => {
                let lastError: any;
                for (let attempt = 0; attempt < 2; attempt += 1) {
                  if (attempt > 0) {
                    currentAgent = await login();
                  }
                  try {
                    const resource = currentAgent.resource(resourceName, ...resourceArgs);
                    const method = resource?.[action as keyof typeof resource];
                    if (typeof method !== 'function') {
                      return method;
                    }
                    return await method.apply(resource, callArgs);
                  } catch (error: any) {
                    lastError = error;
                    if (!isRetriableAgentError(error) || attempt > 0) {
                      throw error;
                    }
                  }
                }
                throw lastError;
              };
            },
          },
        );
    },
  });
}

function isRetriableAgentError(error: any) {
  const message = String(error?.message || '');
  return error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT' || /socket hang up|timed out/i.test(message);
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
