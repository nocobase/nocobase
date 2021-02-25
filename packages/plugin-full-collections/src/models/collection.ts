import _ from 'lodash';
import { Model, Table, TableOptions } from '@nocobase/database';
import { SaveOptions, Op } from 'sequelize';
import BaseModel from './base';

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

  async getOptions(): Promise<TableOptions> {
    return {
      ...this.get(),
    };
  }

  async loadTableOptions(opts: any = {}): Promise<Table> {
    const options = await this.getOptions();
    const table = this.database.table(options);
    return table;
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
