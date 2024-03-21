import { InstallOptions, Plugin } from '@nocobase/server';

export class PluginDisablePmAddServer extends Plugin {
  beforeLoad() {
    // TODO
  }

  async load() {
    this.app.resourcer.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action;
      if (resourceName === 'pm' && actionName === 'add') {
        ctx.throw(403, 'The current environment does not allow adding plugins online');
      }
      await next();
    });
  }

  async disable() {
    // this.app.resourcer.removeResource('testHello');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default PluginDisablePmAddServer;
