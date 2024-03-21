import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.19.0-alpha.4';

  async up() {
    await this.pm.repository.destroy({
      filter: {
        name: ['sample-hello'],
      },
    });
  }
}
