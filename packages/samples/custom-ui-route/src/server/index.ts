import { InstallOptions, Plugin } from '@nocobase/server';

export class CustomUIRoutePlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  initialize() {}

  beforeLoad() {
    // TODO
  }

  async load() {}

  async install(options: InstallOptions) {
    // TODO
  }
}

export default CustomUIRoutePlugin;
