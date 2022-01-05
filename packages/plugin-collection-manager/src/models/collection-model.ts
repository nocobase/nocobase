import { Collection, Database, HasManyRepository, Model } from '@nocobase/database';
import { FieldModel } from './field-model';
import lodash from 'lodash';
import merge from 'deepmerge';

export class CollectionModel extends Model {
  set(key: any, value?: any, options?: any) {
    if (typeof key === 'string') {
      const [column] = key.split('.');
      if ((this.constructor as any).hasAlias(column)) {
        return super.set(key, value, options);
      }
      if ((this.constructor as any).rawAttributes[column]) {
        return super.set(key, value, options);
      }

      if (lodash.isPlainObject(value)) {
        const opts = super.get(`options`) || {};
        return super.set(`options.${key}`, merge(opts?.[key], value), options);
      }

      return super.set(`options.${key}`, value, options);
    } else {
      Object.keys(key).forEach((k) => {
        this.set(k, key[k], options);
      });
    }
    return super.set(key, value, options);
  }

  get(key?: any, value?: any): any {
    if (typeof key === 'string') {
      const [column] = key.split('.');
      if ((this.constructor as any).hasAlias(column)) {
        return super.get(key, value);
      }
      if ((this.constructor as any).rawAttributes[column]) {
        return super.get(key, value);
      }
      const options = super.get(`options`);
      return lodash.get(options, key);
    }
    const data = super.get(key, value);
    return {
      ...lodash.omit(data, 'options'),
      ...data.options,
    };
  }

  async load(loadOptions?: { loadField: boolean }): Promise<Collection> {
    const instance = this;

    // @ts-ignore
    const db: Database = this.constructor.database;

    const options = instance.asCollectionOptions();

    // @ts-ignore
    const collectionFields: FieldModel[] = await instance.getFields();

    const fieldsAsObject: { [key: string]: FieldModel } = collectionFields.reduce((carry, field) => {
      carry[field.get('name') as string] = field;
      return carry;
    }, {});

    let collection = db.getCollection(options.name);

    if (!collection) {
      // create new collection
      collection = db.collection(options);
    }

    if (lodash.get(loadOptions, 'loadField', true) == false) {
      return collection;
    }

    const existsFields = collection.fields;

    // add field
    const addFieldNames = lodash.difference(Object.keys(fieldsAsObject), Array.from(existsFields.keys()));

    for (const addFieldName of addFieldNames) {
      const fieldModel = fieldsAsObject[addFieldName];
      await fieldModel.load();
    }

    const deleteNames = lodash.difference(Array.from(existsFields.keys()), Object.keys(fieldsAsObject));

    for (const deleteName of deleteNames) {
      collection.removeField(deleteName);
    }

    return collection;
  }

  async migrate() {
    const collection = await this.load();

    await collection.sync({
      force: false,
      alter: {
        drop: false,
      },
    });
  }

  asCollectionOptions() {
    return {
      name: this.get('name') as string,
    };
  }
}
