import _ from 'lodash';
import BaseModel from './base';
import { FieldOptions } from '@nocobase/database';
import * as types from '../interfaces/types';
import { merge } from '../utils';
import { BuildOptions } from 'sequelize';
import { SaveOptions, Utils } from 'sequelize';
import { generateCollectionName } from './collection';

interface FieldImportOptions extends SaveOptions {
  parentId?: number;
  collectionName?: string;
}

export function generateFieldName(title?: string): string {
  return `f_${Math.random().toString(36).replace('0.', '').slice(-4).padStart(4, '0')}`;
}

export class FieldModel extends BaseModel {

  constructor(values: any = {}, options: any = {}) {
    let data = {
      ...(values.options||{}),
      ...values,
      // ..._.omit(values, 'options'),
    };
    const interfaceType = data.interface;
    if (interfaceType) {
      const { options } = types[interfaceType];
      let args = [options, data];
      // @ts-ignore
      data = merge(...args);
      if (['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(data.type)) {
        if (!data.name) {
          data.name = generateFieldName();
          if (!data.target) {
            data.target  = generateCollectionName();
          }
        }
        if (!data.target) {
          data.target = ['hasOne', 'belongsTo'].includes(data.type) ? Utils.pluralize(data.name) : data.name;
        }
      }
      if (!data.name) {
        data.name = generateFieldName();
      }
    }
    // @ts-ignore
    super(data, options);
  }

  generateName() {
    this.set('name', generateFieldName());
  }

  setInterface(value) {
    const { options } = types[value];
    let args = [];
    // 如果是新数据或 interface 不相等，interface options 放后
    if (this.isNewRecord || this.get('interface') !== value) {
      args = [this.get(), options];
    } else {
      // 已存在的数据更新，不相等，interface options 放前面
      args = [options, this.get()];
    }
    // @ts-ignore
    const values = merge(...args);
    this.set(values);
  }

  async getOptions(): Promise<FieldOptions> {
    return this.get();
  }

  async migrate(options: any = {}) {
    const collectionName = this.get('collection_name');
    if (!collectionName) {
      return false;
    }
    const Collection = this.database.getModel('collections');
    if (this.get('interface') === 'linkTo') {
      // afterCreate 时 target 表不知道为什么丢失了，需要重新加载
      const target = this.get('target');
      if (!this.database.isDefined(target)) {
        await Collection.load({
          ...options,
          where: {
            name: target,
          }
        });
      }
      // const table = this.getTable(target);
      // console.log(model.get('target'), typeof table);
    }
    // 如果 database 未定义，load 出来
    if (!this.database.isDefined(collectionName)) {
      await Collection.load({where: {name: collectionName}});
    }
    const table = this.database.getTable(collectionName);
    table.addField(await this.getOptions());
    await table.sync({
      force: false,
      alter: {
        drop: false,
      }
    });
  }

  static async import(items: any, options: FieldImportOptions = {}): Promise<any> {
    const { parentId, collectionName } = options;
    if (!Array.isArray(items)) {
      items = [items];
    }
    const ids = [];
    for (const index in items) {
      const item = items[index];
      let model;
      const where: any = {};
      if (parentId) {
        where.parent_id = parentId
      } else {
        where.collection_name = collectionName;
      }
      if (item.name) {
        model = await this.findOne({
          ...options,
          where: {
            ...where,
            name: item.name,
          },
        });
      }
      if (!model && item.title) {
        model = await this.findOne({
          ...options,
          where: {
            ...where,
            title: item.title,
          },
        });
      }
      if (!model) {
        const tmp: any = {};
        if (parentId) {
          tmp.parent_id = parentId
        } else {
          tmp.collection_name = collectionName;
        }
        model = await this.create({
          ...item,
          ...tmp,
        }, options);
      }
      if (Array.isArray(item.children)) {
        const childrenIds = await this.import(item.children, {
          ...options,
          parentId: model.id,
          collectionName,
        });
        await model.updateAssociations({
          children: childrenIds,
        }, options);
      }
    }
    return ids;
  }
}

export default FieldModel;
