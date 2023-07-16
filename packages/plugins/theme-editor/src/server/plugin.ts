import { defineCollection } from '@nocobase/database';
import { InstallOptions, Plugin } from '@nocobase/server';

export class ThemeEditorPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.db.collection(
      defineCollection({
        name: 'themeConfig',
        fields: [
          // 主题配置内容，一个 JSON 字符串
          {
            type: 'json',
            name: 'config',
          },
          // 主题是否可选
          {
            type: 'boolean',
            name: 'optional',
          },
          {
            type: 'boolean',
            name: 'isBuiltIn',
          },
        ],
      }),
    );

    await this.db.sync();
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ThemeEditorPlugin;
