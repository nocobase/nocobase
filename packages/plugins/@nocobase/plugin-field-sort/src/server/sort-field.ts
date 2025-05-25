/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isNumber } from 'lodash';
import { DataTypes, Sequelize } from 'sequelize';
import { BaseColumnFieldOptions, Field } from '@nocobase/database';
import { LockManager } from '@nocobase/lock-manager';

export class SortField extends Field {
  static lockManager: LockManager;

  get dataType() {
    return DataTypes.BIGINT;
  }

  setSortValue = async (instances, options) => {
    const { name, scopeKey } = this.options;
    const { model } = this.context.collection;

    instances = Array.isArray(instances) ? instances : [instances];
    for (const instance of instances) {
      if (isNumber(instance.get(name)) && instance._previousDataValues[scopeKey] == instance[scopeKey]) {
        continue;
      }

      const where = {};

      if (scopeKey) {
        const value = instance.get(scopeKey);
        if (value !== undefined && value !== null) {
          where[scopeKey] = value;
        }
      }

      await (<typeof SortField>this.constructor).lockManager.runExclusive(
        this.context.collection.name,
        async () => {
          const max = await model.max<number, any>(name, { ...options, where });
          const newValue = (max || 0) + 1;
          instance.set(name, newValue);
        },
        2000,
      );
    }
  };

  onScopeChange = async (instance, options) => {
    const { scopeKey } = this.options;
    if (scopeKey && !instance.isNewRecord && instance._previousDataValues[scopeKey] != instance[scopeKey]) {
      await this.setSortValue(instance, options);
    }
  };

  initRecordsSortValue = async (options) => {
    const { transaction } = options;

    const needInit = async (scopeKey = null, scopeValue = null) => {
      const filter = {};
      if (scopeKey && scopeValue) {
        filter[scopeKey] = scopeValue;
      }

      const totalCount = await this.collection.repository.count({
        filter,
        transaction,
      });

      const emptyCount = await this.collection.repository.count({
        filter: {
          [this.name]: null,
          ...filter,
        },
        transaction,
      });

      return emptyCount === totalCount && emptyCount > 0;
    };

    const doInit = async (scopeKey = null, scopeValue = null) => {
      const orderField = (() => {
        const model = this.collection.model;

        if (model.primaryKeyAttribute) {
          const primaryKeyAttribute = model.rawAttributes[model.primaryKeyAttribute];
          if (primaryKeyAttribute.autoIncrement) {
            return primaryKeyAttribute.field;
          }
        }

        if (model.rawAttributes['createdAt']) {
          return model.rawAttributes['createdAt'].field;
        }

        throw new Error(`can not find order key for collection ${this.collection.name}`);
      })();

      const queryInterface = this.collection.db.sequelize.getQueryInterface();

      if (scopeKey) {
        const scopeAttribute = this.collection.model.rawAttributes[scopeKey];

        if (!scopeAttribute) {
          throw new Error(`can not find scope field ${scopeKey} for collection ${this.collection.name}`);
        }

        scopeKey = scopeAttribute.field;
      }

      const quotedOrderField = queryInterface.quoteIdentifier(orderField);

      const sortColumnName = queryInterface.quoteIdentifier(this.collection.model.rawAttributes[this.name].field);

      let sql: string;

      const whereClause =
        scopeKey && scopeValue
          ? (() => {
              const filteredScopeValue = scopeValue.filter((v) => v !== null);
              if (filteredScopeValue.length === 0) {
                return '';
              }
              const initialClause = `
  WHERE ${queryInterface.quoteIdentifier(scopeKey)} IN (${filteredScopeValue.map((v) => `'${v}'`).join(', ')})`;

              const nullCheck = scopeValue.includes(null)
                ? ` OR ${queryInterface.quoteIdentifier(scopeKey)} IS NULL`
                : '';
              return initialClause + nullCheck;
            })()
          : '';

      if (this.collection.db.inDialect('postgres')) {
        sql = `
    UPDATE ${this.collection.quotedTableName()}
    SET ${sortColumnName} = ordered_table.new_sequence_number
    FROM (
      SELECT *, ROW_NUMBER() OVER (${
        scopeKey ? `PARTITION BY ${queryInterface.quoteIdentifier(scopeKey)}` : ''
      } ORDER BY ${quotedOrderField}) AS new_sequence_number
      FROM ${this.collection.quotedTableName()}
      ${whereClause}
    ) AS ordered_table
    WHERE ${this.collection.quotedTableName()}.${quotedOrderField} = ordered_table.${quotedOrderField};
  `;
      } else if (this.collection.db.inDialect('sqlite')) {
        sql = `
    UPDATE ${this.collection.quotedTableName()}
    SET ${sortColumnName} = (
      SELECT new_sequence_number
      FROM (
        SELECT *, ROW_NUMBER() OVER (${
          scopeKey ? `PARTITION BY ${queryInterface.quoteIdentifier(scopeKey)}` : ''
        } ORDER BY ${quotedOrderField}) AS new_sequence_number
        FROM ${this.collection.quotedTableName()}
        ${whereClause}
      ) AS ordered_table
      WHERE ${this.collection.quotedTableName()}.${quotedOrderField} = ordered_table.${quotedOrderField}
    );
  `;
      } else if (this.collection.db.inDialect('mysql') || this.collection.db.inDialect('mariadb')) {
        sql = `
    UPDATE ${this.collection.quotedTableName()}
    JOIN (
      SELECT *, ROW_NUMBER() OVER (${
        scopeKey ? `PARTITION BY ${queryInterface.quoteIdentifier(scopeKey)}` : ''
      } ORDER BY ${quotedOrderField}) AS new_sequence_number
      FROM ${this.collection.quotedTableName()}
      ${whereClause}
    ) AS ordered_table ON ${this.collection.quotedTableName()}.${quotedOrderField} = ordered_table.${quotedOrderField}
    SET ${this.collection.quotedTableName()}.${sortColumnName} = ordered_table.new_sequence_number;
  `;
      }
      await this.collection.db.sequelize.query(sql, {
        transaction,
      });
    };

    const scopeKey = this.options.scopeKey;

    if (scopeKey) {
      const scopeKeyColumn = this.collection.model.rawAttributes[scopeKey].field;

      const groups = await this.collection.model.findAll({
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col(scopeKeyColumn)), scopeKey]],
        raw: true,
        transaction,
      });

      const needInitGroups = [];
      for (const group of groups) {
        if (await needInit(scopeKey, group[scopeKey])) {
          needInitGroups.push(group[scopeKey]);
        }
      }

      if (needInitGroups.length > 0) {
        await doInit(scopeKey, needInitGroups);
      }
    } else if (await needInit()) {
      await doInit();
    }
  };

  bind() {
    super.bind();
    this.on('afterSync', this.initRecordsSortValue);
    this.on('beforeUpdate', this.onScopeChange);
    this.on('beforeCreate', this.setSortValue);
    this.on('beforeBulkCreate', this.setSortValue);
  }

  unbind() {
    super.unbind();
    this.off('beforeUpdate', this.onScopeChange);
    this.off('beforeCreate', this.setSortValue);
    this.off('afterSync', this.initRecordsSortValue);
    this.off('beforeBulkCreate', this.setSortValue);
  }
}

export interface SortFieldOptions extends BaseColumnFieldOptions {
  type: 'sort';
  scopeKey?: string;
}
