import api from '../app';
import Database from '@nocobase/database';

(async () => {
  await api.loadPlugins();
  const database: Database = api.database;
  await api.database.sync({
    tables: ['actions_scopes', 'action_logs', 'action_changes'],
  });

  const [Collection, Page] = database.getModels(['collections', 'pages']);

  const tables = database.getTables(['actions_scopes', 'action_logs', 'action_changes']);

  for (let table of tables) {
    console.log(table.getName());
    await Collection.import(table.getOptions(), { update: true, migrate: false });
  }

  await Page.import({
    title: '动态',
    type: 'layout',
    path: '/activity',
    icon: 'NotificationOutlined',
    template: 'SideMenuLayout',
    sort: 85,
    showInMenu: true,
    parent_id: 1,
    children: [
      {
        title: '操作记录',
        type: 'collection',
        path: '/activity/logs',
        icon: 'HistoryOutlined',
        template: 'collection',
        collection: 'action_logs',
        sort: 80,
        showInMenu: true,
      },
    ]
  });
})();
