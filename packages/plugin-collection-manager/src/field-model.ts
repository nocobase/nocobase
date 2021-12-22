import { Database } from '@nocobase/database';
import { Model } from 'sequelize';
import lodash from 'lodash';
import { FieldOptions } from './collection-manager';
import { CollectionModel } from './collection-model';

export class FieldModel {
  model: Model;
  db: Database;
  type: string;

  constructor(model: Model, db: Database) {
    this.model = model;
    this.db = db;
    this.type = <string>model.get('type');
  }

  async collection() {
    const collectionKey = <string>this.model.get('collectionKey');
    const collectionInstance = await this.db.getCollection('collections').repository.findOne({
      filter: {
        key: collectionKey,
      },
    });

    return this.db.getCollection(<string>collectionInstance.get('name'));
  }

  // field model to field options
  asFieldOption() {
    let options = {
      type: this.type,
    };

    if (FieldModel.isRelationFieldType(this.type)) {
      const relationOptions = this.relationOptions(this.type);
      options['target'] = this.model.get('options')['target'];

      options = {
        ...options,
        ...relationOptions,
      };
    }

    return options;
  }

  relationOptions(type: string) {
    const model = this.model;

    const options = {};

    const allowOptions = {
      belongsToMany: ['through', 'sourceKey', 'targetKey', 'otherKey', 'foreignKey'],
      hasOne: ['sourceKey', 'foreignKey'],
    }[type];

    if (allowOptions) {
      const modelOptions = <any>model.get('options');
      for (const option of allowOptions) {
        if (modelOptions[option]) {
          options[option] = modelOptions[option];
        }
      }
    }

    return options;
  }

  async load() {
    const fieldOptions = this.asFieldOption();

    const fieldModelOptions = this.model.get('options');

    if (FieldModel.isSubTableOptions(fieldModelOptions)) {
      // if it is a subField, load subField collection first
      const subTableName = fieldOptions['target'];
      const collectionInstance = await this.db.getCollection('collections').repository.findOne({
        filter: {
          name: subTableName,
        },
      });

      const collectionModel = new CollectionModel(collectionInstance, this.db);
      await collectionModel.load();
    }

    const collection = await this.collection();
    collection.addField(this.model.get('name') as string, fieldOptions);
  }

  validate() {
    // if it is a relation field, check target exists or not
    if (FieldModel.isRelationFieldType(this.type)) {
      const target = <string | undefined>lodash.get(this.model.get('options'), 'target');

      if (!target) {
        throw new Error(`cant save relation field without target`);
      }
    }
  }

  static isRelationFieldType(type: string) {
    const relationTypes = ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'];

    return relationTypes.includes(type);
  }

  static isSubTableOptions(options: FieldOptions) {
    return options.type == 'hasMany' && lodash.isArray(options.children) && options.children.length > 0;
  }

  static reverseRelationType(type: string) {
    return {
      hasOne: 'belongsTo',
      hasMany: 'belongsTo',
      belongsToMany: 'belongsToMany',
    }[type];
  }
}
