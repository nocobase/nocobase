import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';

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
        send() {},
      },
    });

    // this.app.acl.registerSnippet({
    //   name: `pm.${this.name}.configuration`,
    //   actions: ['map-configuration:send'],
    // });

    this.app.acl.allow('customRequests', 'send', 'loggedIn');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CustomRequestPlugin;
