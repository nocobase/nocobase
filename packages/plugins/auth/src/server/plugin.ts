import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { BasicAuth } from './basic-auth';
import { readdir } from 'fs/promises';
import { requireModule } from '@nocobase/utils';
import { HandlerType, Handlers } from '@nocobase/resourcer';

export class AuthPlugin extends Plugin {
  afterAdd() {}

  async beforeLoad() {
    // this.app.actions(await this.importActions());
    this.app.actions({
      'authenticators:listTypes': async (ctx, next) => {
        ctx.app.logger.info('test');
        ctx.body = 'test';
        await next();
      },
    });
  }

  // async importActions() {
  //   const files = await readdir(resolve(__dirname, 'actions'));
  //   const actions = {};
  //   files.forEach((file) => {
  //     const fileName = file.replace(/\.ts$/, '');
  //     const mod: Handlers = requireModule(resolve(__dirname, 'actions', file));
  //     Object.entries(mod).forEach(([key, handler]: [key: string, handler: HandlerType]) => {
  //       actions[`${fileName}:${key}`] = handler;
  //     });
  //   });
  //   return actions;
  // }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.app.authManager.setStorer({
      get: async (name: string) => {
        const repo = this.db.getRepository('authenticators');
        return await repo.findOne({ filter: { name } });
      },
    });
  }

  async install(options?: InstallOptions) {
    const presetAuthType = 'email/password';
    const presetAuthenticator = 'basic';
    this.app.authManager.registerTypes(presetAuthType, BasicAuth);

    const repository = this.db.getRepository('authenticators');
    if (await repository.findOne({ filter: { name: presetAuthenticator } })) {
      return;
    }

    await repository.create({
      values: {
        name: presetAuthenticator,
        authType: presetAuthType,
      },
    });
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default AuthPlugin;
