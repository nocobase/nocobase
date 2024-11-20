import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.4.1-beta.1';

  async up() {
    await this.pm.repository.update({
      values: {
        builtIn: false,
      },
      filter: {
        name: 'field-china-region',
      },
    });
  }
}
