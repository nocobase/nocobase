import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    await this.app.db.getRepository('roles').update({
      filter: {
        $or: [{ allowConfigure: true }, { name: 'root' }],
      },
      values: {
        snippets: ['ui.*', 'pm', 'pm.*'],
        allowConfigure: false,
      },
    });
  }

  async down() {}
}
