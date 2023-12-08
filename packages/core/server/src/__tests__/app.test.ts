import { DataTypes } from '@nocobase/database';
import Plugin from '../plugin';
import { MockServer, mockServer } from '@nocobase/test';
import { vi } from 'vitest';
describe('app destroy', () => {
  let app: MockServer;
  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });
  test('case1', async () => {
    app = mockServer();
    await app.cleanDb();
    await app.load();
    await app.install();
    app.pm.collection.addField('foo', {
      type: 'string',
    });
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
    app.pm.collection.addField('foo', {
      type: 'string',
    });
    await app.upgrade();
    const exists = await app.pm.collection.getField('foo').existsInDb();
    expect(exists).toBeTruthy();
  });
  test('case3', async () => {
    app = mockServer();
    await app.cleanDb();
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
    app.pm.collection.addField('foo', {
      type: 'string',
      unique: true,
    });
    await app.upgrade();
    const exists = await app.pm.collection.getField('foo').existsInDb();
    expect(exists).toBeTruthy();
  });
  test('case4', async () => {
    class P extends Plugin {
      async load() {
        this.db.collection({
          name: 'test',
          fields: [],
        });
      }
    }
    app = mockServer({
      plugins: [P],
    });
    await app.cleanDb();
    await app.load();
    await app.install();
    await app.db.getRepository('test').create({
      values: {},
    });
    await app.install();
    expect(await app.db.getRepository('test').count()).toBe(1);
    await app.install({
      clean: true,
    });
    expect(await app.db.getRepository('test').count()).toBe(0);
  });
  test('app main already exists', async () => {
    mockServer();
    expect(() => mockServer()).toThrow('app main already exists');
  });
  test('command', async () => {
    const loadFn = vi.fn();
    app = mockServer();
    const command = app.command('foo');
    command.command('bar').action(() => loadFn());
    await app.runCommand('foo', 'bar');
    expect(loadFn).toBeCalled();
    expect(loadFn).toBeCalledTimes(1);
  });
});
