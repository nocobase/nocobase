import qs from 'qs';
import plugin from '../server';
import supertest from 'supertest';
import bodyParser from 'koa-bodyparser';
import { Dialect } from 'sequelize';
import Database from '@nocobase/database';
import { actions, middlewares } from '@nocobase/actions';
import { Application, middleware } from '@nocobase/server';

function getTestKey() {
  const { id } = require.main;
  const key = id
    .replace(`${process.env.PWD}/packages`, '')
    .replace(/src\/__tests__/g, '')
    .replace('.test.ts', '')
    .replace(/[^\w]/g, '_')
    .replace(/_+/g, '_');
  return key
}

const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT, 10),
  dialect: process.env.DB_DIALECT as Dialect,
  define: {
    hooks: {
      beforeCreate(model, options) {
        
      },
    },
  },
  logging: false,
  sync: {
    force: true,
    alter: {
      drop: true,
    },
  },
};

export async function getApp() {
  const app = new Application({
    database: {
      ...config,
      hooks: {
        beforeDefine(columns, model) {
          model.tableName = `${getTestKey()}_${model.tableName || model.name.plural}`;
        }
      },
    },
    resourcer: {
      prefix: '/api',
    },
  });
  app.resourcer.use(middlewares.associated);
  app.resourcer.registerActionHandlers({...actions.associate, ...actions.common});
  app.registerPlugin('collections', [plugin]);
  await app.loadPlugins();
  await app.database.sync();
  // 表配置信息存到数据库里
  // const tables = app.database.getTables([]);
  // for (const table of tables) {
  //   const Collection = app.database.getModel('collections');
  //   await Collection.import(table.getOptions(), { hooks: false });
  // }
  app.use(async (ctx, next) => {
    ctx.db = app.database;
    await next();
  });
  app.use(bodyParser());
  app.use(middleware({
    prefix: '/api',
    resourcer: app.resourcer,
    database: app.database,
  }));
  return app;
}

interface ActionParams {
  resourceKey?: string | number;
  // resourceName?: string;
  // associatedName?: string;
  associatedKey?: string | number;
  fields?: any;
  filter?: any;
  values?: any;
  [key: string]: any;
}

interface Handler {
  get: (params?: ActionParams) => Promise<supertest.Response>;
  list: (params?: ActionParams) => Promise<supertest.Response>;
  create: (params?: ActionParams) => Promise<supertest.Response>;
  update: (params?: ActionParams) => Promise<supertest.Response>;
  destroy: (params?: ActionParams) => Promise<supertest.Response>;
  [name: string]: (params?: ActionParams) => Promise<supertest.Response>;
}

export interface Agent {
  resource: (name: string) => Handler;
}

export function getAgent(app: Application): Agent {
  const agent = supertest.agent(app.callback());
  return {
    resource(name: string): any {
      return new Proxy({}, {
        get(target, method, receiver) {
          return (params: ActionParams = {}) => {
            const { associatedKey, resourceKey, values = {}, ...restParams } = params;
            let url = `/api/${name}`;
            if (associatedKey) {
              url = `/api/${name.split('.').join(`/${associatedKey}/`)}`;
            }
            url += `:${method as string}`;
            if (resourceKey) {
              url += `/${resourceKey}`;
            }
            console.log(url);
            if (['list', 'get'].indexOf(method as string) !== -1) {
              return agent.get(`${url}?${qs.stringify(restParams)}`);
            } else {
              return agent.post(`${url}?${qs.stringify(restParams)}`).send(values);
            }
          }
        }
      });
    }
  };
}

export function getDatabase() {
  return new Database({
    ...config,
    hooks: {
      beforeDefine(columns, model) {
        model.tableName = `${getTestKey()}_${model.tableName || model.name.plural}`;
      }
    }
  });
};
