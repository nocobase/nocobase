import { Model } from './model';
import { Collection } from './collection';
import Database from './database';
import { InheritedSyncRunner } from './inherited-sync-runner';
import { InheritedCollection } from './inherited-collection';
import { Model as SequelizeModel } from 'sequelize';
import { ZeroColumnTableError } from './errors/zero-column-table-error';
import { isPlainObject } from '@nocobase/utils';

export class ModelSyncHelper {
  private readonly collection: Collection;
  private readonly database: Database;
  private tableDescMap = {};

  constructor(private model: Model) {
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

  get snapshotManager() {
    return this.database.collectionSnapshotManager;
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

    if (this.snapshotManager.enabled() && !(await this.hasChangesSinceLastSnapshot())) {
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

    const syncResult = await this.performSync(options);

    const columns = await this.queryInterface.describeTable(this.tableName, options);

    await this.removeUnusedColumns(columns, options);
    await this.handleDefaultValues(columns, options);
    await this.handleUniqueIndex(options);

    await this.handleSnapshot();

    return syncResult;
  }

  async handleSnapshot() {
    this.snapshotManager.enabled() && (await this.snapshotManager.saveSnapshot(this.collection));
  }

  async handleDefaultValues(columns, options) {
    const isJSONColumn = (column) => {
      return ['JSON', 'JSONB'].includes(column.type);
    };

    for (const columnName in columns) {
      const column = columns[columnName];
      if (column.primaryKey) continue;
      if (await this.isParentColumn(columnName, options)) continue;

      const currentAttribute = this.findAttributeByColumnName(columnName);
      if (!currentAttribute) continue;

      const attributeDefaultValue =
        isPlainObject(currentAttribute.defaultValue) && isJSONColumn(column)
          ? JSON.stringify(currentAttribute.defaultValue)
          : currentAttribute.defaultValue;
      const columnDefaultValue = columns[columnName].defaultValue;

      if (columnDefaultValue === null && attributeDefaultValue === undefined) continue;

      if (columnDefaultValue !== attributeDefaultValue) {
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
    const existsIndexes: any = await this.queryInterface.showIndex(this.tableName, options);
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
        await this.queryInterface.addIndex(this.tableName, [this.rawAttributes[uniqueAttribute].field], {
          unique: true,
          transaction: options?.transaction,
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
    if (Object.keys(this.model.tableAttributes).length === 0) {
      if (this.database.inDialect('sqlite', 'mysql')) {
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
    const _schema = this.model._schema;

    if (_schema && _schema != 'public') {
      await this.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${_schema}";`, {
        raw: true,
        transaction: options?.transaction,
      });
    }
  }

  async hasChangesSinceLastSnapshot() {
    return await this.snapshotManager.hasChanged(this.collection);
  }
}
