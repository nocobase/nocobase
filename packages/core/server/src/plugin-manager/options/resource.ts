export default {
  name: 'pm',
  actions: {
    async add(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      await pm.add(filterByTk);
      ctx.body = filterByTk;
      await next();
    },
    async addByNpm(ctx, next) {
      const pm = ctx.app.pm;
      const { values } = ctx.action.params;
      if (!values['name']) {
        ctx.throw(400, 'plugin name is required');
      }
      if (!values['packageName']) {
        ctx.throw(400, 'plugin packageName is required');
      }
      if (!values['registry']) {
        ctx.throw(400, 'plugin registry is required');
      }
      ctx.body = await pm.addByNpm(values);
      await next();
    },
    async enable(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      await pm.enable(filterByTk);
      ctx.body = filterByTk;
      await next();
    },
    async disable(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      await pm.disable(filterByTk);
      ctx.body = filterByTk;
      await next();
    },
    async upgrade(ctx, next) {
      ctx.body = 'ok';
      await next();
    },
    async remove(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      await pm.remove(filterByTk);
      ctx.body = filterByTk;
      await next();
    },
    async detail(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      ctx.body = await pm.detail(filterByTk);
      await next();
    },
  },
};
