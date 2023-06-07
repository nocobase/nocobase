import { Database, mockDatabase } from '@nocobase/database';
import Application, { ApplicationOptions, PluginManager } from '@nocobase/server';
import qs from 'qs';
import supertest, { SuperAgentTest } from 'supertest';

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

export class MockServer extends Application {
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

  agent(): SuperAgentTest & { resource: (name: string, resourceOf?: any) => Resource } {
    const agent = supertest.agent(this.appManager.callback());
    const prefix = this.resourcer.options.prefix;
    const proxy = new Proxy(agent, {
      get(target, method: string, receiver) {
        if (method === 'resource') {
          return (name: string, resourceOf?: any) => {
            const keys = name.split('.');
            const proxy = new Proxy(
              {},
              {
                get(target, method: string, receiver) {
                  return (params: ActionParams = {}) => {
                    let { filterByTk, values = {}, file, ...restParams } = params;
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
}

export function mockServer(options: ApplicationOptions = {}) {
  if (typeof TextEncoder === 'undefined') {
    global.TextEncoder = require('util').TextEncoder;
  }

  if (typeof TextDecoder === 'undefined') {
    global.TextDecoder = require('util').TextDecoder;
  }

  // @ts-ignore
  if (!PluginManager.findPackagePatched) {
    PluginManager.getPackageJson = () => {
      return {
        version: '0.0.0',
      };
    };

    // @ts-ignore
    PluginManager.findPackagePatched = true;
  }

  let database;
  if (options?.database instanceof Database) {
    database = options.database;
  } else {
    database = mockDatabase(<any>options?.database || {});
  }

  const app = new MockServer({
    acl: false,
    ...options,
    database,
  });

  app.pm.generateClientFile = async () => {};

  return app;
}

export function createMockServer() {}

export default mockServer;
