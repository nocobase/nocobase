import _ from 'lodash';
import BaseModel from './base';
import { TableOptions } from '@nocobase/database';
import { SaveOptions } from 'sequelize';

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
export function generateCollectionName(title?: string): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).replace('0.', '').slice(-4).padStart(4, '0')}`;
}

export class CollectionModel extends BaseModel {

  generateName() {
    this.set('name', generateCollectionName());
  }

  generateNameIfNull() {
    if (!this.get('name')) {
      this.generateName();
    }
  }

  /**
   * 通过 name 获取 collection
   *
   * @param name 
   */
  static async findByName(name: string) {
    return this.findOne({ where: { name } });
  }

  async loadTableOptions() {
    const options = await this.getOptions();
    const prevTable = this.database.getTable(this.get('name'));
    const prevOptions = prevTable ? prevTable.getOptions() : {};
    // table 是初始化和重新初始化
    return this.database.table({...prevOptions, ...options});
  }

  /**
   * 迁移
   */
  async migrate() {
    const table = await this.loadTableOptions();
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

  static async load() {
    const collections = await this.findAll();
    for (const collection of collections) {
      await collection.loadTableOptions();
    }
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
    }
    await collection.updateAssociations(items, options);
    return collection;
  }
}

export default CollectionModel;
