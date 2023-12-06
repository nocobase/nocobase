import { Database } from '@nocobase/database';
import { uid } from '@nocobase/utils';
import { MockServer, mockServer } from '@nocobase/test';
import PluginCollectionView from '@nocobase/plugin-collection-view';

describe('view repository', () => {
  let db: Database;

  let app: MockServer;
  beforeEach(async () => {
    app = mockServer({});

    await app.cleanDb();
    app.plugin(PluginCollectionView);
    await app.loadAndInstall();

    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should support find view without primary key', async () => {
    const UserCollection = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    await db.sync();

    await UserCollection.repository.create({
      values: [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }],
    });

    const viewName = `t_${uid(6)}`;
    const dropSQL = `DROP VIEW IF EXISTS ${viewName};`;
    await db.sequelize.query(dropSQL);

    const viewSQL = `CREATE VIEW ${viewName} AS select id as aaa, name from ${UserCollection.quotedTableName()}`;

    await db.sequelize.query(viewSQL);

    const viewCollection = db.collection({
      name: viewName,
      view: true,
      schema: db.inDialect('postgres') ? 'public' : undefined,
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'integer',
          name: 'aaa',
        },
      ],
    });

    const results = await viewCollection.repository.findAndCount({
      offset: 1,
      limit: 1,
    });

    expect(results[0].length).toBe(1);
    expect(results[1]).toBe(4);
  });
});
