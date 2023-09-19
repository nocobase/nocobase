import { Plugin } from '@nocobase/client';
import { LoggerProvider } from './LoggerProvider';

export class PluginLoggerClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.use(LoggerProvider);
  }
}

export default PluginLoggerClient;
