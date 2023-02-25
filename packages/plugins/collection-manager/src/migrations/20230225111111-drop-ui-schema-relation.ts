import { Migration } from '@nocobase/server';
import { FieldModel } from '../models';

export default class extends Migration {
  async up() {
    const fieldRecords: Array<FieldModel> = await this.db.getRepository('fields').find();

    for (const fieldRecord of fieldRecords) {
      const fieldKey = fieldRecord.get('key');
    }
  }
}
