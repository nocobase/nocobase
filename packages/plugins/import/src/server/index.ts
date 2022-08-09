import { InstallOptions, Plugin } from '@nocobase/server';

export class ImportPlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad() {
    // TODO
  }

  async load() {
    // TODO
    // Visit: http://localhost:13000/api/testImport:getInfo
    this.app.resource({
      name: 'testImport',
      actions: {
        async getInfo(ctx, next) {
          ctx.body = `Hello import!`;
          next();
        },
      },
    });
    this.app.acl.allow('testImport', 'getInfo');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default ImportPlugin;
