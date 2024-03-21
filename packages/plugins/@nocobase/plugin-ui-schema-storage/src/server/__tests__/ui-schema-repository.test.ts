import { Collection, Database } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import { SchemaNode } from '../dao/ui_schema_node_dao';
import UiSchemaRepository from '../repository';

describe('ui_schema repository', () => {
  let app: MockServer;
  let db: Database;
  let repository: UiSchemaRepository;

  let treePathCollection: Collection;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-schema-storage'],
    });

    db = app.db;
    repository = db.getCollection('uiSchemas').repository as UiSchemaRepository;
    treePathCollection = db.getCollection('uiSchemaTreePath');
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
    await repository.insertSingleNode(singleNode, { transaction });

    await transaction.commit();
    // it should save in ui schema tables
    const testNode = await repository.findOne({
      filter: {
        'x-uid': 'test',
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

    await repository.insertSingleNode(singleNode, { transaction });

    const child1: SchemaNode = {
      name: 'child1',
      'x-uid': 'child1',
      schema: {},
      childOptions: {
        parentUid: 'test',
        type: 'test',
      },
    };

    await repository.insertSingleNode(child1, { transaction });

    const child11: SchemaNode = {
      name: 'child11',
      'x-uid': 'child11',
      schema: {},
      childOptions: {
        parentUid: 'child1',
        type: 'test',
      },
    };
    await repository.insertSingleNode(child11, { transaction });

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

  it('should create a copy', async () => {
    const s = await repository.insert({
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
    const s2 = await repository.duplicate(s['x-uid']);
    expect(s2.name).toEqual(s.name);
    expect(s2['x-uid']).not.toEqual(s['x-uid']);
  });

  it('should be null', async () => {
    const s2 = await repository.duplicate('test-null');
    expect(s2).toBeNull();
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
              ancestor: root.get('x-uid'),
              descendant: a1.get('x-uid'),
              depth: 1,
            },
          })
        ).get('sort'),
      ).toEqual(1);

      expect(
        (
          await treePathCollection.repository.findOne({
            filter: {
              ancestor: root.get('x-uid'),
              descendant: b1.get('x-uid'),
              depth: 1,
            },
          })
        ).get('sort'),
      ).toEqual(2);

      expect(
        (
          await treePathCollection.repository.findOne({
            filter: {
              ancestor: b1.get('x-uid'),
              descendant: c1.get('x-uid'),
              depth: 1,
            },
          })
        ).get('sort'),
      ).toEqual(1);

      expect(
        (
          await treePathCollection.repository.findOne({
            filter: {
              ancestor: b1.get('x-uid'),
              descendant: d1.get('x-uid'),
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

      const results = await repository.getJsonSchema(rootNode.get('x-uid') as string);

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

    it('should get root async json schema', async () => {
      await repository.insert({
        'x-uid': 'n1',
        async: true,
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

      const schema = await repository.getJsonSchema('n1');
      expect(schema).toBeDefined();
    });

    it('should getProperties', async () => {
      await repository.insert(schema);
      const rootNode = await repository.findOne({
        filter: {
          name: 'root',
        },
      });

      const results = await repository.getProperties(rootNode.get('x-uid') as string);

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
      await repository.insertAdjacent('beforeBegin', 'i1', {
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

      rootUid = rootNode.get('x-uid') as string;
    });

    it('should insertAfterBegin', async () => {
      const newNode = {
        name: 'newNode',
      };

      await repository.insertAdjacent('afterBegin', rootUid, newNode);
      const schema = await repository.getJsonSchema(rootUid);
      expect(schema['properties']['newNode']['x-index']).toEqual(1);
      expect(schema['properties'].a1['x-index']).toEqual(2);
      expect(schema['properties'].b1['x-index']).toEqual(3);
    });

    it('should insertBeforeEnd', async () => {
      const newNode = {
        name: 'newNode',
      };

      await repository.insertAdjacent('beforeEnd', rootUid, newNode);
      const schema = await repository.getJsonSchema(rootUid);
      expect(schema['properties']['newNode']['x-index']).toEqual(3);
      expect(schema['properties'].a1['x-index']).toEqual(1);
      expect(schema['properties'].b1['x-index']).toEqual(2);
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

      await repository.insertAdjacent('beforeBegin', b1Node.get('x-uid') as string, newNode);

      const schema = await repository.getJsonSchema(rootUid);
      expect(schema['properties']['newNode']['x-index']).toEqual(2);
      expect(schema['properties'].a1['x-index']).toEqual(1);
      expect(schema['properties'].b1['x-index']).toEqual(3);
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

      await repository.insertAdjacent('afterEnd', a1Node.get('x-uid') as string, newNode);

      const schema = await repository.getJsonSchema(rootUid);
      expect(schema['properties']['newNode']['x-index']).toEqual(2);
      expect(schema['properties'].a1['x-index']).toEqual(1);
      expect(schema['properties'].b1['x-index']).toEqual(3);
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

      await repository.insertAdjacent('afterEnd', b1Node.get('x-uid') as string, newNode);

      const schema = await repository.getJsonSchema(rootUid);
      expect(schema['properties']['newNode']['x-index']).toEqual(3);
      expect(schema['properties'].a1['x-index']).toEqual(1);
      expect(schema['properties'].b1['x-index']).toEqual(2);
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

      await repository.insertAdjacent(
        'afterBegin',
        'n1',
        {
          'x-uid': 'n4',
        },
        {
          wrap: {
            name: 'f',
            'x-uid': 'n6',
            properties: {
              g: {
                'x-uid': 'n7',
              },
            },
          },
        },
      );

      const schema = await repository.getJsonSchema('n1');
      expect(schema.properties.f.properties.g.properties.d.properties.e['x-uid']).toEqual('n5');
      expect(schema.properties.f.properties.g.properties.d['x-uid']).toEqual('n4');
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

      await repository.insertAdjacent('afterBegin', 'n2', 'n4');
      const schema = await repository.getJsonSchema('n1');
      expect(schema['properties'].b.properties.d['x-uid']).toEqual('n4');
    });
  });

  describe('remove', () => {
    it('should remove node in schema table', async () => {
      const schema = {
        type: 'void',
        'x-uid': 'root',
        'x-component': 'Menu',
        'x-designer': 'Menu.Designer',
        'x-initializer': 'MenuItemInitializer',
        'x-component-props': {
          mode: 'mix',
          theme: 'dark',
          // defaultSelectedUid: 'u8',
          onSelect: '{{ onSelect }}',
          sideMenuRefScopeKey: 'sideMenuRef',
        },
        properties: {
          item3: {
            'x-uid': 'item3',
            type: 'void',
            title: 'SubMenu u3',
            'x-component': 'Menu.SubMenu',
            'x-component-props': {},
            properties: {
              item6: {
                type: 'void',
                title: 'SubMenu u6',
                'x-component': 'Menu.SubMenu',
                'x-component-props': {},
                properties: {
                  item7: {
                    type: 'void',
                    title: 'Menu Item u7',
                    'x-component': 'Menu.Item',
                    'x-component-props': {},
                    properties: {
                      page1: {
                        type: 'void',
                        'x-component': 'Page',
                        'x-async': true,
                        properties: {
                          grid1: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-item-initializer': 'BlockInitializer',
                            properties: {},
                          },
                        },
                      },
                    },
                  },
                  item8: {
                    type: 'void',
                    title: 'Menu Item u8',
                    'x-component': 'Menu.Item',
                    'x-component-props': {},
                  },
                },
              },
              item4: {
                type: 'void',
                title: 'Menu Item u4',
                'x-component': 'Menu.Item',
                'x-component-props': {},
              },
              item5: {
                type: 'void',
                title: 'Menu Item u5',
                'x-component': 'Menu.Item',
                'x-component-props': {},
              },
            },
          },
          item1: {
            'x-uid': 'item1',
            type: 'void',
            title: 'Menu Item u1',
            'x-component': 'Menu.Item',
            'x-component-props': {},
          },
          item2: {
            'x-uid': 'item2',
            type: 'void',
            title: 'Menu Item u2',
            'x-component': 'Menu.Item',
            'x-component-props': {},
          },
          item9: {
            'x-uid': 'item9',
            type: 'void',
            title: 'SubMenu u9',
            'x-component': 'Menu.SubMenu',
            'x-component-props': {},
            properties: {
              item10: {
                type: 'void',
                title: 'Menu Item u10',
                'x-component': 'Menu.Item',
                'x-component-props': {},
              },
            },
          },
        },
      };

      await repository.insert(schema);
      await repository.remove('item1');

      const item1Node = await repository.findOne({
        filter: {
          'x-uid': 'item1',
        },
      });

      expect(item1Node).toBeNull();

      let tree = await repository.getProperties('root');
      expect(tree['properties']['item1']).toBeUndefined();
      await repository.remove('item2');
      await repository.remove('item3');
      await repository.remove('item9');

      tree = await repository.getJsonSchema('root');
      console.log(JSON.stringify(tree, null, 2));
      expect(tree['properties']).toBeUndefined();
    });

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

      rootUid = rootNode.get('x-uid') as string;
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

  it('should insertInner with removeParent', async () => {
    const schema = {
      'x-uid': 'A',
      name: 'A',
      properties: {
        B: {
          'x-uid': 'B',
          properties: {
            C: {
              'x-uid': 'C',
              properties: {
                D: {
                  'x-uid': 'D',
                },
              },
            },
          },
        },
        E: {
          'x-uid': 'E',
        },
      },
    };

    await repository.insert(schema);

    await repository.insertAdjacent(
      'afterBegin',
      'E',
      {
        'x-uid': 'D',
      },
      {
        removeParentsIfNoChildren: true,
        wrap: {
          'x-uid': 'F',
          name: 'F',
          properties: {
            G: {
              'x-uid': 'G',
            },
          },
        },
      },
    );

    const A = await repository.getJsonSchema('A');

    expect(A).toEqual({
      properties: {
        E: {
          properties: {
            F: {
              properties: {
                G: {
                  properties: {
                    D: {
                      'x-uid': 'D',
                      'x-async': false,
                      'x-index': 1,
                    },
                  },
                  'x-uid': 'G',
                  'x-async': false,
                  'x-index': 1,
                },
              },
              'x-uid': 'F',
              'x-async': false,
              'x-index': 1,
            },
          },
          'x-uid': 'E',
          'x-async': false,
          'x-index': 2,
        },
      },
      name: 'A',
      'x-uid': 'A',
      'x-async': false,
    });
  });

  it('should insertBeside with removeParent', async () => {
    const schema = {
      'x-uid': 'A',
      name: 'A',
      properties: {
        B: {
          'x-uid': 'B',
          properties: {
            C: {
              'x-uid': 'C',
              properties: {
                D: {
                  'x-uid': 'D',
                },
              },
            },
          },
        },
        E: {
          'x-uid': 'E',
        },
      },
    };

    await repository.insert(schema);

    await repository.insertAdjacent(
      'afterEnd',
      'E',
      {
        'x-uid': 'D',
      },
      {
        removeParentsIfNoChildren: true,
        wrap: {
          'x-uid': 'F',
          name: 'F',
          properties: {
            G: {
              'x-uid': 'G',
            },
          },
        },
      },
    );

    const A = await repository.getJsonSchema('A');

    expect(A).toEqual({
      properties: {
        E: {
          'x-uid': 'E',
          'x-async': false,
          'x-index': 2,
        },
        F: {
          properties: {
            G: {
              'x-uid': 'G',
              'x-async': false,
              'x-index': 1,
              properties: {
                D: {
                  'x-uid': 'D',
                  'x-async': false,
                  'x-index': 1,
                },
              },
            },
          },
          'x-uid': 'F',
          'x-async': false,
          'x-index': 3,
        },
      },
      name: 'A',
      'x-uid': 'A',
      'x-async': false,
    });
  });

  it('should remove with breakOn', async () => {
    const schema = {
      'x-uid': 'A',
      name: 'A',
      properties: {
        B: {
          'x-uid': 'B',
          properties: {
            C: {
              'x-uid': 'C',
              properties: {
                D: {
                  'x-uid': 'D',
                },
              },
            },
          },
        },
        E: {
          'x-uid': 'E',
        },
      },
    };

    await repository.insert(schema);

    await repository.remove('D', {
      removeParentsIfNoChildren: true,
    });

    const A = await repository.getJsonSchema('A');

    expect(A).toEqual({
      properties: {
        E: {
          'x-uid': 'E',
          'x-async': false,
          'x-index': 2,
        },
      },
      name: 'A',
      'x-uid': 'A',
      'x-async': false,
    });
  });

  it('should remove schema ancestor', async () => {
    const schema = {
      'x-uid': 'A',
      name: 'A',
      properties: {
        B: {
          'x-uid': 'B',
          properties: {
            C: {
              'x-uid': 'C',
              properties: {
                D: {
                  'x-uid': 'D',
                },
              },
            },
            F: {
              'x-uid': 'F',
            },
          },
        },
        E: {
          'x-uid': 'E',
        },
      },
    };

    await repository.insert(schema);
    expect((await repository.getJsonSchema('B')).properties.C).toBeDefined();

    await repository.clearAncestor('C');

    expect((await repository.getJsonSchema('B')).properties.C).not.toBeDefined();

    const c = await repository.getJsonSchema('C');
    expect(c).toMatchObject({
      'x-uid': 'C',
      properties: {
        D: {
          'x-uid': 'D',
        },
      },
    });
  });

  it('should insert big schema', async () => {
    const schema = (await import('./fixtures/data')).default;

    console.time('test');
    await repository.insertNewSchema(schema);
    console.timeEnd('test');

    const rootUid = schema['x-uid'];
    const savedSchema = await repository.getJsonSchema(rootUid);
    expect(savedSchema).toBeDefined();
  });

  it('should insert new with insertAfterEnd', async () => {
    const root = {
      'x-uid': 'root',
      name: 'root',
      properties: {
        c1: {
          'x-uid': 'c1',
        },
      },
    };

    const newNode = {
      'x-uid': 'new',
      name: 'new',
      properties: {
        nc1: {
          'x-uid': 'nc1',
        },
      },
    };

    await repository.insertNewSchema(root);
    await repository.insertNewSchema(newNode);

    await repository.insertAdjacent('afterEnd', 'c1', {
      'x-uid': 'new',
    });

    const json = await repository.getJsonSchema('root');
    expect(json).toEqual({
      properties: {
        c1: {
          'x-uid': 'c1',
          'x-async': false,
          'x-index': 1,
        },
        new: {
          properties: {
            nc1: {
              'x-uid': 'nc1',
              'x-async': false,
              'x-index': 1,
            },
          },
          'x-uid': 'new',
          'x-async': false,
          'x-index': 2,
        },
      },
      name: 'root',
      'x-uid': 'root',
      'x-async': false,
    });
  });

  it('should insert big schema using insertAfterEnd', async () => {
    const tree = {
      'x-uid': 'root',
      properties: {
        A: {
          'x-uid': 'A',
        },
        B: {
          'x-uid': 'B',
        },
      },
    };
    await repository.insert(tree);
    const schema = (await import('./fixtures/data')).default;

    await repository.insertAdjacent('afterEnd', 'A', schema);
    const rootUid = schema['x-uid'];
    const savedSchema = await repository.getJsonSchema(rootUid);
    expect(savedSchema).toBeDefined();
  });

  describe('schemaToSingleNodes', () => {
    it('should with parent Paths', async () => {
      const schema = {
        name: 'root-name',
        'x-uid': 'root',
        properties: {
          p1: {
            'x-uid': 'p1',
          },
          p2: {
            'x-uid': 'p2',
            properties: {
              p21: {
                'x-uid': 'p21',
                properties: {
                  p211: {
                    'x-uid': 'p211',
                  },
                },
              },
            },
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
      const nodes = UiSchemaRepository.schemaToSingleNodes(schema);
      const p211Node = nodes.find((node) => node['x-uid'] === 'p211');
      expect(p211Node['childOptions'].parentPath).toEqual(['p21', 'p2', 'root']);
    });
  });

  describe('insertAdjacent', () => {
    it('should works with wrap and new schema', async () => {
      const schema = {
        name: 'root-name',
        'x-uid': 'root',
        properties: {
          p1: {
            'x-uid': 'p1',
            properties: {
              p11: {
                'x-uid': 'p11',
              },
            },
          },
          p2: {
            'x-uid': 'p2',
            properties: {
              p21: {
                'x-uid': 'p21',
              },
            },
          },
        },
      };

      await repository.insert(schema);

      await repository.insertAdjacent(
        'afterEnd',
        'p2',
        {
          name: 'p311',
          'x-uid': 'p311',
        },
        {
          wrap: {
            'x-uid': 'p3',
            name: 'p3',
            properties: {
              p31: {
                'x-uid': 'p31',
              },
            },
          },
        },
      );

      const root = await repository.getJsonSchema('root');
      expect(root).toEqual({
        properties: {
          p1: {
            properties: {
              p11: {
                'x-uid': 'p11',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p1',
            'x-async': false,
            'x-index': 1,
          },
          p2: {
            properties: {
              p21: {
                'x-uid': 'p21',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p2',
            'x-async': false,
            'x-index': 2,
          },
          p3: {
            properties: {
              p31: {
                properties: {
                  p311: {
                    'x-uid': 'p311',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'p31',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p3',
            'x-async': false,
            'x-index': 3,
          },
        },
        name: 'root-name',
        'x-uid': 'root',
        'x-async': false,
      });
    });

    it('should works with wrap', async () => {
      const schema = {
        name: 'root-name',
        'x-uid': 'root',
        properties: {
          p1: {
            'x-uid': 'p1',
            properties: {
              p11: {
                'x-uid': 'p11',
              },
            },
          },
          p2: {
            'x-uid': 'p2',
            properties: {
              p21: {
                'x-uid': 'p21',
              },
            },
          },
        },
      };

      await repository.insert(schema);

      await repository.insertAdjacent(
        'afterEnd',
        'p1',
        {
          'x-uid': 'p21',
        },
        {
          removeParentsIfNoChildren: true,
          breakRemoveOn: {
            'x-uid': 'root',
          },
          wrap: {
            'x-uid': 'p3',
            name: 'p3',
            properties: {
              p31: {
                'x-uid': 'p31',
              },
            },
          },
        },
      );

      const root = await repository.getJsonSchema('root');
      expect(root).toEqual({
        properties: {
          p1: {
            properties: {
              p11: {
                'x-uid': 'p11',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p1',
            'x-async': false,
            'x-index': 1,
          },
          p3: {
            properties: {
              p31: {
                properties: {
                  p21: {
                    'x-uid': 'p21',
                    'x-async': false,
                    'x-index': 1,
                  },
                },
                'x-uid': 'p31',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p3',
            'x-async': false,
            'x-index': 2,
          },
        },
        name: 'root-name',
        'x-uid': 'root',
        'x-async': false,
      });
    });

    it('should insert newSchema using insertNewSchema', async () => {
      const schema = {
        name: 'root-name',
        'x-uid': 'root',
        properties: {
          p1: {
            'x-uid': 'p1',
            properties: {
              p11: {
                'x-uid': 'p11',
              },
            },
          },
          p2: {
            'x-uid': 'p2',
            properties: {
              p21: {
                'x-uid': 'p21',
              },
            },
          },
        },
      };

      await repository.insert(schema);

      await repository.insertAdjacent('afterEnd', 'p2', {
        'x-uid': 'p3',
        name: 'p3',
        properties: {
          p31: {
            'x-uid': 'p31',
          },
        },
      });

      const root = await repository.getJsonSchema('root');
      expect(root).toEqual({
        properties: {
          p1: {
            properties: {
              p11: {
                'x-uid': 'p11',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p1',
            'x-async': false,
            'x-index': 1,
          },
          p2: {
            properties: {
              p21: {
                'x-uid': 'p21',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p2',
            'x-async': false,
            'x-index': 2,
          },
          p3: {
            properties: {
              p31: {
                'x-uid': 'p31',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p3',
            'x-async': false,
            'x-index': 3,
          },
        },
        name: 'root-name',
        'x-uid': 'root',
        'x-async': false,
      });
    });

    it('should insert oldSchema using first x-uid', async () => {
      const schema = {
        name: 'root-name',
        'x-uid': 'root',
        properties: {
          p1: {
            'x-uid': 'p1',
            properties: {
              p11: {
                'x-uid': 'p11',
              },
            },
          },
          p2: {
            'x-uid': 'p2',
            properties: {
              p21: {
                'x-uid': 'p21',
              },
            },
          },
        },
      };

      await repository.insert(schema);

      const insertSchema = {
        'x-uid': 'p3',
        name: 'p3',
        properties: {
          p31: {
            'x-uid': 'p31',
          },
        },
      };

      await repository.insert(insertSchema);
      await repository.insertAdjacent('afterEnd', 'p2', insertSchema);

      const root = await repository.getJsonSchema('root');
      expect(root).toEqual({
        properties: {
          p1: {
            properties: {
              p11: {
                'x-uid': 'p11',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p1',
            'x-async': false,
            'x-index': 1,
          },
          p2: {
            properties: {
              p21: {
                'x-uid': 'p21',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p2',
            'x-async': false,
            'x-index': 2,
          },
          p3: {
            properties: {
              p31: {
                'x-uid': 'p31',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'p3',
            'x-async': false,
            'x-index': 3,
          },
        },
        name: 'root-name',
        'x-uid': 'root',
        'x-async': false,
      });
    });
  });
});
