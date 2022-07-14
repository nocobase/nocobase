import { Migration } from '@nocobase/server';

export default class UpdateEnabledLanguagesMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<=0.7.2-alpha.7');
    if (!result) {
      return;
    }
    const SystemSetting = this.context.db.getRepository('systemSettings');
    const setting = await SystemSetting.findOne();
    const enabledLanguages = setting.get('enabledLanguages') || [];
    if (Array.isArray(enabledLanguages) && enabledLanguages.length === 0) {
      setting.set('enabledLanguages', [setting.get('appLang') || 'en-US']);
      await setting.save();
    }
  }
}
