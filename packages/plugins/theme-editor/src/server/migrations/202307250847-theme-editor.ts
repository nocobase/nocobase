import { Migration } from '@nocobase/server';
import { antd, compact, compactDark, dark } from '../builtinThemes';

export default class ThemeEditorMigration extends Migration {
  async up() {
    const theme = this.db.getCollection('themeConfig');
    if (theme) {
      await theme.repository.create({
        values: [antd, dark, compact, compactDark],
      });
    }
  }

  async down() {}
}
