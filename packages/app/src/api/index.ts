import Api from '../../../server/src';
import dotenv from 'dotenv';
import path from 'path';
import actions from '../../../actions/src';
import associated from '../../../actions/src/middlewares/associated';
import { Op } from 'sequelize';

const sync = {
  force: false,
  alter: {
    drop: false,
  },
};

console.log('process.env.NOCOBASE_ENV', process.env.NOCOBASE_ENV);

dotenv.config();

const api = Api.create({
  database: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    logging: false,
    define: {},
    sync,
  },
  resourcer: {
    prefix: '/api',
  },
});

api.resourcer.use(associated);
api.resourcer.registerActionHandlers({...actions.common, ...actions.associate});

api.resourcer.use(async (ctx: actions.Context, next) => {
  const token = ctx.get('Authorization').replace(/^Bearer\s+/gi, '');
  // console.log('user check', ctx.action.params.actionName);
  // const { actionName } = ctx.action.params;
  if (!token) {
    return next();
  }
  const User = ctx.db.getModel('users');
  const user = await User.findOne({
    where: {
      token,
    },
  });
  if (!user) {
    return next();
  }
  ctx.state.currentUser = user;
  // console.log('ctx.state.currentUser', ctx.state.currentUser);
  await next();
});

api.resourcer.use(async (ctx: actions.Context, next) => {
  const { actionName, resourceField, resourceName, fields = {} } = ctx.action.params;
  const table = ctx.db.getTable(resourceField ? resourceField.options.target : resourceName);
  // ctx.state.developerMode = {[Op.not]: null};
  ctx.state.developerMode = false;
  if (table && table.hasField('developerMode') && ctx.state.developerMode === false) {
    ctx.action.setParam('filter.developerMode', ctx.state.developerMode);
  }
  if (table && ['get', 'list'].includes(actionName)) {
    const except = fields.except || [];
    const appends = fields.appends || [];
    for (const [name, field] of table.getFields()) {
      if (field.options.hidden) {
        except.push(field.options.name);
      }
      if (field.options.appends) {
        appends.push(field.options.name);
      }
    }
    if (except.length) {
      ctx.action.setParam('fields.except', except);
    }
    if (appends.length) {
      ctx.action.setParam('fields.appends', appends);
    }
    // console.log('ctx.action.params.fields', ctx.action.params.fields, except, appends);
  }
  await next();
});

// api.resourcer.use(async (ctx: actions.Context, next) => {
//   const { resourceField, resourceName, viewName, filter } = ctx.action.params;
//   // TODO: 需要补充默认视图的情况
//   let view: any;
//   if (viewName) {
//     view = await ctx.db.getModel('views').findOne({
//       where: {
//         collection_name: resourceField ? resourceField.options.target : resourceName,
//         name: viewName,
//       }
//     });
//     const viewFilter = view.get('filter');
//     if (viewFilter) {
//       const args = [viewFilter, filter].filter(Boolean);
//       ctx.action.setParam('filter', {and: args});
//       console.log(ctx.action.params.filter);
//     }
//   }
//   await next();
// });

api.registerPlugin('plugin-collections', [path.resolve(__dirname, '../../../plugin-collections'), {}]);
api.registerPlugin('plugin-pages', [path.resolve(__dirname, '../../../plugin-pages'), {}]);
api.registerPlugin('plugin-users', [path.resolve(__dirname, '../../../plugin-users'), {}]);
api.registerPlugin('plugin-file-manager', [path.resolve(__dirname, '../../../plugin-file-manager'), {}]);

(async () => {
  await api.loadPlugins();
  await api.database.getModel('collections').load({skipExisting: true});
  api.listen(process.env.HTTP_PORT, () => {
    console.log(`http://localhost:${process.env.HTTP_PORT}/`);
  });
})();
