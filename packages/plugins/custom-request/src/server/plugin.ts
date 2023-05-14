import { InstallOptions, Plugin } from '@nocobase/server';
import { customRequestActions } from './actions';
import { resolve } from 'path';
import { rolesCustomRequestActions } from './actions/rolesCustomRequestAction';
import { checkSendPermission } from './send-middleware';

export class CustomRequestPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.app.acl.registerSnippet({
      name: `ui.customRequest`,
      actions: ['customRequest:*'],
    });

    this.app.resourcer.define({
      name: 'customRequest',
      actions: customRequestActions,
    });
    this.app.resourcer.define({
      name: 'rolesCustomRequest',
      actions: rolesCustomRequestActions,
    });

    this.app.resourcer.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action;
      if (resourceName === 'customRequest' && actionName === 'send') {
        return checkSendPermission(ctx, next);
      } else {
        await next();
      }
    });
    this.app.acl.allow('customRequest', ['get', 'list', 'set', 'send'], 'loggedIn');
    this.app.acl.allow('rolesCustomRequest', ['get', 'set', 'list'], 'loggedIn');
  }

  async load() {
    console.log('load');

    await this.importCollections(resolve(__dirname, 'collections'));
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CustomRequestPlugin;
