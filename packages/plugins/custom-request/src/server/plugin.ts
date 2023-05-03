import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { CustomRequestCollectionName } from './constants';
import { getConfiguration, setConfiguration } from '@nocobase/plugin-map/src/server/actions';

export class CustomRequestPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    console.log('load');
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.app.resource({
      name: 'custom-request',
      actions: {
        get: getConfiguration,
        set: setConfiguration,
      },
      only: ['get', 'set'],
    });
    // this.app.acl.allow(CustomRequestCollectionName, 'list', 'loggedIn');

    this.app.resourcer.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action.params;

      if (resourceName == CustomRequestCollectionName && actionName !== 'list') {
        ctx.throw(404, 'Not Found');
      } else {
        await next();
      }
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CustomRequestPlugin;
