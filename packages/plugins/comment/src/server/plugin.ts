import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';

export class CommentPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    // 导入 collection
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CommentPlugin;
