import { InstallOptions, Plugin } from '@nocobase/server';
import { antd, compact, compactDark, dark } from './builtinThemes';

export class ThemeEditorPlugin extends Plugin {
  theme: any;

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
    this.app.acl.allow('themeConfig', 'list', 'loggedIn');
  }

  async install(options?: InstallOptions) {
    const themeRepo = this.db.getRepository('themeConfig');

    if (!themeRepo) {
      throw new Error(`themeConfig repository does not exist`);
    }

    if ((await themeRepo.count()) === 0) {
      await themeRepo.create({
        values: [antd, dark, compact, compactDark],
      });
    }
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ThemeEditorPlugin;
