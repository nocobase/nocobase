import { Model } from '@nocobase/database';
import { TableOptions } from '@nocobase/database';
import { SaveOptions } from 'sequelize';

export class CollectionModel extends Model {

  /**
   * 通过 name 获取 collection
   *
   * @param name 
   */
  static async findByName(name: string) {
    return this.findOne({ where: { name } });
  }

  /**
   * 迁移
   */
  async migrate() {
    const options = await this.getOptions();
    const tableOptions = this.database.getTable(this.get('name'));
    const table = this.database.table({...tableOptions, ...options});
    return await table.sync({
      force: false,
      alter: {
        drop: false,
      }
    });
  }

  async getFieldsOptions() {
    const fieldsOptions = [];
    const fields = await this.getFields();
    for (const field of fields) {
      fieldsOptions.push(await field.getOptions());
    }
    return fieldsOptions;
  }

  async getOptions(): Promise<TableOptions> {
    return {
      name: this.get('name'),
      title: this.get('title'),
      ...this.get('options'),
      fields: await this.getFieldsOptions(),
    };
  }

  static async import(data: TableOptions, options: SaveOptions = {}): Promise<CollectionModel> {
    const collection = await this.create(data, options);
    const items: any = {};
    const associations = ['fields', 'tabs', 'actions', 'views'];
    for (const key of associations) {
      if (!Array.isArray(data[key])) {
        continue;
      }
      items[key] = data[key].map((item, sort) => ({
        ...item,
        options: item,
        sort,
      }));
    }
    await collection.updateAssociations(items, options);
    return collection;
  }
}

export default CollectionModel;
