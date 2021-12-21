import { Database } from '@nocobase/database';
import { Model } from 'sequelize';
import lodash from 'lodash';

export class FieldModel {
  model: Model;
  db: Database;

  type: string;

  constructor(model: Model, db: Database) {
    this.model = model;
    this.db = db;
    this.type = <string>model.get('type');
  }

  // field model to field options
  asFieldOption() {
    return {
      type: this.type,
    };
  }

  validate() {
    // if it is a relation field, check target exists or not
    if (FieldModel.isRelationFieldType(this.type)) {
      const target = <string | undefined>lodash.get(this.model.get('options'), 'target');

      if (!target) {
        throw new Error(`cant save relation field without target`);
      }
      //
      // const targetCollection = this.db.getCollection(target);
      //
      // if (!targetCollection) {
      //   throw new Error(`${target} collection not exists`);
      // }
    }
  }

  static isRelationFieldType(type: string) {
    const relationTypes = ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'];

    return relationTypes.includes(type);
  }

  static reverseRelationType(type: string) {
    return {
      hasOne: 'belongsTo',
      hasMany: 'belongsTo',
      belongsToMany: 'belongsToMany',
    }[type];
  }
}
