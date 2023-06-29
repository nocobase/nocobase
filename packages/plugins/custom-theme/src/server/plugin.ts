import { defineCollection } from '@nocobase/database';
import { InstallOptions, Plugin } from '@nocobase/server';
import { compactTheme, darkTheme, defaultTheme } from './builtInThemes';

export class CustomThemePlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    const theme = this.db.collection(
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
    await theme.repository.create({
      values: [
        { config: defaultTheme, optional: true, isBuiltIn: true },
        { config: compactTheme, optional: true, isBuiltIn: true },
        { config: darkTheme, optional: true, isBuiltIn: true },
      ],
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CustomThemePlugin;
