import api from '../app';
import Database from '@nocobase/database';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await api.database.sync({
    tables: ['scopes'],
  });

  const [Collection, User, Role] = database.getModels(['collections', 'users', 'roles']);

  const tables = database.getTables(['scopes']);

  for (let table of tables) {
    console.log(table.getName());
    await Collection.import(table.getOptions(), { update: true, migrate: false });
  }
})();
