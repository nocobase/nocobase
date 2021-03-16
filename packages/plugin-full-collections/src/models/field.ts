import _ from 'lodash';
import { Model, FieldOptions } from '@nocobase/database';
import BaseModel from './base';
import { interfaces } from '../interfaces';
import has from 'just-has';

export class FieldModel extends BaseModel {

  get(key?: any, options?: any) {
    if (typeof key !== 'string') {
      const data = super.get(key);
      const { interface: interfaceType } = data;
      if (interfaceType && interfaces.has(interfaceType)) {
        const { properties = {} } = interfaces.get(interfaceType);
        Object.keys(properties).forEach(name => {
          if (has(data, name)) {
            const value = _.get(data, name);
            _.set(data, `x-${interfaceType}-props.${name}`, value);
          }
        });
      }
      return data;
    }
    return super.get(key, options);
  }

  async getOptions(): Promise<FieldOptions> {
    return {
      ...this.get(),
    };
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
    const fieldOptions = await this.getOptions();
    console.log({fieldOptions});

    table.addField(fieldOptions);

    return await table.sync({
      force: false,
      alter: {
        drop: false,
      }
    });
  }

}

export default FieldModel;
