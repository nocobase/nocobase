import api from '../app';
import Database from '@nocobase/database';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await api.database.sync({
    tables: ['views'],
  });
  const [Collection, View, User] = database.getModels(['collections', 'views', 'users']);
  const table = database.getTable('views');
  const collection = await Collection.findByName('views');
  console.log(table.getOptions().fields);
  await collection.updateAssociations({
    fields: table.getOptions().fields,
  }, {
    migrate: false,
  });

  const views = await View.findAll();
  for (const view of views) {
    if (!view.get('mode')) {
      if (view.get('template') === 'SimpleTable') {
        view.set('mode', 'simple');
      } else {
        view.set('mode', 'default');
      }
      await view.save();
    }
  }
})();
