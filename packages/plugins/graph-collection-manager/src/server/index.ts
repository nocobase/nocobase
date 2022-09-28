import { InstallOptions, Plugin } from '@nocobase/server';

export class GraphCollectionManagerPlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad() {
    // TODO
  }

  async load() {
    // TODO
    // Visit: http://localhost:13000/api/testGraphCollectionManager:getInfo
    this.app.resource({
      name: 'testGraphCollectionManager',
      actions: {
        async getInfo(ctx, next) {
          ctx.body = `Hello graph-collection-manager!`;
          next();
        },
      },
    });
    this.app.acl.allow('testGraphCollectionManager', 'getInfo');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default GraphCollectionManagerPlugin;
