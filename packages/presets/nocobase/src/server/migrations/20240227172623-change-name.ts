import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.19.0-alpha.10';

  async up() {
    await this.pm.repository.update({
      filter: {
        packageName: '@nocobase/plugin-workflow-form-trigger',
      },
      values: {
        name: 'workflow-action-trigger',
        packageName: '@nocobase/plugin-workflow-action-trigger',
      },
    });
  }
}
