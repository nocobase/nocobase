import qs from 'qs';
import supertest from 'supertest';
import Application, { ApplicationOptions } from '@nocobase/server';
import { getConfig } from './mockDatabase';

interface ActionParams {
  fields?: string[] | {
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
  resourceKey?: string;
  associatedName?: string;
  associatedKey?: string;
  [key: string]: any;
}

interface SortActionParams {
  resourceName?: string;
  resourceKey?: any;
  associatedName?: string;
  associatedKey?: any;
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

  protected agentInstance: supertest.SuperAgentTest;

  agent() {
    if (!this.agentInstance) {
      this.agentInstance = supertest.agent(this.callback());
    }
    return this.agentInstance;
  }

  resource(name: string) {
    const agent = this.agent();
    const keys = name.split('.');
    const prefix = this.resourcer.options.prefix;
    const proxy = new Proxy({}, {
      get(target, method: string, receiver) {
        return (params: ActionParams = {}) => {
          const {
            associatedKey,
            resourceKey,
            values = {},
            file,
            ...restParams
          } = params;
          let url = prefix;
          if (keys.length > 1) {
            url = `/${keys[0]}/${associatedKey}/${keys[1]}`
          } else {
            url = `/${name}`;
          }
          url += `:${method as string}`;
          if (resourceKey) {
            url += `/${resourceKey}`;
          }
          console.log('request url: ' + url);
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
              return agent
                .post(`${url}?${qs.stringify(restParams)}`)
                .send(values);
          }
        };
      },
    });
    return proxy as Resource;
  }
}

export function mockServer(options?: ApplicationOptions) {
  return new MockServer({
    ...options,
    database: getConfig(options?.database),
  });
}

export default mockServer;
