/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isPlainObject } from '@nocobase/utils';
import { Op, Model as SequelizeModel } from 'sequelize';
import { Collection } from './collection';
import Database from './database';
import { ZeroColumnTableError } from './errors/zero-column-table-error';
import { InheritedCollection } from './inherited-collection';
import { InheritedSyncRunner } from './inherited-sync-runner';
import { Model } from './model';

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
      } else if (this.database.inDialect('mssql')) {
        const constraintName = await this.sequelize.query(
          `SELECT name FROM sys.key_constraints
           WHERE type = 'PK' AND parent_object_id = OBJECT_ID('${this.collection.quotedTableName()}')`,
          { ...options, type: 'SELECT' },
        );
        if (constraintName?.[0] && constraintName[0]['name']) {
          await this.sequelize.query(
            `ALTER TABLE ${this.collection.quotedTableName()} DROP CONSTRAINT ${constraintName[0]['name']};`,
            options,
          );
        }
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
          await this.queryInterface.addConstraint(this.tableName, {
            type: 'primary key',
            fields: columnsWillBePrimaryKey,
            name: `${this.collection.tableName()}_${columnsWillBePrimaryKey.join('_')}_pk`,
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

        // TODO: use dialect QueryInterface to change column default value
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
          await this.database.queryInterface.changeColumn({
            actions: ['setDefaultValue'],
            tableName: this.tableName,
            columnDescription: changeAttribute,
            columnName: columnName,
            model: this.model,
            schema: options?.schema,
            options,
          });
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

    const rebuildIndexes = [];
    // remove unique index that not in model
    for (const existUniqueIndex of existsUniqueIndexes) {
      const isSingleField = existUniqueIndex.fields.length == 1;
      if (!isSingleField) continue;

      const columnName = existUniqueIndex.fields[0].attribute;
      const currentAttribute = this.findAttributeByColumnName(columnName);
      const needRemove = !currentAttribute || (!currentAttribute.unique && !currentAttribute.primaryKey);
      if (this.database.inDialect('mssql')) {
        try {
          // 设置更短的查询超时时间，避免长时间阻塞
          const queryOptions = {
            ...options,
            type: 'SELECT',
            timeout: 5000, // 设置5秒超时，可根据实际情况调整
          };

          // 优化查询，只查询必要的信息
          const constraintCheck = await this.sequelize.query(
            `SELECT OBJECT_NAME(object_id) as name, is_unique_constraint
             FROM sys.indexes WITH (NOLOCK)
             WHERE object_id = OBJECT_ID('${this.collection.quotedTableName()}')
             AND name = '${existUniqueIndex.name}'`,
            queryOptions,
          );

          if (constraintCheck.length > 0) {
            const isConstraint = (<any>constraintCheck)[0]['is_unique_constraint'];

            // 同样使用优化的查询选项
            const isPrimaryKey = await this.sequelize.query(
              `SELECT 1 FROM sys.indexes WITH (NOLOCK)
               WHERE object_id = OBJECT_ID('${this.collection.quotedTableName()}')
               AND name = '${existUniqueIndex.name}'
               AND is_primary_key = 1`,
              queryOptions,
            );

            // 跳过主键索引
            if (isPrimaryKey.length > 0) {
              continue;
            }

            if (!needRemove) {
              rebuildIndexes.push(columnName);
            }

            if (isConstraint) {
              await this.sequelize.query(
                `ALTER TABLE ${this.collection.quotedTableName()} DROP CONSTRAINT [${existUniqueIndex.name}]`,
                options,
              );
            } else {
              await this.sequelize.query(
                `DROP INDEX [${existUniqueIndex.name}] ON ${this.collection.quotedTableName()};`,
                options,
              );
            }

            // 修复索引名称中的语法错误（多了一个右花括号）
            await this.sequelize.query(
              `
              CREATE UNIQUE INDEX [${this.collection.tableName()}_${columnName}_uk]
              ON ${this.tableName} ([${columnName}])
              WHERE [${columnName}] IS NOT NULL;
            `,
              options,
            );
          }
        } catch (error) {
          // 添加错误处理，记录错误但不中断流程
          console.warn(`Error handling unique index for ${existUniqueIndex.name}: ${error.message}`);
          // 如果是超时错误，可以继续处理下一个索引
          if (error.message.includes('Timeout')) {
            continue;
          }
          throw error;
        }
      }
      if (needRemove) {
        if (this.database.inDialect('postgres')) {
          // @ts-ignore
          const constraints = await this.queryInterface.showConstraint(this.tableName, existUniqueIndex.name, options);
          if (constraints.some((c) => c.constraintName === existUniqueIndex.name)) {
            await this.queryInterface.removeConstraint(this.tableName, existUniqueIndex.name, options);
          }
        } else if (this.database.inDialect('sqlite')) {
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
      const field = this.rawAttributes[uniqueAttribute].field;

      // 检查是否存在包含该字段的索引（包括组合索引）
      const hasFieldIndex = existsUniqueIndexes.some((index) => {
        return index.fields[0].attribute === field;
      });

      if (!hasFieldIndex) {
        // 检查是否有重复数据
        const duplicateCheck = await this.sequelize.query(
          `SELECT COUNT(*) as count, ${field} 
           FROM ${this.collection.quotedTableName()} 
           GROUP BY ${field} 
           HAVING COUNT(*) > 1`,
          { ...options, type: 'SELECT' },
        );

        if (duplicateCheck.length > 0) {
          console.warn(`Cannot create unique index on ${field} due to duplicate values`);
          continue;
        }

        await this.queryInterface.addIndex(this.tableName, [field], {
          unique: true,
          transaction: options?.transaction,
          name: `${this.collection.tableName()}_${field}_uk`,
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
      if (this.database.inDialect('sqlite', 'mysql', 'mariadb', 'postgres', 'mssql')) {
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
      if (this.database.inDialect('mssql')) {
        await this.sequelize.query(
          `IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${_schema}')
           BEGIN
             EXEC('CREATE SCHEMA [${_schema}]')
           END`,
          {
            raw: true,
            transaction: options?.transaction,
          },
        );
      } else {
        await this.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${_schema}";`, {
          raw: true,
          transaction: options?.transaction,
        });
      }
    }
  }
}
