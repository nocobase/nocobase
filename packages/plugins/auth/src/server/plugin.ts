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

  async importModules<T, U>(dir: string) {
    const files = await readdir(resolve(__dirname, dir));
    const mods: { [key: string]: U } = {};
    files.forEach((file) => {
      const fileName = file.replace(/\.ts$/, '');
      const mod: T = requireModule(resolve(__dirname, dir, file));
      Object.entries(mod).forEach(([key, handler]: [key: string, handler: U]) => {
        mods[`${fileName}:${key}`] = handler;
      });
    });
    return mods;
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.app.authManager.registerTypes(presetAuthType, {
      auth: BasicAuth,
      optionsSchema: {
        type: 'object',
        properties: {
          secret: {
            title: 'JWT Secret',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
          expireIn: {
            title: '{{t("Expire In",{ns:"auth"})}}',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
        },
      },
    });
    this.app.authManager.setStorer({
      get: async (name: string) => {
        const repo = this.db.getRepository('authenticators');
        return await repo.findOne({ filter: { name } });
      },
    });

    this.app.actions(await this.importModules<Handlers, HandlerType>('actions'));
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
