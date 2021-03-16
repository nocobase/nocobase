import _ from 'lodash';
import { Model, Table, TableOptions } from '@nocobase/database';
import { SaveOptions, Op } from 'sequelize';
import BaseModel from './base';

export interface LoadOptions {
  reset?: boolean;
  where?: any;
  skipExisting?: boolean;
  [key: string]: any;
}

export class CollectionModel extends BaseModel {

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
      ...this.get(),
      fields: await this.getFieldsOptions(),
    };
  }

  async loadTableOptions(opts: any = {}): Promise<Table> {
    const options = await this.getOptions();
    const table = this.database.table(options);
    return table;
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
    let collection: CollectionModel;

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

    if (collection) {
      await collection.update(data, options);
    } else {
      collection = await this.create(data, options);
    }

    await collection.updateAssociations(data, options);

    return collection;
  }
}

export default CollectionModel;
