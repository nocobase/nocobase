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

  scopeKeyAsField = () => {
    const scopeKey = this.options.scopeKey;

    if (!scopeKey) return null;

    const model = this.collection.model;
    if (!this.isAssociatedScopeKey()) return model.rawAttributes[scopeKey].field;

    // get last two parts of scopeKey
    const parts = scopeKey.split('.');
    return parts[parts.length - 2] + '.' + parts[parts.length - 1];
  };

  setSortValue = async (instance, options) => {
    const { name, scopeKey } = this.options;

    if (instance.get(name) && !options.reset) return;

    const { transaction } = options;

    if (
      !options.reset &&
      isNumber(instance.get(name)) &&
      instance._previousDataValues[scopeKey] == instance[scopeKey]
    ) {
      return;
    }

    const filter = {};
    const primaryKey = instance.constructor.primaryKeyAttribute;

    filter[`${primaryKey}.$ne`] = instance.get(primaryKey);

    if (scopeKey) {
      try {
        filter[scopeKey] = this.isAssociatedScopeKey()
          ? await instance.lazyLoadGet(scopeKey, { transaction })
          : instance.get(scopeKey);

        if (filter[scopeKey] === undefined) {
          filter[scopeKey] = null;
        }
      } catch (e) {
        if (e.message.includes('not found')) {
          filter[scopeKey] = null;
        } else {
          throw e;
        }
      }
    }

    await sortFieldMutex.runExclusive(async () => {
      console.log({ filter });
      const max = await this.context.collection.repository.max({
        field: name,
        filter,
        transaction,
      });

      const newValue = (max || 0) + 1;
      await instance.update({ [name]: newValue }, { transaction, hooks: false, silent: true });
    });
  };

  onScopeChange = async (instance, options) => {
    const { scopeKey } = this.options;

    if (scopeKey && !instance.isNewRecord && instance._previousDataValues[scopeKey] != instance[scopeKey]) {
      await this.setSortValue(instance, {
        ...options,
        reset: true,
      });
    }
  };

  afterChangeScope = async (instance, options) => {
    await this.setSortValue(instance, {
      ...options,
      reset: true,
    });
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

    const needInit = async (
      scopeKey,
    ): Promise<
      Array<{
        need_init: boolean;
        scope_key?: string;
      }>
    > => {
      const SQL = `
        select count(*) =
               count(
                 CASE
                   WHEN ${q(this.columnName())} IS NULL THEN 1
                   ELSE NULL
                   END
                 ) AND count(*) > 0 as need_init
          ${scopeKey ? `, ${qs(this.scopeKeyAsField())}  as scope_key` : ''}
        from ${this.collection.quotedTableName()} ${
        this.isAssociatedScopeKey() ? queryInterface.createJoinSQL(this.collection, scopeKey) : ''
      } ${scopeKey ? `group by ${qs(this.scopeKeyAsField())}` : ''}
      `;

      // @ts-ignore
      return await db.sequelize.query(SQL, {
        type: 'SELECT',
        transaction,
      });
    };

    const doInit = async (scopeKey = null, scopeValue = null) => {
      const quotedOrderField = `${q(orderField)}`;
      const orderFieldWithTableName = `${this.collection.quotedTableName()}.${quotedOrderField}`;

      const sql = `
        WITH ordered_table AS (
        SELECT ${orderFieldWithTableName} as ${quotedOrderField}, ROW_NUMBER() OVER (${
        scopeKey ? `PARTITION BY ${qs(this.scopeKeyAsField())}` : ''
      }
        ORDER BY ${orderFieldWithTableName}) AS new_sequence_number
        FROM ${this.collection.quotedTableName()}
        ${this.isAssociatedScopeKey() ? queryInterface.createJoinSQL(this.collection, scopeKey) : ''}
        ${(() => {
          if (scopeKey && scopeValue) {
            const hasNull = scopeValue.includes(null);

            const notNullValues = scopeValue.filter((v) => v !== null);

            const conditions = [];
            if (notNullValues.length) {
              conditions.push(`${qs(this.scopeKeyAsField())} IN (${notNullValues.map((v) => `'${v}'`).join(',')})`);
            }
            if (hasNull) {
              conditions.push(`${qs(scopeKey)} IS NULL`);
            }

            return `WHERE ${conditions.join(' OR ')}`;
          }

          return '';
        })()})

          ${
            this.collection.db.inDialect('mysql')
              ? `
                UPDATE ${this.collection.quotedTableName()}, ordered_table
                SET ${this.collection.quotedTableName()}.${this.name} = ordered_table.new_sequence_number
                WHERE ${orderFieldWithTableName} = ${q('ordered_table')}.${quotedOrderField}
              `
              : `
                UPDATE ${this.collection.quotedTableName()}
                SET ${q(this.name)} = ordered_table.new_sequence_number FROM ordered_table
                WHERE ${orderFieldWithTableName} = ${q('ordered_table')}.${quotedOrderField};
              `
          }

      `;

      await this.collection.db.sequelize.query(sql, {
        transaction,
      });
    };

    const scopeKey = this.options.scopeKey;

    let needInitResults = await needInit(scopeKey);

    if (scopeKey) {
      needInitResults = needInitResults.filter((r) => r['need_init']);
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
      afterUpdate: this.onScopeChange,
      afterChangeScope: this.afterChangeScope,
      afterCreateWithAssociations: this.setSortValue,
      afterCreate: this.setSortValue,
    });
  }
}

export interface SortFieldOptions extends BaseColumnFieldOptions {
  type: 'sort';
  scopeKey?: string;
}
