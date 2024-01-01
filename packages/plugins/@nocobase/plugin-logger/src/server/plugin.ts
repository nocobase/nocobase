import { InstallOptions, Plugin } from '@nocobase/server';
import logger from './resourcer/logger';

export class PluginLoggerServer extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.app.resource(logger);
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.logger`,
      actions: ['logger:*'],
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginLoggerServer;
