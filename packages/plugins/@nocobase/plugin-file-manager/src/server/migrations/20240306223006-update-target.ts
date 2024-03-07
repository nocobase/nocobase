import { Model, Repository } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.20.0-alpha.6';

  async up() {
    const r = this.db.getRepository<Repository>('fields');
    const fields: Model[] = await r.find({
      filter: {
        interface: 'attachment',
      },
    });
    for (const field of fields) {
      const options = field.get('options');
      if (options.target !== 'attachments') {
        options.target = 'attachments';
        field.set('options', options);
        field.changed('options', true);
        await field.save();
      }
    }
  }
}
