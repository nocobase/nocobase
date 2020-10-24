import path from 'path';
import Database, { ModelCtor } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import CollectionModel from './models/collection';

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  const tables = database.import({
    directory: path.resolve(__dirname, 'tables'),
  });

  await database.sync();

  const Collection = database.getModel('collections') as ModelCtor<CollectionModel>;

  for (const [key, table] of tables) {
    const options = table.getOptions();
    const collection = await Collection.create({
      name: options.name,
      title: options.title,
    });
    await collection.updateAssociations({
      fields: options.fields.map(field => {
        return {
          type: field.type,
          name: field.name,
          options: field,
        };
      }),
    });
  }

  const collections = await Collection.findAll();
  await Promise.all(collections.map(async (collection) => {
    return await collection.modelInit();
  }));

  let first = false;

  resourcer.use(async (ctx, next) => {
    if (first) {
      return next();
    }
    first = true;
    const [Scope, User] = database.getModels(['scopes', 'users']);
    console.log('aaaa', {Scope, User});
    await next();
  });

  resourcer.import({
    directory: path.resolve(__dirname, 'resources'),
  });
}
