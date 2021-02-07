import Api from '../../../server/src';
import dotenv from 'dotenv';
import path from 'path';
import actions from '../../../actions/src';
import associated from '../../../actions/src/middlewares/associated';

// @ts-ignore
const sync = global.sync || {
  force: true,
  alter: {
    drop: true,
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
    logging: process.env.DB_LOG_SQL === 'on' ? console.log : false,
    define: {},
    sync,
  },
  resourcer: {
    prefix: '/api',
  },
});

api.resourcer.use(associated);
api.resourcer.registerActionHandlers({...actions.common, ...actions.associate});

// api.resourcer.use(async (ctx: actions.Context, next) => {
//   const token = ctx.get('Authorization').replace(/^Bearer\s+/gi, '');
//   // console.log('user check', ctx.action.params.actionName);
//   // const { actionName } = ctx.action.params;
//   if (!token) {
//     return next();
//   }
//   const User = ctx.db.getModel('users');
//   const user = await User.findOne({
//     where: {
//       token,
//     },
//   });
//   if (!user) {
//     return next();
//   }
//   ctx.state.currentUser = user;
//   // console.log('ctx.state.currentUser', ctx.state.currentUser);
//   await next();
// });

api.registerPlugin('plugin-collections', [path.resolve(__dirname, '../../../plugin-collections'), {}]);
api.registerPlugin('plugin-action-logs', [path.resolve(__dirname, '../../../plugin-action-logs'), {}]);
api.registerPlugin('plugin-pages', [path.resolve(__dirname, '../../../plugin-pages'), {}]);
api.registerPlugin('plugin-users', [path.resolve(__dirname, '../../../plugin-users'), {}]);
api.registerPlugin('plugin-file-manager', [path.resolve(__dirname, '../../../plugin-file-manager'), {}]);
api.registerPlugin('plugin-permissions', [path.resolve(__dirname, '../../../plugin-permissions'), {}]);
api.registerPlugin('plugin-automations', [path.resolve(__dirname, '../../../plugin-automations'), {}]);

export default api;
