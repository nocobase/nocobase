import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from './index';

describe.skipIf(process.env['DB_DIALECT'] === 'sqlite')('collection without id primary key', function () {
  let db: Database;
  let app: Application;
  let Collection: DBCollection;
  let Field: DBCollection;

  beforeEach(async () => {
    app = await createApp({
      database: { tablePrefix: '' },
    });
    db = app.db;
    Collection = db.getCollection('collections');
    Field = db.getCollection('fields');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create collection without id primary key', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'testA',
        autoGenId: false,
      },
      context: {},
    });

    await Field.repository.create({
      values: {
        key: 'test_field',
        name: 'name',
        interface: 'input',
        type: 'string',
        collectionName: 'testA',
        description: null,
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
          title: 'name',
        },
        primaryKey: true,
      },
      context: {},
    });

    const testA = db.getCollection('testA');
    const nameField = testA.getField('name');
    expect(nameField.get('primaryKey')).toBe(true);

    const tableDescription = await db.sequelize.getQueryInterface().describeTable(testA.getTableNameWithSchema());
    const nameColumn = tableDescription.name;

    expect(nameColumn).toBeDefined();
    expect(nameColumn.primaryKey).toBe(true);
  });
});
