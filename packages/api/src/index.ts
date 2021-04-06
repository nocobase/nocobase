import api from './app';
import actions from '@nocobase/actions';
import send from 'koa-send';
import serve from 'koa-static';

api.resourcer.use(async (ctx: actions.Context, next) => {
  const { actionName, resourceField, resourceName, fields = {} } = ctx.action.params;
  const table = ctx.db.getTable(resourceField ? resourceField.options.target : resourceName);
  // ctx.state.developerMode = {[Op.not]: null};
  ctx.state.developerMode = false;
  if (table && table.hasField('developerMode') && ctx.state.developerMode === false) {
    ctx.action.mergeParams({ filter: { "developerMode.$isFalsy": true } }, { filter: 'and' });
  }
  if (table && ['get', 'list'].includes(actionName)) {
    const except = [];
    const appends = [];
    for (const [name, field] of table.getFields()) {
      if (field.options.hidden) {
        except.push(field.options.name);
      }
      // if (field.options.appends) {
      //   appends.push(field.options.name);
      // }
    }
    ctx.action.mergeParams({ fields: {
      except,
      appends
    } }, { fields: 'append' });
    // console.log('ctx.action.params.fields', ctx.action.params.fields, except, appends);
  }
  await next();
});

(async () => {
  await api.loadPlugins();

  api.database.getModel('users').addHook('beforeUpdate', function (model) {
    console.log('users.beforeUpdate', model.get(), model.changed('password' as any));
  });

  api.resourcer.use(async (ctx, next) => {
    if (process.env.NOCOBASE_ENV !== 'demo') {
      return next();
    }
    const currentUser = ctx.state.currentUser;
    if (currentUser && currentUser.username === 'admin') {
      return next();
    }
    const { actionName } = ctx.action.params;
    if (['create', 'update', 'destroy', 'sort', 'upload'].includes(actionName)) {
      ctx.body = {
        data: {},
        meta: {},
      };
      return;
    }
    await next();
  });

  await api.database.getModel('collections').load({skipExisting: true});
  await api.database.getModel('collections').load({where: {
    name: 'users',
  }});
  await api.database.getModel('automations').load();

  api.use(async (ctx, next) => {
    if (!process.env.APP_DIST || !process.env.USE_STATIC_SERVER || process.env.USE_STATIC_SERVER === 'false') {
      return next();
    }
    await serve(process.env.APP_DIST)(ctx, next);
    if (ctx.status == 404) {
      return send(ctx, 'index.html', { root: process.env.APP_DIST });
    }
  });

  api.listen(process.env.API_PORT, () => {
    console.log(`http://localhost:${process.env.API_PORT}/`);
  });
})();
