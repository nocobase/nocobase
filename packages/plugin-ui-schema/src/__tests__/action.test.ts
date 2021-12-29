import { MockServer, mockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import PluginUiSchema from '../server';

describe('action test', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
      database: {
        logging: console.log,
      },
    });
    db = app.db;

    app.plugin(PluginUiSchema);

    await app.load();
    await db.sync();
  });

  it('should have ui schema collection', async () => {
    expect(db.getCollection('ui_schemas')).toBeDefined();
    expect(db.getCollection('ui_schema_tree_path')).toBeDefined();
  });

  it('should create ui_schema object', async () => {
    const response = await app
      .agent()
      .resource('ui_schemas')
      .create({
        values: {
          name: 'rootSchema',
        },
      });

    expect(response.statusCode).toEqual(200);

    const repository = db.getCollection('ui_schemas').repository;
    const object = await repository.findOne();
    expect(object.get('name')).toEqual('rootSchema');

    // it save tree path
    const treeRepository = db.getCollection('ui_schema_tree_path').repository;
    const path1 = await treeRepository.findOne();

    expect(path1.get('ancestor')).toEqual(object.get('key'));
    expect(path1.get('descendant')).toEqual(object.get('key'));
  });

  it('should create child ui_schema', async () => {
    await app
      .agent()
      .resource('ui_schemas')
      .create({
        values: {
          name: 'rootSchema',
        },
      });

    const repository = db.getCollection('ui_schemas').repository;
    const rootSchema = await repository.findOne({
      filter: {
        name: 'rootSchema',
      },
    });

    await app
      .agent()
      .resource('ui_schemas')
      .create({
        values: {
          name: 'child1',
          parentKey: rootSchema.get('key'),
        },
      });

    const child1 = await repository.findOne({
      filter: {
        name: 'child1',
      },
    });

    expect(child1).toBeDefined();

    const results = await db.getCollection('ui_schema_tree_path').repository.find();
    expect(results.length).toEqual(3);
  });

  it('should query children', async () => {
    await app
      .agent()
      .resource('ui_schemas')
      .create({
        values: {
          name: 'root',
        },
      });

    const repository = db.getCollection('ui_schemas').repository;
    const rootSchema = await repository.findOne({
      filter: {
        name: 'root',
      },
    });

    await app
      .agent()
      .resource('ui_schemas')
      .create({
        values: {
          name: 'child-1',
          parentKey: rootSchema.get('key'),
        },
      });

    await app
      .agent()
      .resource('ui_schemas')
      .create({
        values: {
          name: 'child-2',
          parentKey: rootSchema.get('key'),
        },
      });

    const child1 = await repository.findOne({
      filter: {
        name: 'child-1',
      },
    });

    await app
      .agent()
      .resource('ui_schemas')
      .create({
        values: {
          name: 'child-1-1',
          parentKey: child1.get('key'),
        },
      });

    await app
      .agent()
      .resource('ui_schemas')
      .create({
        values: {
          name: 'child-1-2',
          parentKey: child1.get('key'),
        },
      });
  });
});
