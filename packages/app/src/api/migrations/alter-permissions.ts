import api from '../app';
import Database from '@nocobase/database';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await api.database.sync({
    // tables: ['roles'],
  });

  const [Collection, User, Role] = database.getModels(['collections', 'users', 'roles']);

  const tables = database.getTables();

  for (let table of tables) {
    console.log(table.getName());
    await Collection.import(table.getOptions(), { update: true, migrate: false });
  }

  let user = await User.findOne({
    where: {
      username: "admin",
    },
  });

  const role = await Role.findOne({
    where: {
      title: '系统开发组',
    }
  });

  role.set('type', -1);

  await role.save();
  await user.setRoles([role]);
})();
