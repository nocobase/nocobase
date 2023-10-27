import { Migration } from '@nocobase/server';
import { compact, compactDark, dark, defaultTheme } from '../builtinThemes';

export default class ThemeEditorMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<0.14.0-alpha.8');

    if (!result) {
      return;
    }

    const themeRepo = this.db.getRepository('themeConfig');
    if (!themeRepo) {
      return;
    }

    themeRepo.collection.addField('uid', {
      type: 'uid',
    });
    await this.db.sync();

    const themes = [defaultTheme, dark, compact, compactDark];
    const updates = [];
    const creates = [];

    for (const theme of themes) {
      const { uid } = theme;
      const { name } = theme.config;
      const filter = { 'config.name': name === 'Default' ? 'Default theme of antd' : name };
      const values = name === 'Default' ? { uid, config: { name } } : { uid };
      const existingTheme = await themeRepo.findOne({ filter });

      if (existingTheme) {
        updates.push(themeRepo.update({ filter, values }));
      } else {
        creates.push(themeRepo.create({ values: [theme] }));
      }
    }

    await Promise.all(updates);
    await Promise.all(creates);
  }

  async down() {}
}
