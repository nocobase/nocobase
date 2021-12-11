import { Mutex } from 'async-mutex';
import { isNumber } from 'lodash';
import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

const sortFieldMutex = new Mutex();

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

      await sortFieldMutex.runExclusive(async () => {
        const max = await model.max<number, any>(name, { ...options, where });
        instance.set(name, (max || 0) + 1);
      });
    });
  }
}

export interface SortFieldOptions extends BaseColumnFieldOptions {
  type: 'sort';
  scopeKey?: string;
}
