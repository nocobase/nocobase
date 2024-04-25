import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.21.0-alpha.15';

  async up() {
    const names = {
      '@nocobase/plugin-collection-manager': '@nocobase/plugin-data-source-main',
    };
    for (const original of Object.keys(names)) {
      await this.pm.repository.update({
        filter: {
          packageName: original,
        },
        values: {
          name: names[original].replace('@nocobase/plugin-', ''),
          packageName: names[original],
        },
      });
    }
  }
}
