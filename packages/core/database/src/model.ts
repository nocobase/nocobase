import lodash from 'lodash';
import { Model as SequelizeModel, ModelStatic } from 'sequelize';
import { Collection } from './collection';
import { Database } from './database';
import { Field } from './fields';
import { SyncRunner } from './sync-runner';
import { InheritedCollection } from './inherited-collection';

const _ = lodash;

interface IModel {
  [key: string]: any;
}

interface JSONTransformerOptions {
  model: ModelStatic<any>;
  collection: Collection;
  db: Database;
  key?: string;
  field?: Field;
}

export class Model<TModelAttributes extends {} = any, TCreationAttributes extends {} = TModelAttributes>
  extends SequelizeModel<TModelAttributes, TCreationAttributes>
  implements IModel
{
  public static database: Database;
  public static collection: Collection;

  [key: string]: any;

  protected _changedWithAssociations = new Set();
  protected _previousDataValuesWithAssociations = {};

  static async sync(options) {
    if (this.collection.isView()) {
      return;
    }

    const snapshotManager = this.database.collectionSnapshotManager;
    const snapshotEnabled = snapshotManager.enabled();
    if (snapshotEnabled && !(await snapshotManager.hasChanged(this.collection))) {
      return;
    }

    const model = this as any;

    const _schema = model._schema;

    if (_schema && _schema != 'public') {
      await this.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${_schema}";`, {
        raw: true,
        transaction: options?.transaction,
      });
    }

    // fix sequelize sync with model that not have any column
    if (Object.keys(model.tableAttributes).length === 0) {
      if (this.database.inDialect('sqlite', 'mysql')) {
        console.error(`Zero-column tables aren't supported in ${this.database.sequelize.getDialect()}`);
        return;
      }

      // @ts-ignore
      const queryInterface = this.sequelize.queryInterface;

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
        queryInterface.patched = true;
      }
    }

    const syncResult = this.collection.isInherited()
      ? await SyncRunner.syncInheritModel(model, options)
      : await SequelizeModel.sync.call(this, options);

    const queryInterface = this.sequelize.getQueryInterface();

    const tableName = this.getTableName();

    const columns = await queryInterface.describeTable(tableName, options);

    const findAttributeByColumnName = (columnName) => {
      return Object.values(this.rawAttributes).find((attribute) => {
        return attribute.field == columnName;
      });
    };

    // remove columns that not in model
    for (const columnName in columns) {
      const currentAttribute = findAttributeByColumnName(columnName);
      if (!currentAttribute) {
        let shouldDelete = true;

        if (this.collection.isInherited()) {
          const parentCollections = (<InheritedCollection>this.collection).getFlatParents();
          for (const parentCollection of parentCollections) {
            const parentColumns = await queryInterface.describeTable(
              parentCollection.getTableNameWithSchema(),
              options,
            );
            if (parentColumns[columnName]) {
              shouldDelete = false;
              break;
            }
          }
        }

        if (shouldDelete) {
          await queryInterface.removeColumn(tableName, columnName, options);
          continue;
        }
      }
    }

    // sync default values
    for (const columnName in columns) {
      const column = columns[columnName];
      if (column.primaryKey) continue;

      const currentAttribute = findAttributeByColumnName(columnName);
      if (!currentAttribute) continue;

      const attributeDefaultValue = currentAttribute.defaultValue;
      const columnDefaultValue = columns[columnName].defaultValue;

      if (columnDefaultValue === null && attributeDefaultValue === undefined) continue;

      if (columnDefaultValue !== attributeDefaultValue) {
        await queryInterface.changeColumn(
          tableName,
          columnName,
          {
            ...currentAttribute,
            defaultValue: attributeDefaultValue,
          },
          options,
        );
      }
    }

    // sync field unique option
    if (!this.database.inDialect('sqlite')) {
      const existsIndexes: any = await queryInterface.showIndex(tableName, options);
      const existsUniqueIndexes = existsIndexes.filter((index) => index.unique);

      const uniqueAttributes = Object.keys(this.rawAttributes).filter((key) => {
        return this.rawAttributes[key].unique == true;
      });

      for (const existUniqueIndex of existsUniqueIndexes) {
        const isSingleField = existUniqueIndex.fields.length == 1;
        if (!isSingleField) continue;
        const fieldName = existUniqueIndex.fields[0].attribute;
        const currentAttribute = this.rawAttributes[fieldName];
        if (!currentAttribute || (!currentAttribute.unique && !currentAttribute.primaryKey)) {
          if (this.database.inDialect('postgres')) {
            // @ts-ignore
            const constraints = await queryInterface.showConstraint(tableName, existUniqueIndex.name, options);
            if (constraints.some((c) => c.constraintName === existUniqueIndex.name)) {
              await queryInterface.removeConstraint(tableName, existUniqueIndex.name, options);
            }
          }

          await queryInterface.removeIndex(tableName, existUniqueIndex.name, options);
        }
      }

      for (const uniqueAttribute of uniqueAttributes) {
        // check index exists or not
        const indexExists = existsUniqueIndexes.find((index) => {
          return index.fields.length == 1 && index.fields[0].attribute == uniqueAttribute;
        });

        if (!indexExists) {
          await queryInterface.addIndex(tableName, [this.rawAttributes[uniqueAttribute].field], {
            unique: true,
            transaction: options?.transaction,
          });
        }
      }
    }

    if (snapshotEnabled) {
      await snapshotManager.saveSnapshot(this.collection);
    }

    return syncResult;
  }

  // TODO
  public toChangedWithAssociations() {
    // @ts-ignore
    this._changedWithAssociations = new Set([...this._changedWithAssociations, ...this._changed]);
    // @ts-ignore
    this._previousDataValuesWithAssociations = this._previousDataValues;
  }

  public changedWithAssociations(key?: string, value?: any) {
    if (key === undefined) {
      if (this._changedWithAssociations.size > 0) {
        return Array.from(this._changedWithAssociations);
      }
      return false;
    }
    if (value === true) {
      this._changedWithAssociations.add(key);
      return this;
    }
    if (value === false) {
      this._changedWithAssociations.delete(key);
      return this;
    }
    return this._changedWithAssociations.has(key);
  }

  public clearChangedWithAssociations() {
    this._changedWithAssociations = new Set();
  }

  public toJSON<T extends TModelAttributes>(): T {
    const handleObj = (obj, options: JSONTransformerOptions) => {
      const handles = [
        (data) => {
          if (data instanceof Model) {
            return data.toJSON();
          }

          return data;
        },
        this.hiddenObjKey,
      ];
      return handles.reduce((carry, fn) => fn.apply(this, [carry, options]), obj);
    };

    const handleArray = (arrayOfObj, options: JSONTransformerOptions) => {
      const handles = [this.sortAssociations];
      return handles.reduce((carry, fn) => fn.apply(this, [carry, options]), arrayOfObj || []);
    };

    const opts = {
      model: this.constructor as ModelStatic<any>,
      collection: (this.constructor as any).collection,
      db: (this.constructor as any).database as Database,
    };

    const traverseJSON = (data: T, options: JSONTransformerOptions): T => {
      const { model, db, collection } = options;
      // handle Object
      data = handleObj(data, options);

      const result = {};
      for (const key of Object.keys(data)) {
        // @ts-ignore
        if (model.hasAlias(key)) {
          const association = model.associations[key];
          const opts = {
            model: association.target,
            collection: db.getCollection(association.target.name),
            db,
            key,
            field: collection.getField(key),
          };

          if (['HasMany', 'BelongsToMany'].includes(association.associationType)) {
            result[key] = handleArray(data[key], opts).map((item) => traverseJSON(item, opts));
          } else {
            result[key] = data[key] ? traverseJSON(data[key], opts) : null;
          }
        } else {
          result[key] = data[key];
        }
      }

      return result as T;
    };

    return traverseJSON(super.toJSON(), opts);
  }

  private hiddenObjKey(obj, options: JSONTransformerOptions) {
    const hiddenFields = Array.from(options.collection.fields.values())
      .filter((field) => field.options.hidden)
      .map((field) => field.options.name);

    return lodash.omit(obj, hiddenFields);
  }

  private sortAssociations(data, { field }: JSONTransformerOptions): any {
    const sortBy = field.options.sortBy;
    return sortBy ? this.sortArray(data, sortBy) : data;
  }

  private sortArray(data, sortBy: string | string[]) {
    if (!lodash.isArray(sortBy)) {
      sortBy = [sortBy];
    }

    const orderItems = [];
    const orderDirections = [];

    sortBy.forEach((sortItem) => {
      orderDirections.push(sortItem.startsWith('-') ? 'desc' : 'asc');
      orderItems.push(sortItem.replace('-', ''));
    });

    return lodash.orderBy(data, orderItems, orderDirections);
  }
}
