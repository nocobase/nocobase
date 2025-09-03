/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mockDatabase } from '@nocobase/database';
import { Application, ApplicationOptions, AppSupervisor, Gateway, PluginManager } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import jwt from 'jsonwebtoken';
import qs from 'qs';
import supertest, { SuperAgentTest } from 'supertest';
import { MemoryPubSubAdapter } from './memory-pub-sub-adapter';
import { MockDataSource } from './mock-data-source';
import path from 'path';
import process from 'node:process';
import { promises as fs } from 'fs';

interface ActionParams {
  filterByTk?: any;
  fields?: string[];
  filter?: any;
  sort?: string[];
  page?: number;
  pageSize?: number;
  values?: any;
  /**
   * @deprecated
   */
  resourceName?: string;
  /**
   * @deprecated
   */
  resourceIndex?: string;
  /**
   * @deprecated
   */
  associatedName?: string;
  /**
   * @deprecated
   */
  associatedIndex?: string;

  [key: string]: any;
}

interface SortActionParams {
  resourceName?: string;
  resourceIndex?: any;
  associatedName?: string;
  associatedIndex?: any;
  sourceId?: any;
  targetId?: any;
  sortField?: string;
  method?: string;
  target?: any;
  sticky?: boolean;

  [key: string]: any;
}

interface Resource {
  get: (params?: ActionParams) => Promise<supertest.Response>;
  list: (params?: ActionParams) => Promise<supertest.Response>;
  create: (params?: ActionParams) => Promise<supertest.Response>;
  update: (params?: ActionParams) => Promise<supertest.Response>;
  destroy: (params?: ActionParams) => Promise<supertest.Response>;
  sort: (params?: SortActionParams) => Promise<supertest.Response>;

  [name: string]: (params?: ActionParams) => Promise<supertest.Response>;
}

export interface ExtendedAgent extends SuperAgentTest {
  login: (user: any, roleName?: string) => Promise<ExtendedAgent>;
  loginUsingId: (userId: number, roleName?: string) => Promise<ExtendedAgent>;
  resource: (name: string, resourceOf?: any) => Resource;
}

export class MockServer extends Application {
  registerMockDataSource() {
    this.dataSourceManager.factory.register('mock', MockDataSource);
  }

  async loadAndInstall(options: any = {}) {
    await this.load({ method: 'install' });

    if (options.afterLoad) {
      await options.afterLoad(this);
    }

    await this.install({
      ...options,
      sync: {
        force: false,
        alter: {
          drop: false,
        },
      },
    });
  }

  async cleanDb() {
    await this.db.clean({ drop: true });
  }

  async quickstart(options: { clean?: boolean } = {}) {
    const { clean } = options;
    if (clean) {
      await this.cleanDb();
    }
    await this.runCommand('start', '--quickstart');
  }

  async destroy(options: any = {}): Promise<void> {
    await super.destroy(options);

    Gateway.getInstance().destroy();
    await AppSupervisor.getInstance().destroy();
  }

  agent(callback?): ExtendedAgent {
    const agent = supertest.agent(callback || this.callback());
    const prefix = this.resourcer.options.prefix;
    const authManager = this.authManager;
    const proxy = new Proxy(agent, {
      get(target, method: string, receiver) {
        if (['login', 'loginUsingId'].includes(method)) {
          return async (userOrId: any, roleName?: string) => {
            const userId = userOrId?.id ? userOrId.id : userOrId;
            const tokenInfo = await authManager.tokenController.add({ userId });
            const expiresIn = (await authManager.tokenController.getConfig()).tokenExpirationTime;

            return proxy
              .auth(
                jwt.sign(
                  {
                    userId,
                    temp: true,
                    roleName,
                    signInTime: Date.now(),
                  },
                  process.env.APP_KEY,
                  {
                    jwtid: tokenInfo.jti,
                    expiresIn,
                  },
                ),
                { type: 'bearer' },
              )
              .set('X-Authenticator', 'basic');
          };
        }
        if (method === 'resource') {
          return (name: string, resourceOf?: any) => {
            const keys = name.split('.');
            const proxy = new Proxy(
              {},
              {
                get(target, method: string, receiver) {
                  return (params: ActionParams = {}) => {
                    let { filterByTk } = params;
                    const { values = {}, file, ...restParams } = params;
                    if (params.associatedIndex) {
                      resourceOf = params.associatedIndex;
                    }
                    if (params.resourceIndex) {
                      filterByTk = params.resourceIndex;
                    }
                    let url = prefix || '';
                    if (keys.length > 1) {
                      url += `/${keys[0]}/${resourceOf}/${keys[1]}`;
                    } else {
                      url += `/${name}`;
                    }
                    url += `:${method as string}`;
                    if (filterByTk) {
                      url += `/${filterByTk}`;
                    }

                    if (restParams.filter) {
                      restParams.filter = JSON.stringify(restParams.filter);
                    }

                    const queryString = qs.stringify(restParams, { arrayFormat: 'brackets' });

                    let request;

                    switch (method) {
                      case 'list':
                      case 'get':
                        request = agent.get(`${url}?${queryString}`);
                        break;
                      default:
                        request = agent.post(`${url}?${queryString}`);
                        break;
                    }

                    return file ? request.attach('file', file).field(values) : request.send(values);
                  };
                },
              },
            );
            return proxy;
          };
        }
        return agent[method];
      },
    });
    return proxy as any;
  }

