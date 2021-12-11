import { Mutex } from 'async-mutex';
import { isNumber } from 'lodash';
import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

const sortFieldMutex = new Mutex();

export class SortField extends Field {
  get dataType() {
    return DataTypes.INTEGER;
  }

  async setSortValue(instance, options) {
    const { name, scopeKey } = this.options;
    const { model } = this.context.collection;

    if (isNumber(instance.get(name)) && instance._previousDataValues[scopeKey] == instance[scopeKey]) {
      return;
    }

    const where = {};

    if (scopeKey) {
      where[scopeKey] = instance.get(scopeKey);
    }

    await sortFieldMutex.runExclusive(async () => {
      const max = await model.max<number, any>(name, { ...options, where });
      const newValue = (max || 0) + 1;
      instance.set(name, newValue);
    });
  }

  async onScopeChange(instance, options) {
    const { name, scopeKey } = this.options;
    if (!instance.isNewRecord && instance._previousDataValues[scopeKey] != instance[scopeKey]) {
      await this.setSortValue(instance, options);
    }
  }

  bind() {
    super.bind();
    this.on('beforeUpdate', this.onScopeChange.bind(this));
    this.on('beforeCreate', this.setSortValue.bind(this));
  }

  unbind() {
    super.unbind();
    this.off('beforeCreate', this.setSortValue.bind(this));
  }
}

export interface SortFieldOptions extends BaseColumnFieldOptions {
  type: 'sort';
  scopeKey?: string;
}
