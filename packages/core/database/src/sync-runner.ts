/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isPlainObject } from '@nocobase/utils';
import { Model as SequelizeModel } from 'sequelize';
import { Collection } from './collection';
import Database from './database';
import { ZeroColumnTableError } from './errors/zero-column-table-error';
import { InheritedCollection } from './inherited-collection';
import { InheritedSyncRunner } from './inherited-sync-runner';
import { Model } from './model';
import { md5 } from './utils';

export class SyncRunner {
  private readonly collection: Collection;
  private readonly database: Database;
  private tableDescMap = {};

  private uniqueAttributes: string[] = [];

  constructor(private model: typeof Model) {
    this.collection = model.collection;
    this.database = model.database;
  }

  get tableName() {
    return this.model.getTableName();
  }

  get sequelize() {
    return this.model.sequelize;
  }

  get queryInterface() {
    return this.sequelize.getQueryInterface();
  }

  get rawAttributes() {
    return this.model.rawAttributes;
  }

  async runSync(options) {
    if (this.collection.isView()) {
      return;
    }

    if (this.collection.options.sync === false) {
      return;
    }

    // @ts-ignore
    const collectionSyncOptions = this.database.collectionFactory.collectionTypes.get(this.collection.constructor)
      ?.onSync;

    if (collectionSyncOptions) {
      await collectionSyncOptions(this.model, options);
      return;
    }

    await this.handleSchema(options);

    try {
      await this.handleZeroColumnModel(options);
    } catch (e) {
      if (e instanceof ZeroColumnTableError) {
        return;
      }

      throw e;
    }

    let beforeColumns;

    try {
      beforeColumns = await this.queryInterface.describeTable(this.tableName, options);
    } catch (error) {
      // continue
    }

    if (beforeColumns) {
      await this.handlePrimaryKeyBeforeSync(beforeColumns, options);
      await this.handleUniqueFieldBeforeSync(beforeColumns, options);
    }

    const syncResult = await this.performSync(options);
    const columns = await this.queryInterface.describeTable(this.tableName, options);

    await this.handlePrimaryKey(columns, options);
    await this.handleDefaultValues(columns, options);
    await this.handleUniqueIndex(options);

    return syncResult;
  }

  async handleUniqueFieldBeforeSync(beforeColumns, options) {
    if (!this.database.inDialect('sqlite')) {
      return;
    }
    // find new attributes with unique true
    const newAttributes = Object.keys(this.rawAttributes).filter((key) => {
      return !Object.keys(beforeColumns).includes(this.rawAttributes[key].field) && this.rawAttributes[key].unique;
    });

    this.uniqueAttributes = newAttributes;

    // set unique false for new attributes to skip sequelize sync error
    for (const newAttribute of newAttributes) {
      this.rawAttributes[newAttribute].unique = false;
    }
  }

  async handlePrimaryKeyBeforeSync(columns, options) {
    const columnsBePrimaryKey = Object.keys(columns)
      .filter((key) => {
        return columns[key].primaryKey == true;
      })
      .sort();

    const columnsWillBePrimaryKey = Object.keys(this.rawAttributes)
      .filter((key) => {
        return this.rawAttributes[key].primaryKey == true;
      })
      .map((key) => {
        return this.rawAttributes[key].field;
      })
      .sort();

    if (columnsBePrimaryKey.length == 1 && !columnsWillBePrimaryKey.includes(columnsBePrimaryKey[0])) {
      // remove primary key
      if (this.database.inDialect('mariadb', 'mysql')) {
        await this.sequelize.query(`ALTER TABLE ${this.collection.quotedTableName()} DROP PRIMARY KEY;`, options);
      }
    }
  }

