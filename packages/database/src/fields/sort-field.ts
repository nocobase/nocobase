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
      const value = instance.get(scopeKey);
      if (value !== undefined && value !== null) {
        where[scopeKey] = value;
      }
    }

    await sortFieldMutex.runExclusive(async () => {
      const max = await model.max<number, any>(name, { ...options, where });
      const newValue = (max || 0) + 1;
      instance.set(name, newValue);
    });
  }

  async onScopeChange(instance, options) {
    const { scopeKey } = this.options;
    if (scopeKey && !instance.isNewRecord && instance._previousDataValues[scopeKey] != instance[scopeKey]) {
      await this.setSortValue(instance, options);
    }
  }

  async initRecordsSortValue({ syncOptions }) {
    const totalCount = await this.collection.repository.count();
    const emptyCount = await this.collection.repository.count({
      filter: {
        [this.name]: null,
      },
    });

    if (emptyCount === totalCount && emptyCount > 0) {
      const records = await this.collection.repository.find({
        order: [this.collection.model.primaryKeyAttribute],
      });

      let start = 1;
      for (const record of records) {
        await record.update(
          {
            sort: start,
          },
          {
            silent: true,
          },
        );

        start += 1;
      }
    }
  }

  bind() {
    super.bind();
    this.on('afterSync', this.initRecordsSortValue.bind(this));
    this.on('beforeUpdate', this.onScopeChange.bind(this));
    this.on('beforeCreate', this.setSortValue.bind(this));
  }

  unbind() {
    super.unbind();
    this.off('beforeUpdate', this.onScopeChange.bind(this));
    this.off('beforeCreate', this.setSortValue.bind(this));
    this.off('afterSync', this.initRecordsSortValue.bind(this));
  }
}

export interface SortFieldOptions extends BaseColumnFieldOptions {
  type: 'sort';
  scopeKey?: string;
}
