import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import Koa from 'koa';
import { Options } from 'sequelize';
import bodyParser from 'koa-bodyparser';
import associated from '../middlewares/associated';
import actions from '..';

export const config: {
  [key: string]: Options;
} = {
  mysql: {
    username: 'test',
    password: 'test',
    database: 'test',
    host: '127.0.0.1',
    port: 43306,
    dialect: 'mysql',
  },
  postgres: {
    username: 'test',
    password: 'test',
    database: 'test',
    host: '127.0.0.1',
    port: 45432,
    dialect: 'postgres',
    define: {
      hooks: {
        beforeCreate(model, options) {
          
        },
      },
    },
    logging: false,
  },
};

export function getConfig() {
  const app = new Koa();
  const database = new Database(config.postgres);
  const resourcer = new Resourcer();
  resourcer.use(associated);
  resourcer.registerHandlers({...actions.associate, ...actions.common});
  resourcer.define({
    name: 'posts',
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
    type: 'belongsTo',
    name: 'posts.user',
    actions: actions.associate,
  });
  resourcer.define({
    type: 'belongsToMany',
    name: 'posts.tags',
    actions: actions.associate,
  });
  app.use(async (ctx, next) => {
    ctx.db = database;
    await next();
  });
  app.use(bodyParser());
  app.use(resourcer.middleware());
  return { app, database, resourcer };
}