  protected createDatabase(options: ApplicationOptions) {
    const oldDatabase = this.db;

    const databaseOptions = oldDatabase ? oldDatabase.options : <any>options?.database || {};
    const database = mockDatabase(databaseOptions);
    database.setContext({ app: this });

    return database;
  }
}

export function mockServer(options: ApplicationOptions = {}) {
  if (typeof TextEncoder === 'undefined') {
    global.TextEncoder = require('util').TextEncoder;
  }

  if (typeof TextDecoder === 'undefined') {
    global.TextDecoder = require('util').TextDecoder;
  }

  Gateway.getInstance().reset();
  // AppSupervisor.getInstance().reset();

  // @ts-ignore
  if (!PluginManager.findPackagePatched) {
    PluginManager.getPackageJson = async () => {
      return {
        version: '0.0.0',
      };
    };

    // @ts-ignore
    PluginManager.findPackagePatched = true;
  }

  const mockServerOptions = {
    acl: false,
    syncMessageManager: {
      debounce: 500,
    },
    ...options,
  };

  const app = new MockServer(mockServerOptions);

  const basename = app.options.pubSubManager?.channelPrefix;

  if (basename) {
    app.pubSubManager.setAdapter(
      MemoryPubSubAdapter.create(basename, {
        debounce: 500,
      }),
    );
  }

  return app;
}

export async function startMockServer(options: ApplicationOptions = {}) {
  const app = mockServer(options);
  await app.runCommand('start');
  return app;
}

type BeforeInstallFn = (app) => Promise<void>;

export type MockServerOptions = ApplicationOptions & {
  version?: string;
  beforeInstall?: BeforeInstallFn;
  skipInstall?: boolean;
  skipStart?: boolean;
};

export type MockClusterOptions = MockServerOptions & {
  number?: number;
  clusterName?: string;
  appName?: string;
};

export type MockCluster = {
  nodes: MockServer[];
  destroy: () => Promise<void>;
};

export async function createMockCluster({
  number = 2,
  clusterName = `cluster_${uid()}`,
  appName = `app_${uid()}`,
  ...options
}: MockClusterOptions = {}): Promise<MockCluster> {
  const nodes: MockServer[] = [];
  let dbOptions;

  for (let i = 0; i < number; i++) {
    if (dbOptions) {
      options['database'] = {
        ...dbOptions,
      };
    }

    const app: MockServer = await createMockServer({
      ...options,
      skipSupervisor: true,
      name: clusterName + '_' + appName,
      instanceId: `${clusterName}_${appName}_${i}`,
      pubSubManager: {
        channelPrefix: clusterName,
      },
    });

    if (!dbOptions) {
      dbOptions = app.db.options;
    }

    nodes.push(app);
  }
  return {
    nodes,
    async destroy() {
      for (const node of nodes) {
        await node.destroy();
      }
    },
  };
}

export async function createMockServer(options: MockServerOptions = {}): Promise<MockServer> {
  // clean cache directory
  const cachePath = path.join(process.cwd(), 'storage', 'cache');
  try {
    await fs.rm(cachePath, { recursive: true, force: true });
    await fs.mkdir(cachePath, { recursive: true });
  } catch (e) {
    // ignore errors
  }
  const { version, beforeInstall, skipInstall, skipStart, ...others } = options;
  const app: MockServer = mockServer(others);
  if (!skipInstall) {
    if (beforeInstall) {
      await beforeInstall(app);
    }
    await app.runCommandThrowError('install', '-f');
  }
  if (version) {
    await app.version.update(version);
  }
  if (!skipStart) {
    await app.runCommandThrowError('start');
  }
  return app;
}

export default mockServer;
