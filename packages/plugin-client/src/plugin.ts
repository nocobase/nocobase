import { skip } from '@nocobase/acl';
import { Plugin } from '@nocobase/server';

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
  }
}

export default ClientPlugin;
