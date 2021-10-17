import Application from '../../../server/src/application';
import { getInitSqls } from '../server';

function runSql(sql, database) {
  const trimmed = sql.trim();
  if (trimmed.length == 0) {
    return;
  }
  return database.sequelize.query(trimmed, {
    raw: true,
  });
}

test('import demo data', async () => {
  const app = new Application({
    database: {
      dialect: 'sqlite',
      dialectModule: require('sqlite3'),
      storage: 'db.sqlite',
      logging: false,
    },
  });

  const plugins = [
    '@nocobase/plugin-ui-router',
    '@nocobase/plugin-ui-schema',
    '@nocobase/plugin-collections',
    '@nocobase/plugin-users',
    '@nocobase/plugin-action-logs',
    '@nocobase/plugin-file-manager',
    '@nocobase/plugin-permissions',
    '@nocobase/plugin-export',
    '@nocobase/plugin-system-settings',
    '@nocobase/plugin-china-region',
  ];

  for (const plugin of plugins) {
    const pluginPath = `${plugin}/src/server`.replace(
      '@nocobase/',
      '../../../',
    );
    app.plugin((await import(pluginPath)).default);
  }

  await app.load();

  await app.db.sync({ force: true });

  await app.emitAsync('db.init');

  const database = app.db;

  const sqls = getInitSqls();

  for (const sqlGroup of sqls.part1) {
    for (const sql of sqlGroup.split(';')) {
      await runSql(sql, database);
    }
  }

  await app.db.getModel('collections').load({
    skipExisting: true,
  });
  await app.db.sync();

  for (const sqlGroup of sqls.part2) {
    for (const sql of sqlGroup.split(';')) {
      try {
        await runSql(sql, database);
      } catch (e) {
        console.error(e);
      }
    }
  }
});
