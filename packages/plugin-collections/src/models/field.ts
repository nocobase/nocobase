import _ from 'lodash';
import BaseModel from './base';
import { FieldOptions } from '@nocobase/database';
import * as types from '../interfaces/types';
import { merge } from '../utils';
import { BuildOptions } from 'sequelize';

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
    }
    // @ts-ignore
    super(data, options);
    // console.log(data);
  }

  generateName() {
    this.set('name', generateFieldName());
  }

  generateNameIfNull() {
    if (!this.get('name')) {
      this.generateName();
    }
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
    return {
      ...this.get('options'),
      type: this.get('type'),
      name: this.get('name'),
    };
  }

  async migrate(options: any = {}) {
    const collectionName = this.get('collection_name');
    if (!collectionName) {
      return false;
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
}

export default FieldModel;
