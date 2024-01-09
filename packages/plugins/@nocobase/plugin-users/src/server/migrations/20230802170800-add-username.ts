import { Migration } from '@nocobase/server';

export default class AddUserNameMigration extends Migration {
  appVersion = '<0.13.0-alpha.1';
  async up() {
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
      });
    }
  }
}
