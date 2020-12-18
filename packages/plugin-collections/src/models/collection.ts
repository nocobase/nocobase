import _ from 'lodash';
import BaseModel from './base';
import { TableOptions } from '@nocobase/database';
import { SaveOptions, Op } from 'sequelize';

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

export interface LoadOptions {
  reset?: boolean;
  where?: any;
  [key: string]: any;
}

export interface MigrateOptions {
  [key: string]: any;
}

export class CollectionModel extends BaseModel {

  generateName() {
    this.set('name', generateCollectionName());
  }

  /**
   * 通过 name 获取 collection
   *
   * @param name 
   */
  static async findByName(name: string) {
    return this.findOne({ where: { name } });
  }

  /**
   * DOTO：
   * - database.table 初始化可能存在一些缺陷
   * - 是否需要考虑关系数据的重载？
   *
   * @param opts 
   */
  async loadTableOptions(opts: any = {}) {
    const options = await this.getOptions();
    const prevTable = this.database.getTable(this.get('name'));
    const prevOptions = prevTable ? prevTable.getOptions() : {};
    // table 是初始化和重新初始化
    const table = this.database.table({...prevOptions, ...options});
    // 如果关系表未加载，一起处理
    const associationTableNames = [];
    for (const [key, association] of table.getAssociations()) {
      // TODO：是否需要考虑重载的情况？（暂时是跳过处理）
      if (!this.database.isDefined(association.options.target)) {
        continue;
      }
      associationTableNames.push(association.options.target);
    }
    if (associationTableNames.length) {
      await CollectionModel.load({
        ...opts,
        where: {
          name: {
            [Op.in]: associationTableNames,
          }
        }
      });
    }
    return table;
  }

  /**
   * 迁移
   */
  async migrate(options: MigrateOptions = {}) {
    const table = await this.loadTableOptions(options);
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
      ...this.get(),
      fields: await this.getFieldsOptions(),
    };
  }

  /**
   * TODO：需要考虑是初次加载还是重载
   *
   * @param options 
   */
  static async load(options: LoadOptions = {}) {
    const { reset = false, where = {}, transaction } = options;
    const collections = await this.findAll({
      transaction,
      where,
    });
    for (const collection of collections) {
      await collection.loadTableOptions({
        transaction,
        reset,
      });
    }
  }

  static async import(data: TableOptions, options: SaveOptions = {}): Promise<CollectionModel> {
    data = _.cloneDeep(data);
    // @ts-ignore
    const { update } = options;
    let collection;
    if (data.name) {
      collection = await this.findOne({
        ...options,
        where: {
          name: data.name,
        },
      });
    } else if (data.title) {
      collection = await this.findOne({
        ...options,
        where: {
          title: data.title,
        },
      });
    }
    if (collection && update) {
      await collection.update(data, options);
    }
    if (!collection) {
      collection = await this.create(data, options);
    }
    const associations = ['fields', 'tabs', 'actions', 'views'];
    for (const key of associations) {
      if (!Array.isArray(data[key])) {
        continue;
      }
      const Model = this.database.getModel(key);
      for (const index in data[key]) {
        let model;
        const item = data[key][index];
        if (item.name) {
          model = await Model.findOne({
            ...options,
            where: {
              collection_name: collection.name,
              name: item.name,
            },
          });
        } else if (item.title) {
          model = await Model.findOne({
            ...options,
            where: {
              collection_name: collection.name,
              title: item.title,
            },
          });
        }
        if (model && update) {
          await model.update({...item, sort: index+1}, options);
        }
        if (!model) {
          model = await Model.create({
            ...item,
            sort: index+1,
            collection_name: collection.name,
          }, options);
        }
      }
    }
    return collection;
  }
}

export default CollectionModel;
