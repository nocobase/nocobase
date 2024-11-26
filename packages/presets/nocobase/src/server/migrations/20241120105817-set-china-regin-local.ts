import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  // appVersion = '<1.3.52';

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
