import _ from 'lodash';
import BaseModel from './base';
import { FieldOptions } from '@nocobase/database';
import * as types from '../interfaces/types';
import { Utils } from 'sequelize';

export function generateFieldName(title?: string): string {
  return `f_${Math.random().toString(36).replace('0.', '').slice(-4).padStart(4, '0')}`;
}

export class FieldModel extends BaseModel {

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
    // @ts-ignore
    const values = Utils.merge(options, this.get());
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
