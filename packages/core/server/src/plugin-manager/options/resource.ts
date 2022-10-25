export default {
  name: 'pm',
  actions: {
    async add(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'null');
      }
      await pm.add(filterByTk);
      ctx.body = filterByTk;
      await next();
    },
    async enable(ctx, next) {
      const app = ctx.app;
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'filterByTk invalid');
      }
      const name = pm.getPackageName(filterByTk);
      const plugin = pm.get(name);
      if (plugin.model) {
        plugin.model.set('enabled', true);
        await plugin.model.save();
      }
      if (!plugin) {
        ctx.throw(400, 'plugin invalid');
      }
      await app.reload();
      if (plugin.model && !plugin.model.get('installed')) {
        await app.db.sync();
        await plugin.install();
        plugin.model.set('installed', true);
        await plugin.model.save();
      }
      await app.start();
      ctx.body = 'ok';
      await next();
    },
    async disable(ctx, next) {
      const app = ctx.app;
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'filterByTk invalid');
      }
      const name = pm.getPackageName(filterByTk);
      const plugin = pm.get(name);
      if (plugin.model) {
        plugin.model.set('enabled', false);
        await plugin.model.save();
      }
      if (!plugin) {
        ctx.throw(400, 'plugin invalid');
      }
      await app.reload();
      await app.start();
      ctx.body = 'ok';
      await next();
    },
    async upgrade(ctx, next) {
      ctx.body = 'ok';
      await next();
    },
    async remove(ctx, next) {
      const app = ctx.app;
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'filterByTk invalid');
      }
      const name = pm.getPackageName(filterByTk);
      console.log(name, pm.plugins.keys());
      const plugin = pm.get(name);
      if (plugin?.model) {
        await plugin.model.destroy();
        pm.remove(name);
      } else {
        await pm.repository.destroy({
          filter: {
            name: filterByTk,
          },
        });
      }
      await app.reload();
      await app.start();
      ctx.body = 'ok';
      await next();
    },
  },
};
