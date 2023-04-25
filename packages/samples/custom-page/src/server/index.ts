import { InstallOptions, Plugin } from '@nocobase/server';

export class CustomPagePlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {}

  async install(options: InstallOptions) {
    // TODO
  }
}

export default CustomPagePlugin;
