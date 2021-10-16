import { isNumber } from 'lodash';
import { DataTypes } from 'sequelize';
import { Field } from './field';

export class SortField extends Field {
  get dataType() {
    return DataTypes.INTEGER;
  }

  init() {
    const { name, scopeKey } = this.options;
    const { model } = this.context.collection;
    model.beforeCreate(async (instance, options) => {
      if (isNumber(instance.get(name))) {
        return;
      }
      const where = {};
      if (scopeKey) {
        where[scopeKey] = instance.get(scopeKey);
      }
      const max = await model.max<number, any>(name, { ...options, where });
      instance.set(name, (max || 0) + 1);
    });
  }
}
