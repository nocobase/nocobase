import { Migration } from '../migration';

export default class extends Migration {
  on = 'afterSync'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.18.0-alpha.10';

  async up() {
    await this.pm.repository.update({
      values: {
        installed: true,
      },
      filter: {
        enabled: true,
      },
    });
  }
}
