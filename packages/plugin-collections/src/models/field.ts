import { FieldOptions, Model } from '@nocobase/database';

export class FieldModel extends Model {
  static generateName(title?: string): string {
    return `f_${Math.random().toString(36).replace('0.', '').slice(-4).padStart(4, '0')}`;
  }

  async getOptions(): Promise<FieldOptions> {
    return {
      ...this.get('options'),
      type: this.get('type'),
      name: this.get('name'),
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
