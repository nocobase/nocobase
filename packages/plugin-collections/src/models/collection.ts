import _ from 'lodash';
import BaseModel from './base';
import Field from './field';
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
  skipExisting?: boolean;
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
    // const prevTable = this.database.getTable(this.get('name'));
    // const prevOptions = prevTable ? prevTable.getOptions() : {};
    // table 是初始化和重新初始化
    const table = this.database.table(options);
    // console.log({options, actions: table.getOptions()['actions']})

    // 如果关系表未加载，一起处理
    // const associationTableNames = [];
    // for (const [key, association] of table.getAssociations()) {
    //   // TODO：是否需要考虑重载的情况？（暂时是跳过处理）
    //   if (!this.database.isDefined(association.options.target)) {
    //     continue;
    //   }
    //   associationTableNames.push(association.options.target);
    // }
    // console.log({associationTableNames});
    // if (associationTableNames.length) {
    //   await CollectionModel.load({
    //     ...opts,
    //     where: {
    //       name: {
    //         [Op.in]: associationTableNames,
    //       }
    //     }
    //   });
    // }
    return table;
  }

  /**
   * 迁移
   */
  async migrate(options: MigrateOptions = {}) {
    const { isNewRecord } = options;
    const table = await this.loadTableOptions(options);
    // 如果不是新增数据，force 必须为 false
    if (!isNewRecord) {
      return await table.sync({
        force: false,
        alter: {
          drop: false,
        }
      });
    }
    // TODO: 暂时加了个 collectionSync 解决 collection.create 的数据不清空问题
    // @ts-ignore
    const sync = this.sequelize.options.collectionSync;
    return await table.sync(sync || {
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
    const options: any = {
      ...this.get(),
      actions: await this.getActions(),
      fields: await this.getFieldsOptions(),
    }
    // @ts-ignore
    // console.log(this.constructor.associations);
    // @ts-ignore
    if (this.constructor.hasAlias('views_v2')) {
      options.views_v2 = await this.getViews_v2();
    }
    return options;
  }

  /**
   * TODO：需要考虑是初次加载还是重载
   *
   * @param options 
   */
  static async load(options: LoadOptions = {}) {
    const { skipExisting = false, reset = false, where = {}, transaction } = options;
    const collections = await this.findAll({
      transaction,
      where,
    });
    for (const collection of collections) {
      if (skipExisting && this.database.isDefined(collection.get('name'))) {
        continue;
      }
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
    let collection: CollectionModel;
    if (data.name) {
      collection = await this.findOne({
        ...options,
        where: {
          name: data.name,
        },
      });
    }
    if (collection) {
      // @ts-ignore
      await collection.update(data, options);
    }
    if (!collection) {
      // @ts-ignore
      collection = await this.create(data, options);
    }

    const associations = ['fields', 'actions', 'views_v2'];
    for (const key of associations) {
      if (!Array.isArray(data[key])) {
        continue;
      }
      const Model = this.database.getModel(key);
      if (!Model) {
        continue;
      }
      let ids = [];
      for (const index in data[key]) {
        if (key === 'fields') {
          ids = await Model.import(data[key], {
            ...options,
            collectionName: collection.name,
          });
          continue;
        }
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
        }
        if (model) {
          await model.update({...item, 
            // sort: index+1
          }, options);
        }
        if (!model) {
          model = await Model.create(
            {
              ...item,
              // sort: index+1,
              collection_name: collection.name,
            },
            // @ts-ignore
            options
          );
        }
        if (model) {
          ids.push(model.id);
        }
      }
      if (ids.length && collection.get('internal')) {
        await collection.updateAssociations({
          [key]: ids,
        });
      }
    }
    return collection;
  }
}

export default CollectionModel;
