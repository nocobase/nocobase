import { Migration } from '@nocobase/server';

export default class AddUserNameMigration extends Migration {
  async up() {
    const match = await this.app.version.satisfies('<=0.12.0-alpha.4');
    if (!match) {
      return;
    }
    const Field = this.context.db.getRepository('fields');
    const existed = await Field.count({
      filter: {
        name: 'username',
        collectionName: 'users',
      },
    });
    if (!existed) {
      await Field.create({
        values: {
          name: 'username',
          collectionName: 'users',
          type: 'string',
          unique: true,
          interface: 'input',
          uiSchema: {
            type: 'string',
            title: '{{t("Username")}}',
            'x-component': 'Input',
            'x-validator': { username: true },
            required: true,
          },
        },
        // NOTE: to trigger hook
        context: {},
      });
    }
  }

  async down() {}
}
