import { InstallOptions, Plugin } from '@nocobase/server';

export class HelloPlugin extends Plugin {
  beforeLoad() {
    // TODO
  }

  async load() {
    // TODO
    // Visit: http://localhost:13000/api/testHello:getInfo
    this.app.resource({
      name: 'testHello',
      actions: {
        async getInfo(ctx, next) {
          ctx.body = `Hello hello!`;
          next();
        },
      },
    });
    this.app.acl.allow('testHello', 'getInfo');
  }

  async disable() {
    // this.app.resourcer.removeResource('testHello');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default HelloPlugin;
