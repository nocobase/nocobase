import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.18.0-alpha.10';

  async up() {
    await this.pm.repository.update({
      values: {
        name: 'backup-restore',
        packageName: '@nocobase/plugin-backup-restore',
      },
      filter: {
        name: 'duplicator',
      },
    });
  }
}
