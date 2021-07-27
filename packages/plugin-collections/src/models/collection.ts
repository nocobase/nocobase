import _ from 'lodash';
import { Model, TableOptions } from '@nocobase/database';

export interface LoadOptions {
  reset?: boolean;
  where?: any;
  skipExisting?: boolean;
  [key: string]: any;
}

export interface MigrateOptions {
  [key: string]: any;
}

export class Collection extends Model {
  static async create(value?: any, options?: any): Promise<any> {
    // console.log({ value });
    const attributes = this.toAttributes(value);
    // @ts-ignore
    const model: Model = await super.create(attributes, options);
    return model;
  }

  static toAttributes(value = {}): any {
    const data = _.cloneDeep(value);
    const keys = [
      ...Object.keys(this.rawAttributes),
      ...Object.keys(this.associations),
    ];
    const attrs = _.pick(data, keys);
    const options = _.omit(data, keys);
    return { ...attrs, options };
  }

  async toProps() {
    const json = this.toJSON();
    const data: any = _.omit(json, ['options', 'created_at', 'updated_at']);
    const options = json['options'] || {};
    const fields = await this.getNestedFields();
    return { ...data, ...options, fields }
  }

  async getNestedFields() {
    const fields = await this.getFields({
      order: [['sort', 'asc']],
    });
    const items = [];
    for (const field of fields) {
      items.push(await field.toProps());
    }
    return items;
  }

  /**
   * DOTO：
   * - database.table 初始化可能存在一些缺陷
   * - 是否需要考虑关系数据的重载？
   *
   * @param opts 
   */
  async loadTableOptions(opts: any = {}) {
    const options = await this.toProps();
    // console.log(JSON.stringify(options, null, 2));
    const table = this.database.table(options);
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
}
