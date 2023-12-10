import { Migration } from '@nocobase/server';

export default class ThemeEditorMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<0.17.0-alpha.5');

    if (!result) {
      return;
    }

    const repository = this.db.getRepository('themeConfig');
    if (!repository) {
      return;
    }

    await this.db.sync();

    const systemSettings = await this.db.getRepository('systemSettings').findOne();
    const defaultThemeId = systemSettings.options?.themeId;
    if (!defaultThemeId) {
      return;
    }

    await repository.update({
      values: {
        default: true,
      },
      filterByTk: defaultThemeId,
    });
    return;
  }

  async down() {}
}
