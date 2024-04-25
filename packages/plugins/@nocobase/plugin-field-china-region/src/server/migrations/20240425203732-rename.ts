import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.0.0-alpha.1';

  async up() {
    await this.pm.repository.update({
      filter: {
        packageName: '@nocobase/plugin-china-region',
      },
      values: {
        packageName: '@nocobase/plugin-field-china-region',
        name: 'field-china-region',
      },
    });
  }
}
