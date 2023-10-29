import { Migration } from '@nocobase/server';

export default class SetAuditPluginAsLocalMigration extends Migration {
  async up() {
    const version = await this.app.version.satisfies('<=0.14.0-alpha.8');
    if (!version) {
      return;
    }
    const repository = this.context.db.getRepository('applicationPlugins');
    const audit = await repository.findOne({
      filter: {
        name: 'charts',
      },
    });
    if (!audit) {
      return;
    }
    await repository.update({
      values: {
        builtIn: false,
      },
      filter: {
        name: 'charts',
      },
    });
  }
}
