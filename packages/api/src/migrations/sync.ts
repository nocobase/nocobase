import api from '../app';
import Database from '@nocobase/database';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await api.database.sync({
  });

  const [Collection] = database.getModels(['collections']);

  const tables = database.getTables();

  for (let table of tables) {
    console.log(table.getName());
    await Collection.import(table.getOptions(), { migrate: false });
  }
})();
