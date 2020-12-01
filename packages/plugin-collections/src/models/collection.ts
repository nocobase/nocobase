import _ from 'lodash';
import BaseModel from './base';
import { TableOptions } from '@nocobase/database';
import { SaveOptions, Utils } from 'sequelize';

export class CollectionModel extends BaseModel {

  /**
   * 通过 name 获取 collection
   *
   * @param name 
   */
  static async findByName(name: string) {
    return this.findOne({ where: { name } });
  }

  /**
   * 生成随机数据库表名
   * 
   * 策略：暂时使用  3+2
   *   1. 自增 id
   *   2. 随机字母
   *   3. 时间戳
   *   4. 转拼音
   *   5. 常见词翻译
   * 
   * @param title 显示的名称
   */
  static generateName(title?: string): string {
    return `t_${Date.now().toString(36)}_${Math.random().toString(36).replace('0.', '').slice(-4).padStart(4, '0')}`;
  }

  /**
   * 迁移
   */
  async migrate() {
    const options = await this.getOptions();
    const prevTable = this.database.getTable(this.get('name'));
    const prevOptions = prevTable ? prevTable.getOptions() : {};
    // table 是初始化和重新初始化
    const table = this.database.table({...prevOptions, ...options});
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
      ...this.get('options'),
      name: this.get('name'),
      title: this.get('title'),
      fields: await this.getFieldsOptions(),
    };
  }

  static async import(data: TableOptions, options: SaveOptions = {}): Promise<CollectionModel> {
    data = _.cloneDeep(data);
    const collection = await this.create({
      ...data,
    }, options);
    const items: any = {};
    const associations = ['fields', 'tabs', 'actions', 'views'];
    for (const key of associations) {
      if (!Array.isArray(data[key])) {
        continue;
      }
      items[key] = data[key].map((item, sort) => ({
        ...item,
        sort,
      }));
      for (const item of items[key]) {
        await collection[`create${_.upperFirst(Utils.singularize(key))}`](item);
      }
    }
    // updateAssociations 有 BUG
    // await collection.updateAssociations(items, options);
    return collection;
  }
}

export default CollectionModel;
