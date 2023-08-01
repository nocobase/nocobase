import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { antd, compact, compactDark, dark } from './builtinThemes';

export class ThemeEditorPlugin extends Plugin {
  theme: any;

  afterAdd() {}

  beforeLoad() {
    this.db.addMigrations({
      namespace: 'theme-editor',
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });
  }

  async load() {
    this.theme = this.db.collection({
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

  async install(options?: InstallOptions) {
    if ((await this.theme.repository.count()) === 0) {
      await this.theme.repository.create({
        values: [antd, dark, compact, compactDark],
      });
    }
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ThemeEditorPlugin;
