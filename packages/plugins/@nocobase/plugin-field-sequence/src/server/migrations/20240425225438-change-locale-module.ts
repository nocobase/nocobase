import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.0.0-alpha.1';

  async up() {
    const repo = this.db.getRepository('localizationTexts');
    if (!repo) {
      return;
    }
    await repo.update({
      filter: {
        module: 'resources.sequence-field',
      },
      values: {
        module: 'resources.field-sequence',
      },
    });
  }
}
