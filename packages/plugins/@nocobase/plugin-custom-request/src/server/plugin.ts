import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { send } from './actions/send';
import { listByCurrentRole } from './actions/listByCurrentRole';

export class CustomRequestPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    await this.db.import({
      directory: resolve(__dirname, './collections'),
    });

    this.app.resource({
      name: 'customRequests',
      actions: {
        send,
        listByCurrentRole,
      },
    });

    this.app.acl.registerSnippet({
      name: `ui.${this.name}`,
      actions: ['customRequests:*'],
    });

    this.app.acl.allow('customRequests', ['send', 'listByCurrentRole'], 'loggedIn');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CustomRequestPlugin;
