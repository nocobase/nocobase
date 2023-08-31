import { Migration } from '@nocobase/server';

export default class SetAuditPluginAsLocalMigration extends Migration {
  async up() {
    const version = await this.app.version.satisfies('<=0.13.0-alpha.5');
    if (!version) {
      return;
    }
    const repository = this.context.db.getRepository('applicationPlugins');
    const audit = await repository.findOne({
      filter: {
        name: 'audit-logs',
        builtIn: true,
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
        name: 'audit-logs',
      },
    });
  }
}
