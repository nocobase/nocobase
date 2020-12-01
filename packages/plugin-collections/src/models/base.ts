import _ from 'lodash';
import { getDataTypeKey, Model } from '@nocobase/database';

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
    const attribute = this.rawAttributes[key];
    // virtual 如果有 set 方法就直接走 set
    if (attribute && attribute.type && getDataTypeKey(attribute.type) === 'VIRTUAL') {
      return !!attribute.set;
    }
    return !!attribute;
  }

  get(key?: any, options?: any) {
    if (typeof key === 'string') {
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
    const data = super.get();
    return {
      ...(data[this.additionalAttribute]||{}),
      ..._.omit(data, [this.additionalAttribute]),
    };
  }

  getDataValue(key: any) {
    const [column, ...path] = key.split('.');
    if (this.hasGetAttribute(column)) {
      const value = super.getDataValue(column);
      if (path.length) {
        return _.get(value, path);
      }
      return value;
    }
    const options = super.getDataValue(this.additionalAttribute) || {};
    return _.get(options, key);
  }

  set(key?: any, value?: any, options?: any) {
    if (typeof key === 'string') {
      // 不处理关系数据
    // @ts-ignore
      if (_.get(this.constructor.associations, key)) {
        return this;
      }
      // 如果是 object 数据，merge 处理
      if (_.isPlainObject(value)) {
        value = _.merge(this.get(key)||{}, value);
      }
      const [column, ...path] = key.split('.');
      this.changed(column, true);
      if (this.hasSetAttribute(column)) {
        if (!path.length) {
          return super.set(key, value, options);
        }
        const values = this.get(column, options) || {};
        _.set(values, path, value);
        return super.set(column, values, options);
      }
      // 如果未设置 attribute，存到 additionalAttribute 里
      const opts = this.get(this.additionalAttribute, options) || {};
      _.set(opts, key, value);
      this.changed(this.additionalAttribute, true);
      return super.set(this.additionalAttribute, opts, options);
    }
    return super.set(key, value, options);
  }

  setDataValue(key: any, value: any) {
    // 不处理关系数据
    // @ts-ignore
    if (_.get(this.constructor.associations, key)) {
      return this;
    }
    if (_.isPlainObject(value)) {
      value = _.merge(this.get(key)||{}, value);
    }
    const [column, ...path] = key.split('.');
    this.changed(column, true);
    if (this.hasSetAttribute(column)) {
      if (!path.length) {
        return super.setDataValue(key, value);
      }
      const values = this.get(column) || {};
      _.set(values, path, value);
      return super.setDataValue(column, values);
    }
    const opts = this.get(this.additionalAttribute) || {};
    _.set(opts, key, value);
    this.changed(this.additionalAttribute, true);
    return super.setDataValue(this.additionalAttribute, opts);
  }
}

export default BaseModel;
