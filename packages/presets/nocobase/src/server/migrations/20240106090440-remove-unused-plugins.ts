import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.18.0-alpha.10';

  async up() {
    await this.pm.repository.destroy({
      filter: {
        name: ['ui-routes-storage', 'math-formula-field', 'excel-formula-field'],
      },
    });
  }
}
