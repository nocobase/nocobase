import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<0.9.3-alpha.1');

    if (!result) {
      return;
    }

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
