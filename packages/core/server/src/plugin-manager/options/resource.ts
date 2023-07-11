export default {
  name: 'pm',
  actions: {
    async list(ctx, next) {
      const pm = ctx.app.pm;
      ctx.body = await pm.list();
      await next();
    },
    async pluginsClient(ctx, next) {
      const pm = ctx.app.pm;
      ctx.body = await pm.getPluginsClientFiles();
      await next();
    },
    async addByNpm(ctx, next) {
      const pm = ctx.app.pm;
      const { values } = ctx.action.params;
      if (!values['name']) {
        ctx.throw(400, 'plugin name is required');
      }
      if (!values['registry']) {
        ctx.throw(400, 'plugin registry is required');
      }
      ctx.body = await pm.addByNpm(values);
      await next();
    },
    async upgradeByNpm(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name is required');
      }
      await pm.upgradeByNpm(filterByTk);
      ctx.body = filterByTk;
      await next();
    },
    async addByUpload(ctx, next) {
      const pm = ctx.app.pm;
      const { values } = ctx.action.params;
      if (!values['zipUrl']) {
        ctx.throw(400, 'zipUrl is required');
      }
      ctx.body = await pm.addByUpload(values);
      await next();
    },
    async upgradeByUpload(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk, values } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name is required');
      }
      if (!values['zipUrl']) {
        ctx.throw(400, 'zipUrl is required');
      }
      await pm.upgradeByUpload(filterByTk, values['zipUrl']);
      ctx.body = filterByTk;
      await next();
    },
    async enable(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name is required');
      }
      await pm.enable(filterByTk);
      ctx.body = filterByTk;
      await next();
    },
    async disable(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name is required');
      }
      await pm.disable(filterByTk);
      ctx.body = filterByTk;
      await next();
    },
    async remove(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name is required');
      }
      await pm.remove(filterByTk);
      ctx.body = filterByTk;
      await next();
    },
  },
};
