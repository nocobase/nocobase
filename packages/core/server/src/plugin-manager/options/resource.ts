import Application from '../../application';
import { getExposeUrl } from '../clientStaticMiddleware';
import PluginManager from '../plugin-manager';

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
      if (!values['packageName']) {
        ctx.throw(400, 'plugin packageName is required');
      }
      if (!values['registry']) {
        ctx.throw(400, 'plugin registry is required');
      }
      ctx.body = await pm.addByNpm(values);
      await next();
    },
    async addByCompressedFileUrl(ctx, next) {
      const pm = ctx.app.pm;
      const { values } = ctx.action.params;
      if (!values['compressedFileUrl']) {
        ctx.throw(400, 'plugin CompressedFileUrl is required');
      }
      if (!values['type']) {
        ctx.throw(400, 'type is required');
      }
      ctx.body = await pm.addByCompressedFileUrl(values);
      await next();
    },
    async upgradeByNpm(ctx, next) {
      const { values } = ctx.action.params;
      if (!values['registry']) {
        ctx.throw(400, 'plugin registry is required');
      }
      if (!values['version']) {
        ctx.throw(400, 'plugin version is required');
      }
      const pm = ctx.app.pm as PluginManager;
      await pm.upgradeByNpm(values);
      ctx.body = 'ok';
      await next();
    },
    async npmVersionList(ctx, next) {
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      const pm = ctx.app.pm;
      ctx.body = await pm.getNpmVersionList(filterByTk);
      await next();
    },
    async upgradeByCompressedFileUrl(ctx, next) {
      const { values } = ctx.action.params;
      if (!values.name) {
        ctx.throw(400, 'plugin name invalid');
      }
      if (!values['compressedFileUrl']) {
        ctx.throw(400, 'compressedFileUrl is required');
      }
      const pm = ctx.app.pm;
      await pm.upgradeByCompressedFileUrl(values);
      ctx.body = 'ok';
      await next();
    },
    async enable(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      const app = ctx.app as Application;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      app.runAsCLI(['pm', 'enable', filterByTk], { from: 'user' });
      ctx.body = filterByTk;
      await next();
    },
    async disable(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      const app = ctx.app as Application;
      app.runAsCLI(['pm', 'disable', filterByTk], { from: 'user' });
      ctx.body = filterByTk;
      await next();
    },
    async remove(ctx, next) {
      const pm = ctx.app.pm;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      const app = ctx.app as Application;
      app.runAsCLI(['pm', 'remove', filterByTk], { from: 'user' });
      ctx.body = filterByTk;
      await next();
    },
    async list(ctx, next) {
      const locale = ctx.getCurrentLocale();
      const pm = ctx.app.pm as PluginManager;
      ctx.body = await pm.list({ locale, isPreset: false });
      await next();
    },
    async listEnabled(ctx, next) {
      const pm = ctx.db.getRepository('applicationPlugins');
      const PLUGIN_CLIENT_ENTRY_FILE = 'dist/client/index.js';
      const items = await pm.find({
        filter: {
          enabled: true,
        },
      });
      ctx.body = items
        .map((item) => {
          try {
            const packageName = PluginManager.getPackageName(item.name);
            return {
              ...item.toJSON(),
              packageName,
              url: getExposeUrl(packageName, PLUGIN_CLIENT_ENTRY_FILE),
            };
          } catch {
            return false;
          }
        })
        .filter(Boolean);
      await next();
    },
    async get(ctx, next) {
      const locale = ctx.getCurrentLocale();
      const pm = ctx.app.pm as PluginManager;
      const { filterByTk } = ctx.action.params;
      if (!filterByTk) {
        ctx.throw(400, 'plugin name invalid');
      }
      ctx.body = await pm.get(filterByTk).toJSON({ locale });
      await next();
    },
  },
};
