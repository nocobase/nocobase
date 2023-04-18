import { Mutex } from 'async-mutex';
import { isNumber } from 'lodash';
import { DataTypes } from 'sequelize';
import { BaseColumnFieldOptions, Field } from './field';

const sortFieldMutex = new Mutex();

export class SortField extends Field {
  get dataType() {
    return DataTypes.BIGINT;
  }

  isAssociatedScopeKey() {
    return this.options.scopeKey && this.options.scopeKey.includes('.');
  }

  setSortValue = async (instance, options) => {
    const { name, scopeKey } = this.options;
    const { transaction } = options;

    const { model } = this.context.collection;

    if (isNumber(instance.get(name)) && instance._previousDataValues[scopeKey] == instance[scopeKey]) {
      return;
    }

    const filter = {};

    if (scopeKey) {
      const value = this.isAssociatedScopeKey()
        ? await instance.lazyLoadGet(scopeKey, { transaction })
        : instance.get(scopeKey);

      if (value !== undefined && value !== null) {
        filter[scopeKey] = value;
      }
    }

    await sortFieldMutex.runExclusive(async () => {
      const max = await this.context.collection.repository.max({
        field: name,
        filter,
        transaction,
      });

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
    const db = this.collection.db;

    const sequelizeQueryInterface = db.sequelize.getQueryInterface();
    const q = sequelizeQueryInterface.quoteIdentifier.bind(sequelizeQueryInterface);
    const qs = sequelizeQueryInterface.quoteIdentifiers.bind(sequelizeQueryInterface);

    const queryInterface = db.queryInterface;

    const orderField = (() => {
      const model = this.collection.model;

      if (model.primaryKeyAttribute) {
        return model.primaryKeyAttribute;
      }
      if (model.rawAttributes['createdAt']) {
        return model.rawAttributes['createdAt'].field;
      }

      throw new Error(`can not find order key for collection ${this.collection.name}`);
    })();

    const isAssociatedScopeKey = (scopeKey) => {
      return scopeKey.includes('.');
    };

    const needInit = async (scopeKey) => {
      const SQL = `
        select count(*) >
               count(
                 CASE
                   WHEN ${q(this.columnName())} IS NULL THEN 1
                   ELSE NULL
                   END
                 ) AND count(*) > 0 as need_init
          ${scopeKey ? `, ${qs(scopeKey)}  as scope_key` : ''}
        from ${this.collection.quotedTableName()} ${
        isAssociatedScopeKey(scopeKey) ? queryInterface.createJoinSQL(this.collection, scopeKey) : ''
      } ${scopeKey ? `group by ${qs(scopeKey)}` : ''}
      `;

      return await db.sequelize.query(SQL, {
        type: 'SELECT',
        transaction,
      });
    };

    const doInit = async (scopeKey = null, scopeValue = null) => {
      const quotedOrderField = q(orderField);

      const sql = `
        WITH ordered_table AS (SELECT *, ROW_NUMBER() OVER (${
          scopeKey ? `PARTITION BY ${q(scopeKey)}` : ''
        } ORDER BY ${quotedOrderField}) AS new_sequence_number
                               FROM ${this.collection.quotedTableName()} ${(() => {
        if (scopeKey && scopeValue) {
          const hasNull = scopeValue.includes(null);

          return `WHERE ${q(scopeKey)} IN (${scopeValue
            .filter((v) => v !== null)
            .map((v) => `'${v}'`)
            .join(',')}) ${hasNull ? `OR ${q(scopeKey)} IS NULL` : ''} `;
        }

        return '';
      })()})
          ${
            this.collection.db.inDialect('mysql')
              ? `
                UPDATE ${this.collection.quotedTableName()}, ordered_table
                SET ${this.collection.quotedTableName()}.${this.name} = ordered_table.new_sequence_number
                WHERE ${this.collection.quotedTableName()}.${quotedOrderField} = ordered_table.${quotedOrderField}
              `
              : `
                UPDATE ${this.collection.quotedTableName()}
                SET ${sequelizeQueryInterface.quoteIdentifier(
                  this.name,
                )} = ordered_table.new_sequence_number FROM ordered_table
                WHERE ${this.collection.quotedTableName()}.${quotedOrderField} = ${sequelizeQueryInterface.quoteIdentifier(
                  'ordered_table',
                )}.${quotedOrderField};
              `
          }

      `;

      await this.collection.db.sequelize.query(sql, {
        transaction,
      });
    };

    const scopeKey = this.options.scopeKey;

    const needInitResults = await needInit(scopeKey);

    if (scopeKey) {
      if (needInitResults.length > 0) {
        await doInit(
          scopeKey,
          needInitResults.map((r) => r['scope_key']),
        );
      }
    } else if (needInitResults[0]['need_init']) {
      await doInit();
    }
  };

  bind() {
    super.bind();

    this.setListeners({
      afterSync: this.initRecordsSortValue,
      beforeUpdate: this.onScopeChange,
      beforeCreate: this.setSortValue,
    });
  }
}

export interface SortFieldOptions extends BaseColumnFieldOptions {
  type: 'sort';
  scopeKey?: string;
}
