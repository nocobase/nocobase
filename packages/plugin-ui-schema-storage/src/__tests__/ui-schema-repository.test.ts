import { Collection, Database } from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';
import { SchemaNode } from '../dao/ui_schema_node_dao';
import UiSchemaRepository from '../repository';
import PluginUiSchema from '../server';

describe('ui_schema repository', () => {
  let app: MockServer;
  let db: Database;
  let repository: UiSchemaRepository;

  let treePathCollection: Collection;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
    });

    db = app.db;

    const queryInterface = db.sequelize.getQueryInterface();
    await queryInterface.dropAllTables();

    app.plugin(PluginUiSchema);

    await app.load();
    await db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });
    repository = db.getCollection('uiSchemas').repository as UiSchemaRepository;
    treePathCollection = db.getCollection('ui_schema_tree_path');
  });

  it('should be registered', async () => {
    expect(db.getCollection('uiSchemas').repository).toBeInstanceOf(UiSchemaRepository);
  });

  it('should insert single ui schema node', async () => {
    const singleNode: SchemaNode = {
      name: 'test',
      'x-uid': 'test',
      schema: {},
    };

    const transaction = await db.sequelize.transaction();
    await repository.insertSingleNode(singleNode, transaction);

    await transaction.commit();
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

    const transaction = await db.sequelize.transaction();

    await repository.insertSingleNode(singleNode, transaction);

    const child1: SchemaNode = {
      name: 'child1',
      'x-uid': 'child1',
      schema: {},
      childOptions: {
        parentUid: 'test',
        type: 'test',
      },
    };

    await repository.insertSingleNode(child1, transaction);

    const child11: SchemaNode = {
      name: 'child11',
      'x-uid': 'child11',
      schema: {},
      childOptions: {
        parentUid: 'child1',
        type: 'test',
      },
    };
    await repository.insertSingleNode(child11, transaction);

    await transaction.commit();
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

  it('should insert child node with difference type', async () => {
    const schema = {
      name: 'root-name',
      'x-uid': 'root',
      properties: {
        p1: {
          'x-uid': 'p1',
        },
        p2: {
          'x-uid': 'p2',
        },
      },
      items: [
        {
          name: 'i1',
          'x-uid': 'i1',
        },
        {
          name: 'i2',
          'x-uid': 'i2',
        },
      ],
    };

    const tree = await repository.insert(schema);
    expect(tree).toMatchObject({
      items: [
        {
          name: 'i1',
          'x-uid': 'i1',
          'x-async': false,
          'x-index': 1,
        },
        {
          name: 'i2',
          'x-uid': 'i2',
          'x-async': false,
          'x-index': 2,
        },
      ],
      properties: {
        p1: { 'x-uid': 'p1', 'x-async': false, 'x-index': 1 },
        p2: { 'x-uid': 'p2', 'x-async': false, 'x-index': 2 },
      },
      name: 'root-name',
      'x-uid': 'root',
      'x-async': false,
    });
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

    it('should save schema with sort', async () => {
      await repository.insert(schema);

      const root = await repository.findOne({
        filter: {
          name: 'root',
        },
      });
      const a1 = await repository.findOne({
        filter: {
          name: 'a1',
        },
      });

      const b1 = await repository.findOne({
        filter: {
          name: 'b1',
        },
      });

      const c1 = await repository.findOne({
        filter: {
          name: 'c1',
        },
      });

      const d1 = await repository.findOne({
        filter: {
          name: 'd1',
        },
      });

      expect(
        (
          await treePathCollection.repository.findOne({
            filter: {
              ancestor: root.get('uid'),
              descendant: a1.get('uid'),
              depth: 1,
            },
          })
        ).get('sort'),
      ).toEqual(1);

      expect(
        (
          await treePathCollection.repository.findOne({
            filter: {
              ancestor: root.get('uid'),
              descendant: b1.get('uid'),
              depth: 1,
            },
          })
        ).get('sort'),
      ).toEqual(2);

      expect(
        (
          await treePathCollection.repository.findOne({
            filter: {
              ancestor: b1.get('uid'),
              descendant: c1.get('uid'),
              depth: 1,
            },
          })
        ).get('sort'),
      ).toEqual(1);

      expect(
        (
          await treePathCollection.repository.findOne({
            filter: {
              ancestor: b1.get('uid'),
              descendant: d1.get('uid'),
              depth: 1,
            },
          })
        ).get('sort'),
      ).toEqual(2);
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

    it('should getJsonSchema by subTree', async () => {
      await repository.insert({
        'x-uid': 'n1',
        name: 'a',
        type: 'object',
        properties: {
          b: {
            'x-uid': 'n2',
            type: 'object',
            properties: {
              c: { 'x-uid': 'n3' },
            },
          },
          d: { 'x-uid': 'n4' },
        },
      });

      const schema = await repository.getJsonSchema('n2');
      expect(schema).toBeDefined();
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

  describe('insert with items', () => {
    test('insert with items', async () => {
      const schema = {
        name: 'root-name',
        'x-uid': 'root',
        properties: {
          p1: {
            'x-uid': 'p1',
          },
          p2: {
            'x-uid': 'p2',
          },
        },
        items: [
          {
            name: 'i1',
            'x-uid': 'i1',
          },
          {
            name: 'i2',
            'x-uid': 'i2',
          },
        ],
      };

      await repository.insert(schema);
      await repository.insertBeforeBegin('i1', {
        'x-uid': 'i2',
      });

      const results = await repository.getJsonSchema('root');
      expect(results['items'][0]['name']).toEqual('i2');
      expect(results['items'][1]['name']).toEqual('i1');
    });
  });

  describe('insert', () => {
    let rootNode;
    let rootUid: string;

    beforeEach(async () => {
      const root = {
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
            type: 'string',
            title: 'B1',
            properties: {
              c1: {
                type: 'string',
                title: 'C1',
              },
              d1: {
                type: 'string',
                title: 'D1',
              },
            },
          },
        },
      };

      await repository.insert(root);

      rootNode = await repository.findOne({
        filter: {
          name: 'root',
        },
      });

      rootUid = rootNode.get('uid') as string;
    });

    it('should insertAfterBegin', async () => {
      const newNode = {
        name: 'newNode',
      };

      await repository.insertAfterBegin(rootUid, newNode);
      const schema = await repository.getJsonSchema(rootUid);
      expect(schema.properties['newNode']['x-index']).toEqual(1);
      expect(schema.properties.a1['x-index']).toEqual(2);
      expect(schema.properties.b1['x-index']).toEqual(3);
    });

    it('should insertBeforeEnd', async () => {
      const newNode = {
        name: 'newNode',
      };

      await repository.insertBeforeEnd(rootUid, newNode);
      const schema = await repository.getJsonSchema(rootUid);
      expect(schema.properties['newNode']['x-index']).toEqual(3);
      expect(schema.properties.a1['x-index']).toEqual(1);
      expect(schema.properties.b1['x-index']).toEqual(2);
    });

    it('should insertBeforeBegin', async () => {
      const newNode = {
        name: 'newNode',
      };

      const b1Node = await repository.findOne({
        filter: {
          name: 'b1',
        },
      });

      await repository.insertBeforeBegin(b1Node.get('uid') as string, newNode);

      const schema = await repository.getJsonSchema(rootUid);
      expect(schema.properties['newNode']['x-index']).toEqual(2);
      expect(schema.properties.a1['x-index']).toEqual(1);
      expect(schema.properties.b1['x-index']).toEqual(3);
    });

    it('should insertAfterEnd a1', async () => {
      const newNode = {
        name: 'newNode',
      };

      const a1Node = await repository.findOne({
        filter: {
          name: 'a1',
        },
      });

      await repository.insertAfterEnd(a1Node.get('uid') as string, newNode);

      const schema = await repository.getJsonSchema(rootUid);
      expect(schema.properties['newNode']['x-index']).toEqual(2);
      expect(schema.properties.a1['x-index']).toEqual(1);
      expect(schema.properties.b1['x-index']).toEqual(3);
    });

    it('should insertAfterEnd b1', async () => {
      const newNode = {
        name: 'newNode',
      };

      const b1Node = await repository.findOne({
        filter: {
          name: 'b1',
        },
      });

      await repository.insertAfterEnd(b1Node.get('uid') as string, newNode);

      const schema = await repository.getJsonSchema(rootUid);
      expect(schema.properties['newNode']['x-index']).toEqual(3);
      expect(schema.properties.a1['x-index']).toEqual(1);
      expect(schema.properties.b1['x-index']).toEqual(2);
    });
  });

  describe('insert with x-uid', () => {
    it('should insertAfterBegin by tree', async () => {
      await repository.insert({
        'x-uid': 'n1',
        name: 'a',
        type: 'object',
        properties: {
          b: {
            'x-uid': 'n2',
            type: 'object',
            properties: {
              c: { 'x-uid': 'n3' },
            },
          },
          d: {
            'x-uid': 'n4',
            properties: {
              e: {
                'x-uid': 'n5',
              },
            },
          },
        },
      });

      await repository.insertAfterBegin('n1', {
        name: 'f',
        'x-uid': 'n6',
        properties: {
          g: {
            'x-uid': 'n7',
            properties: {
              d: { 'x-uid': 'n4' },
            },
          },
        },
      });

      const schema = await repository.getJsonSchema('n1');
      expect(schema.properties.f.properties.g.properties.d.properties.e['x-uid']).toEqual('n5');
    });

    it('should insertAfterBegin by node', async () => {
      await repository.insert({
        'x-uid': 'n1',
        name: 'a',
        type: 'object',
        properties: {
          b: {
            'x-uid': 'n2',
            type: 'object',
            properties: {
              c: { 'x-uid': 'n3' },
            },
          },
          d: { 'x-uid': 'n4' },
        },
      });

      await repository.insertAfterBegin('n2', 'n4');
      const schema = await repository.getJsonSchema('n1');
      expect(schema.properties.b.properties.d['x-uid']).toEqual('n4');
    });
  });

  describe('remove', () => {
    it('should remove node', async () => {
      await repository.insert({
        'x-uid': 'n1',
        name: 'a',
        type: 'object',
        properties: {
          b: {
            'x-uid': 'n2',
            type: 'object',
            properties: {
              c: { 'x-uid': 'n3' },
            },
          },
          d: { 'x-uid': 'n4' },
        },
      });

      await repository.remove('n4');
      const schema = await repository.getJsonSchema('n1');
      expect(schema.properties['d']).not.toBeDefined();
    });

    it('should remove tree', async () => {
      await repository.insert({
        'x-uid': 'n1',
        name: 'a',
        type: 'object',
        properties: {
          b: {
            'x-uid': 'n2',
            type: 'object',
            properties: {
              c: { 'x-uid': 'n3' },
            },
          },
          d: { 'x-uid': 'n4' },
        },
      });

      await repository.remove('n2');
      const schema = await repository.getJsonSchema('n1');
      expect(schema.properties['b']).not.toBeDefined();
      expect(schema.properties['d']).toBeDefined();
    });
  });

  describe('patch', function () {
    let rootNode;
    let rootUid: string;

    beforeEach(async () => {
      const root = {
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
            type: 'string',
            title: 'B1',
            properties: {
              c1: {
                type: 'string',
                title: 'C1',
              },
              d1: {
                type: 'string',
                title: 'D1',
              },
            },
          },
        },
      };

      await repository.insert(root);

      rootNode = await repository.findOne({
        filter: {
          name: 'root',
        },
      });

      rootUid = rootNode.get('uid') as string;
    });

    it('should patch root ui schema', async () => {
      await repository.patch({
        'x-uid': rootUid,
        title: 'test-title',
        properties: {
          a1: {
            type: 'string',
            title: 'new a1 title',
            'x-component': 'Input',
          },
        },
      });

      const newTree = await repository.getJsonSchema(rootUid);
      expect(newTree.title).toEqual('test-title');
      expect(newTree.properties.a1.title).toEqual('new a1 title');
    });
  });
});
