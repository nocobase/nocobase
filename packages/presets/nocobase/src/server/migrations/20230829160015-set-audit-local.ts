import { Migration } from '@nocobase/server';

export default class SetAuditPluginAsLocalMigration extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.13.0-alpha.5';
  async up() {
    await this.pm.repository.update({
      values: {
        builtIn: false,
      },
      filter: {
        name: 'audit-logs',
      },
    });
  }
}
