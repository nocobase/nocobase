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
      // 如果有该字段的值，则按默认处理返回 或 为虚拟字段
      if (typeof this.dataValues[key] !== 'undefined' || attribute.type instanceof DataTypes.VIRTUAL) {
        return super.get(key, options);
      }
      // 否则使用 options 字段中的值
      const opts = this.dataValues.options || {};
      return opts[key];
    }
    const { options: opts = {}, ...values } = super.get(key, options);
    return {
      ...opts,
      ...values
    };
  }

  getDataValue(key) {
    if (typeof this.dataValues[key] !== 'undefined') {
      return this.dataValues[key];
    }
    const options = this.dataValues.options || {};
    return options[key];
  }

  set(key: any, value: any, options?: any) {
    if (typeof key === 'string') {
      const opts = this.get('options', options) || {};
      const attribute = this.rawAttributes[key];
      if (attribute) {
        if (key === 'options') {
          Object.assign(opts, value);
        } else if (attribute.type instanceof DataTypes.VIRTUAL) {
          // TODO(bug): 如何判断一个字段是虚拟字段？当前写法不成立
          if (key.indexOf('.') !== -1) {
            const [column, ...rest] = key.split('.');
            if (this.rawAttributes[column]) {
              const target = this.get(column);
              _.set(target, rest, value);
              this.set(column, target, options);
            }
          }
          return this;
        } else {
          super.set(key, value, options);
          return this;
        }
      } else {
        opts[key] = value;
      }
      super.set('options', opts, options);
      return this;
    }

    super.set(key, value, options);
    return this;
  }

  setDataValue(key, value) {
    const attribute = this.rawAttributes[key];
    if (!attribute) {
      const opts = this.get('options') || {};
      if (value == null) {
        delete opts[key];
      } else {
        opts[key] = value;
      }
      super.setDataValue('options', opts);
      return this;
    }

    if (attribute.type instanceof DataTypes.VIRTUAL) {
      // TODO: 虚拟字段
      return this;
    }

    super.setDataValue(key, value);
    return this;
  }
}

export default FieldModel;
