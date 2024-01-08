import { Migration } from '@nocobase/server';

export default class UpdateUserNameInterfaceMigration extends Migration {
  appVersion = '<0.13.0-alpha.10';

  async up() {
    const match = await this.app.version.satisfies('<=0.13.0-alpha.8');
    if (!match) {
      return;
    }
    const Field = this.context.db.getRepository('fields');
    const field = await Field.findOne({
      filter: {
        name: 'username',
        collectionName: 'users',
        interface: 'username',
      },
    });
    if (!field) {
      return;
    }
    await field.update({ interface: 'input' });
  }

  async down() {}
}
