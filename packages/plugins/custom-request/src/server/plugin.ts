import { InstallOptions, Plugin } from '@nocobase/server';
import { NAMESPACE, ROLE_NAMESPACE } from './constants';
import { customRequestActions } from './actions';
import { resolve } from 'path';
import { customRequestRolesActions } from './actions/customRequestRolesAction';

export class CustomRequestPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.app.acl.registerSnippet({
      name: `ui.customRequest`,
      actions: ['customRequest:*'],
    });

    this.app.resourcer.define({
      name: NAMESPACE,
      actions: customRequestActions,
    });
    this.app.resourcer.define({
      name: ROLE_NAMESPACE,
      actions: customRequestRolesActions,
    });

    this.app.acl.allow(NAMESPACE, ['get', 'list', 'send'], 'loggedIn');
    this.app.acl.allow(ROLE_NAMESPACE, ['get', 'set', 'list'], 'loggedIn');
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