  async handlePrimaryKey(columns, options) {
    try {
      const columnsBePrimaryKey = Object.keys(columns)
        .filter((key) => {
          return columns[key].primaryKey == true;
        })
        .sort();

      const columnsWillBePrimaryKey = Object.keys(this.rawAttributes)
        .filter((key) => {
          return this.rawAttributes[key].primaryKey == true;
        })
        .map((key) => {
          return this.rawAttributes[key].field;
        })
        .sort();

      if (columnsWillBePrimaryKey.length == 0) {
        return;
      }

      if (
        columnsWillBePrimaryKey.length == 1 &&
        JSON.stringify(columnsBePrimaryKey) != JSON.stringify(columnsWillBePrimaryKey)
      ) {
        if (this.database.inDialect('mariadb', 'mysql')) {
          await this.sequelize.query(
            `ALTER TABLE ${this.collection.quotedTableName()} ADD PRIMARY KEY (${columnsWillBePrimaryKey[0]});`,
            options,
          );
        } else {
          let name = `${this.collection.tableName()}_${columnsWillBePrimaryKey.join('_')}_pk`;
          if (name.length > 63) {
            name = 'pk_' + md5(name);
          }
          await this.queryInterface.addConstraint(this.tableName, {
            type: 'primary key',
            fields: columnsWillBePrimaryKey,
            name,
            transaction: options?.transaction,
          });
        }
      }
    } catch (e) {
      if (e.message.includes('No description found')) {
        return;
      }
      throw e;
    }
  }

