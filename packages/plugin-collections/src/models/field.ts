import { FieldOptions, Model } from '@nocobase/database';

export class FieldModel extends Model {
  async getOptions(): Promise<FieldOptions> {
    return {
      type: this.get('type'),
      name: this.get('name'),
      ...this.get('options'),
    };
  }

  async migrate() {
    const table = this.database.getTable(this.get('collection_name'));
    table.addField(await this.getOptions());
    await table.sync({
      force: false,
      alter: {
        drop: false,
      }
    });
  }
}

export default FieldModel;
