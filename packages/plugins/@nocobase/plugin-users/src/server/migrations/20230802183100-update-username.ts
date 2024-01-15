import { Migration } from '@nocobase/server';

export default class UpdateUserNameMigration extends Migration {
  appVersion = '<0.13.0-alpha.1';
  async up() {
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
