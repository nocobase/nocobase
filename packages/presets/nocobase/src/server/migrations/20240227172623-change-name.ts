import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.20.0-alpha.6';

  async up() {
    await this.pm.repository.destroy({
      filter: {
        packageName: '@nocobase/plugin-workflow-form-trigger',
      },
    });
  }
}
