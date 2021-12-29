import { mockServer, MockServer } from '@nocobase/test';
import { Collection, Database } from '@nocobase/database';
import PluginUiSchema from '../server';
import UiSchemaRepository from '../repository';
import { SchemaNode } from '../dao/ui_schema_node_dao';

describe('ui_schema repository', () => {
  let app: MockServer;
  let db: Database;
  let repository: UiSchemaRepository;

  let treePathCollection: Collection;

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
    });

    db = app.db;

    app.plugin(PluginUiSchema);

    await app.load();
    await db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });
    repository = db.getCollection('ui_schemas').repository as UiSchemaRepository;
    treePathCollection = db.getCollection('ui_schema_tree_path');
  });

  it('should be registered', async () => {
    expect(db.getCollection('ui_schemas').repository).toBeInstanceOf(UiSchemaRepository);
  });

  it('should insert single ui schema node', async () => {
    const singleNode: SchemaNode = {
      name: 'test',
      'x-uid': 'test',
      schema: {},
    };

    await repository.insertSingleNode(singleNode);

    // it should save in ui schema tables
    const testNode = await repository.findOne({
      filter: {
        uid: 'test',
      },
    });

    expect(testNode).not.toBeNull();

    // it should save tree path
    const results = await treePathCollection.repository.find();
    expect(results.length).toEqual(1);
  });

  it('should insert child node', async () => {
    const singleNode: SchemaNode = {
      name: 'test',
      'x-uid': 'test',
      schema: {},
    };

    await repository.insertSingleNode(singleNode);

    const child1: SchemaNode = {
      name: 'child1',
      'x-uid': 'child1',
      schema: {},
      childOptions: {
        parentUid: 'test',
        type: 'test',
      },
    };

    await repository.insertSingleNode(child1);

    const child11: SchemaNode = {
      name: 'child11',
      'x-uid': 'child11',
      schema: {},
      childOptions: {
        parentUid: 'child1',
        type: 'test',
      },
    };
    await repository.insertSingleNode(child11);

    expect(
      (
        await treePathCollection.repository.findOne({
          filter: {
            ancestor: 'test',
            descendant: 'test',
          },
        })
      ).get('depth'),
    ).toEqual(0);

    expect(
      (
        await treePathCollection.repository.findOne({
          filter: {
            ancestor: 'test',
            descendant: 'child1',
          },
        })
      ).get('depth'),
    ).toEqual(1);

    expect(
      (
        await treePathCollection.repository.findOne({
          filter: {
            ancestor: 'test',
            descendant: 'child11',
          },
        })
      ).get('depth'),
    ).toEqual(2);

    expect(
      (
        await treePathCollection.repository.findOne({
          filter: {
            ancestor: 'child1',
            descendant: 'child11',
          },
        })
      ).get('depth'),
    ).toEqual(1);
  });

  describe('schema', () => {
    let schema;
    beforeEach(() => {
      schema = {
        type: 'object',
        title: 'title',
        name: 'root',
        properties: {
          a1: {
            type: 'string',
            title: 'A1',
            'x-component': 'Input',
          },
          b1: {
            'x-async': true, // 添加了一个异步节点
            type: 'string',
            title: 'B1',
            properties: {
              c1: {
                type: 'string',
                title: 'C1',
              },
              d1: {
                'x-async': true,
                type: 'string',
                title: 'D1',
              },
            },
          },
        },
      };
    });

    it('should turn schema to single nodes', async () => {
      const nodes = UiSchemaRepository.schemaToSingleNodes(schema);
      expect(nodes.length).toEqual(5);
    });

    it('should save schema', async () => {
      await repository.insert(schema);

      expect(await repository.count()).toEqual(5);
    });

    it('should getJsonSchema', async () => {
      await repository.insert(schema);
      const rootNode = await repository.findOne({
        filter: {
          name: 'root',
        },
      });

      const results = await repository.getJsonSchema(rootNode.get('uid') as string);

      expect(results).toMatchObject({
        type: 'object',
        title: 'title',
        properties: {
          a1: {
            type: 'string',
            title: 'A1',
            'x-component': 'Input',
          },
        },
        name: 'root',
      });
    });

    it('should getProperties', async () => {
      await repository.insert(schema);
      const rootNode = await repository.findOne({
        filter: {
          name: 'root',
        },
      });

      const results = await repository.getProperties(rootNode.get('uid') as string);

      expect(results).toMatchObject({
        type: 'object',
        properties: {
          a1: {},
          b1: {
            'x-async': true,
            properties: {
              c1: {},
            },
          },
        },
      });
    });
  });
});