  async handleDefaultValues(columns, options) {
    const isJSONColumn = (column) => {
      return ['JSON', 'JSONB'].includes(column.type);
    };

    for (const columnName in columns) {
      const column = columns[columnName];
      const isPrimaryKey = () => {
        const attribute = this.findAttributeByColumnName(columnName);
        return (attribute && attribute.primaryKey) || column.primaryKey;
      };

      if (isPrimaryKey()) continue;

      if (await this.isParentColumn(columnName, options)) continue;

      const currentAttribute = this.findAttributeByColumnName(columnName);
      if (!currentAttribute) continue;

      const attributeDefaultValue =
        isPlainObject(currentAttribute.defaultValue) && isJSONColumn(column)
          ? JSON.stringify(currentAttribute.defaultValue)
          : currentAttribute.defaultValue;
      const columnDefaultValue = columns[columnName].defaultValue;

      if (columnDefaultValue === null && attributeDefaultValue === undefined) continue;

      if (columnDefaultValue === 'NULL' && attributeDefaultValue === null) continue;

      if (columnDefaultValue != attributeDefaultValue) {
        const changeAttribute = {
          ...currentAttribute,
          defaultValue: attributeDefaultValue,
        };

        if (this.database.inDialect('postgres')) {
          // @ts-ignore
          const query = this.queryInterface.queryGenerator.attributesToSQL(
            {
              // @ts-ignore
              [columnName]: this.queryInterface.normalizeAttribute(changeAttribute),
            },
            {
              context: 'changeColumn',
              table: this.tableName,
            },
          );

          // @ts-ignore
          const sql = this.queryInterface.queryGenerator.changeColumnQuery(this.tableName, query);
          // remove alter type sql
          const regex = /;ALTER TABLE "[^"]+"(\."[^"]+")? ALTER COLUMN "[^"]+" TYPE [^;]+;?$/;

          await this.sequelize.query(sql.replace(regex, ''), options);
        } else {
          await this.queryInterface.changeColumn(this.tableName, columnName, changeAttribute, options);
        }
      }
    }
  }

  async handleUniqueIndex(options) {
    for (const uniqueAttribute of this.uniqueAttributes) {
      this.rawAttributes[uniqueAttribute].unique = true;
    }

    const existsIndexes: any = await this.queryInterface.showIndex(this.collection.getTableNameWithSchema(), options);
    const existsUniqueIndexes = existsIndexes.filter((index) => index.unique);

    const uniqueAttributes = Object.keys(this.rawAttributes).filter((key) => {
      return this.rawAttributes[key].unique == true;
    });

    // remove unique index that not in model
    for (const existUniqueIndex of existsUniqueIndexes) {
      const isSingleField = existUniqueIndex.fields.length == 1;
      if (!isSingleField) continue;

      const columnName = existUniqueIndex.fields[0].attribute;

      const currentAttribute = this.findAttributeByColumnName(columnName);

      if (!currentAttribute || (!currentAttribute.unique && !currentAttribute.primaryKey)) {
        if (this.database.inDialect('postgres')) {
          // @ts-ignore
          const constraints = await this.queryInterface.showConstraint(this.tableName, existUniqueIndex.name, options);
          if (constraints.some((c) => c.constraintName === existUniqueIndex.name)) {
            await this.queryInterface.removeConstraint(this.tableName, existUniqueIndex.name, options);
          }
        }

        if (this.database.inDialect('sqlite')) {
          const changeAttribute = {
            ...currentAttribute,
            unique: false,
          };

          await this.queryInterface.changeColumn(this.tableName, columnName, changeAttribute, options);
        } else {
          await this.queryInterface.removeIndex(this.tableName, existUniqueIndex.name, options);
        }
      }
    }

    // add unique index that not in database
    for (const uniqueAttribute of uniqueAttributes) {
      // check index exists or not
      const indexExists = existsUniqueIndexes.find((index) => {
        return index.fields.length == 1 && index.fields[0].attribute == this.rawAttributes[uniqueAttribute].field;
      });

      if (!indexExists) {
        let name = `${this.collection.tableName()}_${this.rawAttributes[uniqueAttribute].field}_uk`;
        if (name.length > 63) {
          name = 'uk_' + md5(name);
        }
        await this.queryInterface.addIndex(this.tableName, [this.rawAttributes[uniqueAttribute].field], {
          unique: true,
          transaction: options?.transaction,
          name,
        });
      }
    }
  }

  async getColumns(options) {
    return await this.queryInterface.describeTable(this.tableName, options);
  }

  async isParentColumn(columnName: string, options) {
    if (this.collection.isInherited()) {
      const parentCollections = (<InheritedCollection>this.collection).getFlatParents();
      for (const parentCollection of parentCollections) {
        let parentColumns = this.tableDescMap[parentCollection.name];
        if (!parentColumns) {
          parentColumns = await this.queryInterface.describeTable(parentCollection.getTableNameWithSchema(), options);
          this.tableDescMap[parentCollection.name] = parentColumns;
        }

        if (parentColumns[columnName]) {
          return true;
        }
      }
    }

    return false;
  }

  async removeUnusedColumns(columns, options) {
    // remove columns that not in model
    for (const columnName in columns) {
      const currentAttribute = this.findAttributeByColumnName(columnName);
      if (!currentAttribute) {
        let shouldDelete = true;

        if (await this.isParentColumn(columnName, options)) {
          shouldDelete = false;
        }

        if (shouldDelete) {
          await this.queryInterface.removeColumn(this.model.getTableName(), columnName, options);
          continue;
        }
      }
    }
  }

  findAttributeByColumnName(columnName: string): any {
    return Object.values(this.rawAttributes).find((attribute) => {
      // @ts-ignore
      return attribute.field == columnName;
    });
  }

  async performSync(options) {
    return this.collection.isInherited()
      ? await InheritedSyncRunner.syncInheritModel(this.model, options)
      : await SequelizeModel.sync.call(this.model, options);
  }

  async handleZeroColumnModel(options) {
    // @ts-ignore
    if (Object.keys(this.model.tableAttributes).length === 0) {
      if (this.database.inDialect('sqlite', 'mysql', 'mariadb', 'postgres')) {
        throw new ZeroColumnTableError(
          `Zero-column tables aren't supported in ${this.database.sequelize.getDialect()}`,
        );
      }

      const queryInterface = this.queryInterface;
      // @ts-ignore
      if (!queryInterface.patched) {
        const oldDescribeTable = queryInterface.describeTable;
        queryInterface.describeTable = async function (...args) {
          try {
            return await oldDescribeTable.call(this, ...args);
          } catch (err) {
            if (err.message.includes('No description found for')) {
              return [];
            } else {
              throw err;
            }
          }
        };
        // @ts-ignore
        queryInterface.patched = true;
      }
    }
  }

  async handleSchema(options) {
    // @ts-ignore
    const _schema = this.model._schema;

    if (_schema && _schema != 'public') {
      await this.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${_schema}";`, {
        raw: true,
        transaction: options?.transaction,
      });
    }
  }
}
