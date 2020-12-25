import { resolve } from 'path';

import glob from 'glob';
import Koa from 'koa';
import { Dialect } from 'sequelize';
import bodyParser from 'koa-bodyparser';
import supertest from 'supertest';

import Database, { requireModule } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';

import associated from '../middlewares/associated';
import actions from '..';
import list1 from './actions/list1';
import create1 from './actions/create1';
import create2 from './actions/create2';
import update1 from './actions/update1';
import update2 from './actions/update2';

function getTestKey() {
  const { id } = require.main;
  const key = id
    .replace(`${process.env.PWD}/packages`, '')
    .replace(/src\/__tests__/g, '')
    .replace('.test.ts', '')
    .replace(/[^\w]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return key
}

const connection = {
  config: {
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
    logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
  },
  database: null,
  create() {
    this.database = new Database(this.config);
  },
  get() {
    return this.database;
  }
};

const tableFiles = glob.sync(`${resolve(__dirname, './tables')}/*.ts`);

// resourcer 在内存中是单例，需要谨慎使用
export const resourcer = new Resourcer();
resourcer.use(associated);
resourcer.registerActionHandlers({...actions.associate, ...actions.common });
resourcer.define({
  name: 'posts',
  actions: {
    ...actions.common,
    list1,
    create1,
    create2,
    update1,
    update2
  },
});
resourcer.define({
  name: 'comments',
  actions: actions.common,
});
resourcer.define({
  name: 'users',
  actions: actions.common,
});
resourcer.define({
  type: 'hasOne',
  name: 'users.profile',
  actions: actions.associate,
});
resourcer.define({
  type: 'hasMany',
  name: 'posts.comments',
  actions: actions.associate,
});
resourcer.define({
  type: 'hasMany',
  name: 'users.posts',
  actions: actions.associate,
});
resourcer.define({
  type: 'belongsTo',
  name: 'posts.user',
  actions: actions.associate,
});
resourcer.define({
  type: 'belongsToMany',
  name: 'posts.tags',
  actions: actions.associate,
});

const app = new Koa();
app.use(async (ctx, next) => {
  ctx.db = connection.get();
  await next();
});
app.use(bodyParser());
app.use(resourcer.middleware());

// 使用 agent 可以减少部分模板代码
export const agent = supertest.agent(app.callback());

export async function initDatabase() {
  if (!connection.get()) {
    connection.create();
  }

  const database = connection.get();

  // 由于 jest 每个测试文件是独立 worker 进程的机制，各个进程使用的是不同的数据库连接实例，但又对应到同一个数据库。
  // 所以不同测试文件会存在表结构冲突，这里使用了基于文件唯一的 key 作为后缀区分不同进程使用的数据库表，以满足并行测试。
  const key = getTestKey();
  tableFiles.forEach(file => {
    const options = requireModule(file);
    database.table(typeof options === 'function' ? options(database) : {
      ...options,
      tableName: `${key}_${options.tableName}`
    });
  });
  await database.sync({
    force: true,
  });

  return database;
}
