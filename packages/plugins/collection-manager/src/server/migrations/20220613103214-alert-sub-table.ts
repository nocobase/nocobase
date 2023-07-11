import { Migration } from '@nocobase/server';

export default class AlertSubTableMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<=0.7.0-alpha.83');
    if (!result) {
      return;
    }
    const Field = this.context.db.getRepository('fields');
    const fields = await Field.find();
    for (const field of fields) {
      if (field.get('interface') === 'subTable') {
        field.set('interface', 'o2m');
        await field.save();
      }
    }
  }
}
