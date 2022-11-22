import { Mutex } from 'async-mutex';
import { isNumber } from 'lodash';
import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

const sortFieldMutex = new Mutex();

export class SortField extends Field {
  get dataType() {
    return DataTypes.BIGINT;
  }

  setSortValue = async (instance, options) => {
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
  };

  onScopeChange = async (instance, options) => {
    const { scopeKey } = this.options;
    if (scopeKey && !instance.isNewRecord && instance._previousDataValues[scopeKey] != instance[scopeKey]) {
      await this.setSortValue(instance, options);
    }
  };

  initRecordsSortValue = async ({ transaction }) => {
    const totalCount = await this.collection.repository.count({
      transaction,
    });

    const emptyCount = await this.collection.repository.count({
      filter: {
        [this.name]: null,
      },
      transaction,
    });

    if (emptyCount === totalCount && emptyCount > 0) {
      const records = await this.collection.repository.find({
        order: [this.collection.model.primaryKeyAttribute],
        transaction,
      });

      let start = 1;
      for (const record of records) {
        await record.update(
          {
            sort: start,
          },
          {
            transaction,
            silent: true,
          },
        );

        start += 1;
      }
    }
  };

  bind() {
    super.bind();
    this.on('afterSync', this.initRecordsSortValue);
    this.on('beforeUpdate', this.onScopeChange);
    this.on('beforeCreate', this.setSortValue);
  }

  unbind() {
    super.unbind();
    this.off('beforeUpdate', this.onScopeChange);
    this.off('beforeCreate', this.setSortValue);
    this.off('afterSync', this.initRecordsSortValue);
  }
}

export interface SortFieldOptions extends BaseColumnFieldOptions {
  type: 'sort';
  scopeKey?: string;
}
