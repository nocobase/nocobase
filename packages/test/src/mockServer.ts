import qs from 'qs';
import supertest, { SuperAgentTest } from 'supertest';
import Application, { ApplicationOptions } from '@nocobase/server';
import { getConfig } from './mockDatabase';

interface ActionParams {
  fields?:
    | string[]
    | {
        only?: string[];
        except?: string[];
        appends?: string[];
      };
  filter?: any;
  sort?: string[];
  page?: number;
  perPage?: number;
  values?: any;
  resourceName?: string;
  resourceIndex?: string;
  associatedName?: string;
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
  agent(): SuperAgentTest & { resource: (name: string) => Resource } {
    const agent = supertest.agent(this.callback());
    const prefix = this.resourcer.options.prefix;
    const proxy = new Proxy(agent, {
      get(target, method: string, receiver) {
        if (method === 'resource') {
          return (name: string) => {
            const keys = name.split('.');
            const proxy = new Proxy(
              {},
              {
                get(target, method: string, receiver) {
                  return (params: ActionParams = {}) => {
                    const { associatedIndex, resourceIndex, values = {}, file, ...restParams } = params;
                    let url = prefix;
                    if (keys.length > 1) {
                      url = `/${keys[0]}/${associatedIndex}/${keys[1]}`;
                    } else {
                      url = `/${name}`;
                    }
                    url += `:${method as string}`;
                    if (resourceIndex) {
                      url += `/${resourceIndex}`;
                    }

                    switch (method) {
                      case 'upload':
                        return agent
                          .post(`${url}?${qs.stringify(restParams)}`)
                          .attach('file', file)
                          .field(values);
                      case 'list':
                      case 'get':
                        return agent.get(`${url}?${qs.stringify(restParams)}`);
                      default:
                        return agent.post(`${url}?${qs.stringify(restParams)}`).send(values);
                    }
                  };
                },
              },
            );
            return proxy;
          };
        }
        return (...args: any[]) => {
          return agent[method](...args);
        };
      },
    });
    return proxy as any;
  }
}

export function mockServer(options?: ApplicationOptions) {
  return new MockServer({
    ...options,
    database: getConfig(options?.database),
  });
}

export default mockServer;
