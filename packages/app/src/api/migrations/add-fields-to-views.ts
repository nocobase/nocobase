import api from '../app';
import Database from '@nocobase/database';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await api.database.sync({
    tables: ['views'],
  });
  const [Collection, Page, User] = database.getModels(['collections', 'pages', 'users']);
  const table = database.getTable('views');
  const collection = await Collection.findByName('views');
  console.log(table.getOptions().fields);
  await collection.updateAssociations({
    fields: table.getOptions().fields,
  }, {
    migrate: false,
  });
})();
