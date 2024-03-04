import lodash from 'lodash';
import { Model as SequelizeModel, ModelStatic } from 'sequelize';
import { Collection } from './collection';
import { Database } from './database';
import { Field } from './fields';
import { SyncRunner } from './sync-runner';

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

  public get db(): Database {
    // @ts-ignore
    return this.constructor.database;
  }

  static async sync(options) {
    const runner = new SyncRunner(this);
    return runner.runSync(options);
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
