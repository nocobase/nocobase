import { InstallOptions, Plugin } from '@nocobase/server';

export class {{{pascalCaseName}}}Plugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    // TODO
    // Visit: http://localhost:13000/api/test{{{pascalCaseName}}}:getInfo
    this.app.resource({
      name: 'test{{{pascalCaseName}}}',
      actions: {
        async getInfo(ctx, next) {
          ctx.body = `Hello {{{name}}}!`;
          next();
        },
      },
    });
    this.app.acl.allow('test{{{pascalCaseName}}}', 'getInfo');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default {{{pascalCaseName}}}Plugin;
