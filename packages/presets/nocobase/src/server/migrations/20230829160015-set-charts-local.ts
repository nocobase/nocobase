import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.14.0-alpha.8';
  async up() {
    await this.pm.repository.update({
      values: {
        builtIn: false,
      },
      filter: {
        name: 'charts',
      },
    });
  }
}
