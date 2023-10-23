import { Migration } from '@nocobase/server';
import { antd, compact, compactDark, dark } from '../builtinThemes';

export default class ThemeEditorMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<=0.14.0-alpha.7');

    if (!result) {
      return;
    }

    const theme = this.db.getCollection('themeConfig');
    if (!theme) {
      return;
    }

    if (
      !(await theme.repository.find({
        filter: {
          uid: 'default',
        },
      }))
    ) {
      await theme.repository.create({
        values: [antd],
      });
    }

    if (
      !(await theme.repository.find({
        filter: {
          uid: 'dark',
        },
      }))
    ) {
      await theme.repository.create({
        values: [dark],
      });
    }

    if (
      !(await theme.repository.find({
        filter: {
          uid: 'compact',
        },
      }))
    ) {
      await theme.repository.create({
        values: [compact],
      });
    }

    if (
      !(await theme.repository.find({
        filter: {
          uid: 'compactDark',
        },
      }))
    ) {
      await theme.repository.create({
        values: [compactDark],
      });
    }
  }

  async down() {}
}
