import api from '../app';
import Database from '@nocobase/database';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await api.database.sync({
    tables: ['actions_scopes'],
  });

  const [Collection, User, Role] = database.getModels(['collections', 'users', 'roles']);

  const tables = database.getTables(['actions_scopes']);

  for (let table of tables) {
    console.log(table.getName());
    await Collection.import(table.getOptions(), { update: true, migrate: false });
  }
})();
