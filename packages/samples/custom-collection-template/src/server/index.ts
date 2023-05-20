import type { InstallOptions} from '@nocobase/server';
import { Plugin } from '@nocobase/server';

export class CustomCollectionTemplatePlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {}

  async install(options: InstallOptions) {
    // TODO
  }
}

export default CustomCollectionTemplatePlugin;
