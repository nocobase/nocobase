import { DataTypes } from 'sequelize';
import _ from 'lodash';
import { FieldOptions, Model } from '@nocobase/database';

export class FieldModel extends Model {
  static generateName(title?: string): string {
    return `f_${Math.random().toString(36).replace('0.', '').slice(-4).padStart(4, '0')}`;
  }

  async getOptions(): Promise<FieldOptions> {
    return {
      ...this.get('options'),
      type: this.get('type'),
      name: this.get('name'),
    };
  }

  async migrate() {
    const table = this.database.getTable(this.get('collection_name'));
    table.addField(await this.getOptions());
    await table.sync({
      force: false,
      alter: {
        drop: false,
      }
    });
  }

  get(key?, options?) {
    if (typeof key === 'string') {
      const attribute = this.rawAttributes[key];
      const [column, ...path] = key.split('.');
      if (attribute) {
        const value = super.get(column, options);
        if (path.length) {
          return _.get(value, path);
        }
        return value;
      }
      // 否则使用 options 字段中的值
      return _.get(super.get('options', options) || {}, key);
    }
    // 未设置 key 时 sequelize 只取 dataValues 的内容遍历，无法满足要求
    const result = super.get('options', options);
    Object.keys(this.rawAttributes).forEach(k => {
      if (k !== 'options') {
        result[k] = this.get(k, options);
      }
    });

    return result;
  }

  getDataValue(key) {
    const attribute = this.rawAttributes[key];
    const [column, ...path] = key.split('.');
    if (attribute) {
      const value = super.getDataValue(column);
      if (path.length) {
        return _.get(value, path);
      }
      return value;
    }
    const options = super.getDataValue('options') || {};
    return _.get(options, key);
  }

  set(key: any, value: any, options?: any) {
    if (typeof key === 'string') {
      const attribute = this.rawAttributes[key];
      const [column, ...path] = key.split('.');
      const opts = this.get('options', options) || {};
      let val = value;
      let col = column;
      if (attribute) {
        if (col === 'options') {
          val = Object.assign(opts, value);
        } else if (path.length) {
          val = this.get(col, options) || {};
          _.set(val, path, value);
        }
      } else {
        col = 'options';
        val = opts;
        _.set(val, key, value);
      }
      super.set(col, val, options);
      return this;
    }

    super.set(key, value, options);
    return this;
  }

  setDataValue(key, value) {
    const attribute = this.rawAttributes[key];
    const [column, ...path] = key.split('.');
    const opts = this.getDataValue('options') || {};
    let val = value;
    let col = column;
    if (attribute) {
      if (col === 'options') {
        val = Object.assign(opts, value);
      } else if (path.length) {
        val = this.getDataValue(col) || {};
        _.set(val, path, value);
      }
    } else {
      col = 'options';
      val = opts;
      _.set(val, key, value);
    }
    super.setDataValue(col, val);
    return this;
  }
}

export default FieldModel;
