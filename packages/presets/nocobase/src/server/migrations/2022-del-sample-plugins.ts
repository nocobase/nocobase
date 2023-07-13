import { Migration } from '@nocobase/server';

export default class DelSamplePluginMigration extends Migration {
  async up() {
    const r1 = await this.app.version.satisfies('>=0.8.0-alpha.1');
    const r2 = await this.app.version.satisfies('<=0.8.0-alpha.6');
    if (r1 && r2) {
      const repository = this.context.db.getRepository('applicationPlugins');
      await repository.destroy({
        filter: {
          'name.$in': [
            'sample-command',
            'sample-shop-modeling',
            'sample-hello',
            'sample-shop-events',
            'sample-shop-i18n',
            'sample-shop-actions',
            'sample-ratelimit',
            'sample-custom-signup-page',
            'sample-custom-block',
            'sample-custom-page',
          ],
        },
      });
    }
  }
}
