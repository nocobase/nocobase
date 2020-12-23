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
        // 关系字段如果没有 name，相关参数都随机生成
        if (!data.name) {
          data.name = generateFieldName();
          // 通用，关系表
          if (!data.target) {
            data.target  = generateCollectionName();
          }
          // 通用，外键
          if (!data.foreignKey) {
            data.foreignKey = generateFieldName();
          }
          if (data.type !== 'belongsTo' && !data.sourceKey) {
            data.sourceKey = 'id';
          }
          if (['belongsTo', 'belongsToMany'].includes(data.type) && !data.targetKey) {
            data.targetKey = 'id';
          }
          // 多对多关联
          if (data.type === 'belongsToMany') {
            if (!data.through) {
              data.through = generateCollectionName();
            }
            if (!data.otherKey) {
              data.otherKey = generateFieldName();
            }
          }
        }
        // 有 name，但是没有 target
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
    if (!this.database.isDefined(collectionName)) {
      throw new Error(`${collectionName} is not defined`);
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
