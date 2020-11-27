import path from 'path';
import Database, { ModelCtor } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import CollectionModel from './models/collection';
import FieldModel from './models/field';

export default async function (this: any, options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  const [Collection, Field, Action] = database.getModels(['collections', 'fields', 'actions']);

  Collection.addHook('beforeValidate', async function (model: CollectionModel) {
    if (!model.get('name')) {
      model.setDataValue('name', this.generateName());
    }
  });

  Collection.addHook('afterCreate', async function (model: CollectionModel) {
    console.log('afterCreate');
    await model.migrate();
  });

  Field.addHook('beforeCreate', async function (model: FieldModel) {
    console.log('beforeCreate', model.toJSON());
  });

  Field.addHook('afterCreate', async function (model: FieldModel) {
    console.log('afterCreate', model.toJSON());
    await model.migrate();
  });

  Action.addHook('beforeCreate', async function (model: CollectionModel) {
    console.log('beforeCreate', model.toJSON());
  });

  Action.addHook('afterCreate', async function (model: CollectionModel) {
    // console.log('afterCreate');
  });
}
