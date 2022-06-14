import { Migration } from '@nocobase/database';

export default class AlertSubTableMigration extends Migration {
  versionRange = '<=0.7.0-alpha.83';

  async up() {
    const repository = this.context.db.getRepository('fields');
    const fields = await repository.find();
    for (const field of fields) {
      if (field.get('interface') === 'subTable') {
        field.set('interface', 'o2m');
        await field.save();
      }
    }
  }
}
