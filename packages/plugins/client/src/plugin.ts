import { skip } from '@nocobase/acl';
import { Plugin } from '@nocobase/server';
import send from 'koa-send';
import serve from 'koa-static';
import { resolve } from 'path';

export class ClientPlugin extends Plugin {
  async beforeLoad() {
    const cmd = this.app.findCommand('install');
    if (cmd) {
      cmd.option('--import-demo');
    }
    this.app.on('afterInstall', async (app, options) => {
      const [opts] = options?.cliArgs || [{}];
      if (opts?.importDemo) {
        //
      }
    });
  }

  async load() {
    this.app.acl.use(
      skip({
        resourceName: 'app',
        actionName: 'getLang',
      }),
    );
    this.app.resource({
      name: 'app',
      actions: {
        async getLang(ctx, next) {
          const SystemSetting = ctx.db.getRepository('systemSettings');
          const systemSetting = await SystemSetting.findOne();
          const currentUser = ctx.state.currentUser;
          ctx.body = {
            lang: currentUser?.appLang || systemSetting?.appLang || process.env.APP_LANG || 'en-US',
          };
          await next();
        },
      },
    });
    let root = this.options.dist;
    if (root && !root.startsWith('/')) {
      root = resolve(process.cwd(), root);
    }
    this.app.middleware.unshift(async (ctx, next) => {
      if (process.env.NOCOBASE_ENV === 'production') {
        return next();
      }
      if (!root) {
        return next();
      }
      if (ctx.path.startsWith(this.app.resourcer.options.prefix)) {
        return next();
      }
      await serve(root)(ctx, next);
      // console.log('koa-send', root, ctx.status);
      if (ctx.status == 404) {
        return send(ctx, 'index.html', { root });
      }
    });
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}

export default ClientPlugin;
