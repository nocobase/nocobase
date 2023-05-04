import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { BasicAuth } from './basic-auth';
import { readdir } from 'fs/promises';
import { requireModule } from '@nocobase/utils';
import { HandlerType, Handlers } from '@nocobase/resourcer';
const presetAuthType = 'email/password';
const presetAuthenticator = 'basic';
export class AuthPlugin extends Plugin {
  afterAdd() {}

  async beforeLoad() {}

  async importActions() {
    const files = await readdir(resolve(__dirname, 'actions'));
    const actions = {};
    files.forEach((file) => {
      const fileName = file.replace(/\.ts$/, '');
      const mod: Handlers = requireModule(resolve(__dirname, 'actions', file));
      Object.entries(mod).forEach(([key, handler]: [key: string, handler: HandlerType]) => {
        actions[`${fileName}:${key}`] = handler;
      });
    });
    return actions;
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.app.authManager.registerTypes(presetAuthType, {
      auth: BasicAuth,
    });
    this.app.authManager.setStorer({
      get: async (name: string) => {
        const repo = this.db.getRepository('authenticators');
        return await repo.findOne({ filter: { name } });
      },
    });

    this.app.actions(await this.importActions());
  }

  async install(options?: InstallOptions) {
    const repository = this.db.getRepository('authenticators');
    const exist = await repository.findOne({ filter: { name: presetAuthenticator } });
    if (exist) {
      return;
    }

    await repository.create({
      values: {
        name: presetAuthenticator,
        authType: presetAuthType,
        description: 'Sign in with email and password.',
      },
    });
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default AuthPlugin;
