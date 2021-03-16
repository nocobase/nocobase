import _ from 'lodash';
import { getDataTypeKey, Model } from '@nocobase/database';
import Dottie from 'dottie';

export class BaseModel extends Model {

  get additionalAttribute() {
    const tableOptions = this.database.getTable(this.constructor.name).getOptions();
    return _.get(tableOptions, 'additionalAttribute') || 'options';
  }

  hasGetAttribute(key: string) {
    const attribute = this.rawAttributes[key];
    // virtual 如果有 get 方法就直接走 get
    if (attribute && attribute.type && getDataTypeKey(attribute.type) === 'VIRTUAL') {
      return !!attribute.get;
    }
    return !!attribute;
  }

  hasSetAttribute(key: string) {
    // @ts-ignore
    if (this.constructor.hasAlias(key)) {
      return false;
    }
    const attribute = this.rawAttributes[key];
    // virtual 如果有 set 方法就直接走 set
    if (attribute && attribute.type && getDataTypeKey(attribute.type) === 'VIRTUAL') {
      return !!attribute.set;
    }
    return !!attribute;
  }

  get(key?: any, options?: any) {
    if (typeof key !== 'string') {
      const data = super.get(key);
      return {
        ..._.omit(data, [this.additionalAttribute]),
        ...(data[this.additionalAttribute]||{}),
      };
    }
    const [column, ...path] = key.split('.');
    if (this.hasGetAttribute(column)) {
      const value = super.get(column, options);
      if (path.length) {
        return _.get(value, path);
      }
      return value;
    }
    return _.get(super.get(this.additionalAttribute, options) || {}, key);
  }

  set(key?: any, value?: any, options: any = {}) {
    if (typeof key !== 'string') {
      return super.set(key, value, options);
    }
    // @ts-ignore
    if (this.constructor.hasAlias(key)) {
      return this;
    }
    const [column] = key.split('.');
    if (this.hasSetAttribute(column)) {
      return super.set(key, value, options);
    }
    return super.set(`${this.additionalAttribute}.${key}`, value, options);
  }

  // getDataValue(key: any) {
  //   return super.getDataValue(key);
  // }

  // setDataValue(key: any, value: any) {
  //   return super.setDataValue(key, value);
  // }
}

export default BaseModel;
