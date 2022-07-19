import { Database, mockDatabase } from '@nocobase/database';
import Application, { ApplicationOptions } from '@nocobase/server';
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
    await this.load();
    await this.install({
      ...options,
      sync: {
        force: true,
        alter: {
          drop: false,
        },
      },
    });
  }

  async cleanDb() {
    await this.db.sequelize.getQueryInterface().dropAllTables();
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

                    switch (method) {
                      case 'upload':
                        return agent.post(`${url}?${queryString}`).attach('file', file).field(values);
                      case 'list':
                      case 'get':
                        return agent.get(`${url}?${queryString}`);
                      default:
                        return agent.post(`${url}?${queryString}`).send(values);
                    }
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
  let database;
  if (options?.database instanceof Database) {
    database = options.database;
  } else {
    database = mockDatabase(<any>options?.database || {});
  }

  return new MockServer({
    ...options,
    database,
  });
}

export function createMockServer() {}

export default mockServer;
