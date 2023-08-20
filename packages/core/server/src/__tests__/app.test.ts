import { DataTypes, mockDatabase } from '@nocobase/database';
import { AppSupervisor } from '../app-supervisor';
import Application, { ApplicationOptions } from '../application';

const mockServer = (options?: ApplicationOptions) => {
  return new Application({
    database: mockDatabase(),
    acl: false,
    ...options,
  });
};

describe('application life cycle', () => {
  let app: Application;

  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
    AppSupervisor.getInstance().apps = {};
  });

  test('case1', async () => {
    const app = mockServer();
    await app.load();
    await app.install();
    app.pm.collection.addField('foo', { type: 'string' });
    await app.upgrade();
    const exists = await app.pm.collection.getField('foo').existsInDb();
    expect(exists).toBeTruthy();
  });

  test('case2', async () => {
    app = mockServer();
    await app.load();
    app.db.addMigration({
      name: 'test',
      up: () => {
        console.log('up...');
      },
    });
    await app.install();
    app.pm.collection.addField('foo', { type: 'string' });
    await app.upgrade();
    const exists = await app.pm.collection.getField('foo').existsInDb();
    expect(exists).toBeTruthy();
  });

  test('case3', async () => {
    app = mockServer();
    await app.load();
    const tableNameWithSchema = app.db.getCollection('applicationPlugins').getTableNameWithSchema();
    app.db.addMigration({
      name: 'test',
      up: async () => {
        await app.db.sequelize.getQueryInterface().addColumn(tableNameWithSchema, 'foo', {
          type: DataTypes.STRING,
        });
        await app.db.sequelize.getQueryInterface().addConstraint(tableNameWithSchema, {
          type: 'unique',
          fields: ['foo'],
        });
      },
    });
    await app.install();
    app.pm.collection.addField('foo', { type: 'string', unique: true });
    await app.upgrade();
    const exists = await app.pm.collection.getField('foo').existsInDb();
    expect(exists).toBeTruthy();
  });
});
