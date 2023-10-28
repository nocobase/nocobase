import { Model } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import _ from 'lodash';
import { compact, compactDark, dark, defaultTheme } from '../builtinThemes';

export default class ThemeEditorMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<0.14.0-alpha.8');

    if (!result) {
      return;
    }

    const repository = this.db.getRepository('themeConfig');
    if (!repository) {
      return;
    }

    this.db.getCollection('themeConfig').sync();

    const themes = { default: defaultTheme, dark, compact, compact_dark: compactDark };
    const items: Model[] = await repository.find();

    for (const item of items) {
      const config = item.get('config');
      if (config.name === 'Default theme of antd') {
        config.name = 'Default';
        item.set('config', config);
        item.changed('config', true);
      }
      if (!item.uid) {
        item.set('uid', _.snakeCase(config.name));
      }
      if (themes[item.uid]) {
        delete themes[item.uid];
      }
      await item.save();
    }

    if (Object.values(themes).length > 0) {
      await repository.create({ values: Object.values(themes) });
    }
  }

  async down() {}
}
