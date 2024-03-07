import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.20.0-alpha.6';

  async up() {
    await this.pm.repository.update({
      values: {
        builtIn: false,
      },
      filter: {
        name: 'sms-auth',
      },
    });
  }
}
