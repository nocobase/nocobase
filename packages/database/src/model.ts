import { Model as SequelizeModel, ModelCtor } from 'sequelize';
import { Collection } from './collection';
import { Database } from './database';
import lodash from 'lodash';

interface IModel {
  [key: string]: any;
}

interface JSONTransformerOptions {
  model: ModelCtor<any>;
  collection: Collection;
  db: Database;
}

type JSONTransformer = (data: any, options: JSONTransformerOptions) => any;

export class Model<TModelAttributes extends {} = any, TCreationAttributes extends {} = TModelAttributes>
  extends SequelizeModel<TModelAttributes, TCreationAttributes>
  implements IModel
{
  public static database: Database;
  public static collection: Collection;
  // [key: string]: any;

  public toJSON<T extends TModelAttributes>(): T {
    const opts = {
      model: this.constructor as ModelCtor<any>,
      collection: (this.constructor as any).collection,
      db: (this.constructor as any).database as Database,
    };

    return this.JSONTransformers().reduce((carry, fn) => fn.apply(this, [carry, opts]), super.toJSON());
  }

  JSONTransformers(): JSONTransformer[] {
    return [this.toJsonWithoutHiddenFields, this.sortAssociations];
  }

  private sortAssociations(data, { collection, model, db }: JSONTransformerOptions): any {
    const result = data;

    Object.keys(data).forEach((key) => {
      // @ts-ignore
      if (model.hasAlias(key)) {
        const association = model.associations[key];
        const opts = {
          model: association.target,
          collection: db.getCollection(association.target.name),
          db,
        };

        if (['HasMany', 'BelongsToMany'].includes(association.associationType)) {
          const associationField = collection.getField(key);
          const sortBy = associationField.options.sortBy;

          if (sortBy) {
            result[key] = this.sortArray(
              data[key].map((item) => this.sortAssociations(item, opts)),
              sortBy,
            );
          }
        } else {
          result[key] = this.sortAssociations(data[key], opts);
        }
      }
    });

    return result;
  }

  private sortArray(data, sortBy: string | string[]) {
    if (!lodash.isArray(sortBy)) {
      sortBy = [sortBy];
    }

    const orders = sortBy.map((sortItem) => {
      const direction = sortItem.startsWith('-') ? 'desc' : 'asc';
      sortItem.replace('-', '');
      return [sortItem, direction];
    });

    return lodash.sortBy(data, ...orders);
  }

  private toJsonWithoutHiddenFields(data, { collection, model, db }: JSONTransformerOptions): any {
    if (!data) {
      return data;
    }

    if (typeof data.toJSON === 'function') {
      data = data.toJSON();
    }

    const hidden = [];

    collection.forEachField((field) => {
      if (field.options.hidden) {
        hidden.push(field.options.name);
      }
    });

    const json = {};

    Object.keys(data).forEach((key) => {
      if (hidden.includes(key)) {
        return;
      }

      // @ts-ignore
      if (model.hasAlias(key)) {
        const association = model.associations[key];
        const opts = {
          model: association.target,
          collection: db.getCollection(association.target.name),
          db,
        };
        if (['HasMany', 'BelongsToMany'].includes(association.associationType)) {
          if (Array.isArray(data[key])) {
            json[key] = data[key].map((item) => this.toJsonWithoutHiddenFields(item, opts));
          }
        } else {
          json[key] = this.toJsonWithoutHiddenFields(data[key], opts);
        }
      } else {
        json[key] = data[key];
      }
    });

    return json;
  }
}
