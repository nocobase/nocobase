import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.0.0-alpha.1';

  async up() {
    await this.pm.repository.update({
      filter: {
        name: 'iframe-block',
      },
      values: {
        packageName: '@nocobase/plugin-block-iframe',
        name: 'block-iframe',
      },
    });
  }
}
