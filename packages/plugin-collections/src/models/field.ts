import { DataTypes } from 'sequelize';
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

  set(key: any, value: any, options?: any) {
    if (typeof key === 'string') {
      const opts = this.get('options') || {};
      const attribute = this.rawAttributes[key];

      if (attribute) {
        if (key === 'options') {
          Object.assign(opts, value);
        } else if (attribute.type instanceof DataTypes.VIRTUAL) {
          // TODO: 如何处理虚拟字段
          return this;
        } else {
          super.set(key, value, options);
          return this;
        }
      } else {
        opts[key] = value;
      }
      super.set('options', opts, options);
      return this;
    }

    super.set(key, value, options);
    return this;
  }
}

export default FieldModel;
