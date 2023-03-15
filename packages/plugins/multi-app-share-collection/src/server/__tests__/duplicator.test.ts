import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import { Dumper } from '@nocobase/plugin-duplicator';

const pgOnly = () => (process.env.DB_DIALECT == 'postgres' ? describe : describe.skip);

pgOnly()('dump with share collection', () => {
  let mainDb: Database;
  let mainApp: MockServer;

  beforeEach(async () => {
    const app = mockServer({
      acl: false,
      plugins: ['nocobase'],
    });

    await app.load();

    await app.db.sequelize.query(`DROP SCHEMA IF EXISTS sub1 CASCADE`);
    await app.db.sequelize.query(`DROP SCHEMA IF EXISTS sub2 CASCADE`);

    await app.install({
      clean: true,
    });

    await app.pm.enable('multi-app-manager');
    await app.pm.enable('multi-app-share-collection');

    await app.start();

    mainApp = app;

    mainDb = mainApp.db;
  });

  afterEach(async () => {
    await mainApp.destroy();
  });

  it('should dump with share collection', async () => {
    await mainApp.db.getRepository('applications').create({
      values: {
        name: 'sub1',
      },
    });

    const sub1 = await mainApp.appManager.getApplication('sub1');

    const shareWithSub1Collection = await mainApp.db.getRepository('collections').create({
      values: {
        name: 'share-with-sub1',
      },
      context: {},
    });

    shareWithSub1Collection.set('syncToApps', ['sub1']);

    await shareWithSub1Collection.save();

    await mainApp.db.getRepository('collections').create({
      values: {
        name: 'mainAppOnly',
      },
      context: {},
    });

    const dumper = new Dumper(sub1);

    dumper.setCustomCollectionsFilter({
      'options.syncToApps::JSONB.$contains': `["${sub1.name}"]`,
    });

    const dumpableCollections = await dumper.dumpableCollections();

    // should dump share collection only
    const userCollections = dumpableCollections.userCollections;
    expect(userCollections.length).toBe(1);
  });
});
