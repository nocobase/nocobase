/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer, type MockServerOptions } from '@nocobase/test';
import { FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

export async function createFlowSurfacesMockServer(options: MockServerOptions = {}) {
  return createMockServer({
    registerActions: true,
    acl: true,
    plugins: [...FLOW_SURFACES_TEST_PLUGINS],
    beforeInstall: async (app) => {
      await app.cleanDb();
    },
    ...options,
  });
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
