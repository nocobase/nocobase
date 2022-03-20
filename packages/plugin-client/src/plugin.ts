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
      cmd.option('--lang [lang]');
    }

    this.app.on('afterInstall', async (app, options) => {
      const [opts] = options?.cliArgs || [{}];
      if (opts?.importDemo) {
      }
      if (opts?.lang) {
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
          ctx.body = {
            lang: 'zh-CN',
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
      await serve(root)(ctx, next);
      // console.log('koa-send', root, ctx.status);
      if (ctx.status == 404) {
        return send(ctx, 'index.html', { root });
      }
    });
  }
}

export default ClientPlugin;
