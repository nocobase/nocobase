import { InstallOptions, Plugin } from '@nocobase/server';

export class CustomSchemaScopePlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  beforeLoad() {
    // TODO
  }

  async load() {}

  async install(options: InstallOptions) {
    // TODO
  }
}

export default CustomSchemaScopePlugin;
