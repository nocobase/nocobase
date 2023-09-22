import { Migration } from '@nocobase/server';

export default class UpdateUserNameMigration extends Migration {
  async up() {
    const match = await this.app.version.satisfies('<=0.12.0-alpha.4');
    if (!match) {
      return;
    }
    const repo = this.context.db.getRepository('users');
    const user = await repo.findOne({
      filter: {
        email: 'admin@nocobase.com',
        username: null,
      },
    });
    if (user) {
      await repo.update({
        values: {
          username: process.env.INIT_ROOT_USERNAME || 'nocobase',
        },
        filter: {
          id: user.id,
        },
      });
    }
  }

  async down() {}
}
