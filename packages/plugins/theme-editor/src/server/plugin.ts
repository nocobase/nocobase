import { InstallOptions, Plugin } from '@nocobase/server';

export class ThemeEditorPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.db.collection({
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
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ThemeEditorPlugin;
