import { Database, Model } from '@nocobase/database';
import { FieldOptions } from '../collection-manager';
import lodash from 'lodash';
import { CollectionModel } from './collection-model';

export class FieldModel extends Model {
  async migrate() {
    await this.load();

    const collectionModel = await this.getCollectionModel();
    await collectionModel.migrate();
  }

  async getCollectionModel(): Promise<CollectionModel> {
    // @ts-ignore
    const db: Database = this.constructor.database;

    return (await db.getCollection('collections').repository.findOne({
      filter: {
        key: this.get('collectionKey') as string,
      },
    })) as CollectionModel;
  }

  async load() {
    // @ts-ignore
    const db: Database = this.constructor.database;
    const fieldOptions = this.asFieldOptions();
    const rawOptions = this.get('options') as any;

    if (FieldModel.isSubTableOptions(rawOptions)) {
      // if it is a subField, load subField collection first
      const subTableName = fieldOptions['target'];
      const collectionInstance = (await db.getCollection('collections').repository.findOne({
        filter: {
          name: subTableName,
        },
      })) as CollectionModel;

      await collectionInstance.load();
    }

    let collection = db.getCollection(this.get('collectionName') as string);

    if (!collection) {
      const collectionInstance = await this.getCollectionModel();

      collection = await collectionInstance.load({ loadField: false });
    }

    collection.addField(this.get('name') as string, fieldOptions);
  }

  asFieldOptions() {
    const type = this.get('type') as string;

    let options = {
      type,
    };

    if (FieldModel.isRelationFieldType(type)) {
      const relationOptions = this.relationOptions(type);
      options['target'] = this.get('options')['target'];

      options = {
        ...options,
        ...relationOptions,
      };
    } else {
      options = {
        ...options,
        ...(this.get('options') as any),
      };
    }

    return options;
  }

  relationOptions(type: string) {
    const options = {};

    const allowOptions = {
      belongsToMany: ['through', 'sourceKey', 'targetKey', 'otherKey', 'foreignKey'],
      hasOne: ['sourceKey', 'foreignKey'],
      belongsTo: ['targetKey', 'foreignKey'],
      hasMany: ['sourceKey', 'foreignKey'],
    }[type];

    if (allowOptions) {
      const modelOptions = <any>this.get('options');
      for (const option of allowOptions) {
        if (modelOptions[option]) {
          options[option] = modelOptions[option];
        }
      }
    }

    return options;
  }

  static isRelationFieldType(type: string) {
    const relationTypes = ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'];

    return relationTypes.includes(type);
  }

  static isSubTableOptions(options: FieldOptions) {
    return options.type == 'hasMany' && lodash.isArray(options.children) && options.children.length > 0;
  }

  isSubTableField() {
    return FieldModel.isSubTableOptions(this.get('options'));
  }

  static reverseRelationType(type: string) {
    return {
      hasOne: 'belongsTo',
      hasMany: 'belongsTo',
      belongsToMany: 'belongsToMany',
    }[type];
  }
}
