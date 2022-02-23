import { Model as SequelizeModel } from 'sequelize';
import { Collection } from './collection';
import { Database } from './database';

interface IModel {
  [key: string]: any;
}

export class Model<TModelAttributes extends {} = any, TCreationAttributes extends {} = TModelAttributes>
  extends SequelizeModel<TModelAttributes, TCreationAttributes>
  implements IModel
{
  public static database: Database;
  public static collection: Collection;
  // [key: string]: any;

  private toJsonWithoutHiddenFields(data, { model, collection }): any {
    if (!data) {
      return data;
    }
    if (typeof data.toJSON === 'function') {
      data = data.toJSON();
    }
    const db = (this.constructor as any).database as Database;
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
      if (model.hasAlias(key)) {
        const association = model.associations[key];
        const opts = {
          model: association.target,
          collection: db.getCollection(association.target.name),
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

  public toJSON<T extends TModelAttributes>(): T {
    return this.toJsonWithoutHiddenFields(super.toJSON(), {
      model: this.constructor,
      collection: (this.constructor as any).collection,
    });
  }
}
