import { Plugin } from '@nocobase/client';

export class DemoPlugin extends Plugin {
  static pluginName = 'demo';

  // You can get and modify the app instance here
  async load() {
    console.log(this.app);
  }
}

export default DemoPlugin;
