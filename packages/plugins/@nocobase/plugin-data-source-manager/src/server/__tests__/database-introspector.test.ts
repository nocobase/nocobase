import { createMockServer, MockServer } from '@nocobase/test';
import { DatabaseIntrospector } from '../services/database-introspector';
import { Database } from '@nocobase/database';

describe('database introspector', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'database-connections'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should infer collection name', async () => {
    const introspector = new DatabaseIntrospector(app.db);

    const databaseSchema = app.db.options.schema;

    expect(introspector.tableInfoToCollectionOptions({ tableName: 'test1' })).toMatchObject({
      tableName: 'test1',
      name: 'test1',
    });

    expect(introspector.tableInfoToCollectionOptions({ tableName: 'test1', schema: databaseSchema })).toMatchObject({
      tableName: 'test1',
      schema: databaseSchema,
      name: 'test1',
    });

    expect(introspector.tableInfoToCollectionOptions({ tableName: 'test1', schema: 'some-new-schema' })).toMatchObject({
      tableName: 'test1',
      schema: 'some-new-schema',
      name: 'test1',
    });
  });

  it('should infer with default interface option', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test1',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],

        timestamps: false,
      },
      context: {},
    });

    const testCollection = app.db.getCollection('test1');
    const introspector = new DatabaseIntrospector(app.db);

    const collectionOptions = await introspector.getCollection({
      tableInfo: testCollection.getTableNameWithSchema(),
    });

    const titleField = collectionOptions.fields.find((field) => field.name === 'title');
    expect(titleField.interface).toBe('input');
  });

  it('should list collections', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test1',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],

        timestamps: false,
      },
      context: {},
    });

    await app.db.getRepository('collections').create({
      values: {
        name: 'test2',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const introspector = new DatabaseIntrospector(app.db);
  });

  it('should introspect collection', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test1',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],

        timestamps: false,
      },
      context: {},
    });

    const tableNameWithSchema = app.db.getCollection('test1').getTableNameWithSchema();

    const introspector = new DatabaseIntrospector(app.db);

    const collectionOptions = await introspector.getCollection({
      tableInfo: tableNameWithSchema,
    });

    expect(collectionOptions).toMatchObject({
      name: 'test1',
      tableName: tableNameWithSchema.tableName,
      schema: tableNameWithSchema.schema,
    });

    const fields = collectionOptions.fields;

    expect(fields).toHaveLength(2);

    const idField = fields.find((field) => field.name === 'id');
    const titleField = fields.find((field) => field.name === 'title');

    expect(idField).toMatchObject({
      name: 'id',
      type: 'bigInt',
      primaryKey: true,
      uiSchema: {
        title: 'id',
      },
    });

    expect(titleField).toMatchObject({
      name: 'title',
      type: 'string',
      allowNull: true,
      primaryKey: false,
      uiSchema: {
        title: 'title',
      },
    });
  });

  it('should merge local options with remote options', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test1',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],

        timestamps: false,
      },
      context: {},
    });

    const tableNameWithSchema = app.db.getCollection('test1').getTableNameWithSchema();

    const introspector = new DatabaseIntrospector(app.db);

    const collectionOptions = await introspector.getCollection({
      tableInfo: tableNameWithSchema,
      localOptions: {
        title: 'local title',
      },
    });

    expect(collectionOptions.title).toEqual('local title');
  });

  it('should load collections into database', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test1',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],

        timestamps: false,
      },
      context: {},
    });

    await app.db.getRepository('test1').create({
      values: [
        {
          title: 't1',
        },
        {
          title: 't2',
        },
      ],
    });

    const tableNameWithSchema = app.db.getCollection('test1').getTableNameWithSchema();

    const remoteDatabaseOptions = {
      ...app.db.options,
    };

    const remoteDatabaseInstance = new Database(remoteDatabaseOptions);

    const introspector = new DatabaseIntrospector(remoteDatabaseInstance);

    const collectionOptions = await introspector.getCollection({
      tableInfo: tableNameWithSchema,
    });

    introspector.loadCollection(collectionOptions);

    expect(remoteDatabaseInstance.getCollection('tests1')).toBeTruthy();

    const countRes = await remoteDatabaseInstance.getCollection('tests1').repository.count();
    expect(countRes).toBe(2);
  });
});
