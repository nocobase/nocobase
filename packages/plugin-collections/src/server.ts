import path from 'path';
import { Application } from '@nocobase/server';
import CollectionModel from './models/collection';
import FieldModel from './models/field';

export default async function (this: Application, options = {}) {
  const database = this.database;
  const resourcer = this.resourcer;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  const [Collection, Field, Action] = database.getModels(['collections', 'fields', 'actions']);

  // 加载数据库表 collections 中已经保存的表配置
  // await Collection.findAll();

  Collection.addHook('beforeValidate', async function (model: CollectionModel) {
    if (!model.get('name')) {
      model.setDataValue('name', this.generateName());
    }
  });

  Collection.addHook('afterCreate', async function (model: CollectionModel) {
    await model.migrate();
  });

  Field.addHook('beforeValidate', async function (model: FieldModel) {
    if (!model.get('name')) {
      model.setDataValue('name', this.generateName());
    }
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
