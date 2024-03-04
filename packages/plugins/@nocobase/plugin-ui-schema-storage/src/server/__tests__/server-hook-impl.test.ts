import { BelongsToManyRepository, Database } from '@nocobase/database';
import UiSchemaStoragePlugin, { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { createMockServer, MockServer } from '@nocobase/test';

describe('server hooks', () => {
  let app: MockServer;
  let db: Database;
  let uiSchemaRepository: UiSchemaRepository;
  let uiSchemaPlugin: UiSchemaStoragePlugin;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-schema-storage', 'collection-manager', 'error-handler', 'users', 'acl', 'data-source-manager'],
    });
    await app.runCommand('install', '-f');
    db = app.db;
    uiSchemaRepository = db.getRepository('uiSchemas');
    uiSchemaPlugin = app.getPlugin<UiSchemaStoragePlugin>('ui-schema-storage');
  });

  it('should clean row struct', async () => {
    const PostModel = await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    await db.getRepository('fields').create({
      values: {
        name: 'title',
        type: 'string',
        collectionName: 'posts',
      },
    });

    await db.getRepository('fields').create({
      values: {
        name: 'name',
        type: 'string',
        collectionName: 'posts',
      },
    });

    await db.getRepository('fields').create({
      values: {
        name: 'intro',
        type: 'string',
        collectionName: 'posts',
      },
    });

    const schema = {
      type: 'void',
      name: 'grid1',
      'x-decorator': 'Form',
      'x-component': 'Grid',
      'x-item-initializer': 'AddGridFormItem',
      'x-uid': 'grid1',
      properties: {
        row1: {
          type: 'void',
          'x-component': 'Grid.Row',
          'x-uid': 'row1',
          properties: {
            col11: {
              type: 'void',
              'x-uid': 'col11',
              'x-component': 'Grid.Col',
              properties: {
                name: {
                  type: 'string',
                  title: 'Name',
                  'x-uid': 'posts-name',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-collection-field': 'posts.name',
                  'x-server-hooks': [
                    {
                      type: 'onCollectionFieldDestroy',
                      collection: 'posts',
                      field: 'name',
                      method: 'removeSchema',
                    },
                  ],
                },
                title: {
                  type: 'string',
                  title: 'Title',
                  'x-uid': 'posts-title',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-collection-field': 'posts.title',
                  'x-server-hooks': [
                    {
                      type: 'onCollectionFieldDestroy',
                      collection: 'posts',
                      field: 'title',
                      method: 'removeSchema',
                      params: {
                        breakRemoveOn: { 'x-component': 'Grid' },
                        removeParentsIfNoChildren: true,
                      },
                    },
                  ],
                },
              },
            },
            col12: {
              type: 'void',
              'x-uid': 'col12',
              'x-component': 'Grid.Col',
              properties: {
                intro: {
                  'x-uid': 'posts-intro',
                  type: 'string',
                  title: 'Intro',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                  'x-server-hooks': [
                    {
                      type: 'onCollectionFieldDestroy',
                      collection: 'posts',
                      field: 'intro',
                      method: 'removeSchema',
                      params: {
                        breakRemoveOn: { 'x-component': 'Grid' },
                        removeParentsIfNoChildren: true,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    };

    await uiSchemaRepository.insert(schema);

    await db.getRepository('fields').destroy({
      filter: {
        name: 'intro',
      },
    });

    const jsonTree = await uiSchemaRepository.getJsonSchema('grid1');
    expect(jsonTree['properties']['row1']['properties']['col11']).toBeDefined();
    expect(jsonTree['properties']['row1']['properties']['col12']).not.toBeDefined();
  });

  it('should works with breakComponent', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    const schema = {
      'x-uid': 'root',
      name: 'root',
      properties: {
        grid: {
          properties: {
            row: {
              'x-component': 'row',
              properties: {
                col: {
                  'x-component': 'col',
                  'x-uid': 'col',
                  'x-server-hooks': [
                    {
                      type: 'onCollectionDestroy',
                      collection: 'posts',
                      method: 'removeSchema',
                      params: {
                        breakRemoveOn: { 'x-component': 'row' },
                        removeParentsIfNoChildren: true,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    };

    await uiSchemaRepository.insert(schema);

    await db.getRepository('collections').destroy({
      filter: {
        name: 'posts',
      },
    });

    const jsonTree = await uiSchemaRepository.getJsonSchema('root');
    expect(jsonTree['properties']['grid']['properties']['row']).toBeDefined();
    expect(jsonTree['properties']['grid']['properties']['row']['properties']).not.toBeDefined();
  });

  it('should remove schema when collection destroy', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    await db.getRepository('fields').create({
      values: {
        name: 'title',
        type: 'string',
        collectionName: 'posts',
      },
    });

    const schema = {
      'x-uid': 'root',
      name: 'root',
      properties: {
        child1: {
          'x-uid': 'child1',
        },

        child2: {
          'x-uid': 'child2',
          'x-server-hooks': [
            {
              type: 'onCollectionDestroy',
              collection: 'posts',
              method: 'removeSchema',
            },
          ],
        },
      },
    };

    await uiSchemaRepository.insert(schema);

    await db.getRepository('collections').destroy({
      filter: {
        name: 'posts',
      },
    });

    const jsonTree = await uiSchemaRepository.getJsonSchema('root');
    expect(jsonTree['properties']['child1']).toBeDefined();
    expect(jsonTree['properties']['child2']).not.toBeDefined();
  });

  it('should bind menu to role when insert new menu using insertAdjacent', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'role1',
        allowConfigure: true,
        allowNewMenu: true,
      },
    });

    const schema = {
      'x-uid': 'root',
      name: 'root',
      properties: {},
    };

    await uiSchemaRepository.insert(schema);

    await uiSchemaRepository.insertAdjacent('afterBegin', 'root', {
      'x-uid': 'child2',
      name: 'child2',
      'x-server-hooks': [
        {
          type: 'onSelfCreate',
          method: 'bindMenuToRole',
        },
      ],
    });

    const role1Menus = await db.getRepository<BelongsToManyRepository>('roles.menuUiSchemas', 'role1').find();
    expect(role1Menus.length).toEqual(1);
  });

  it('should bind menu to role when create new menu', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'role1',
        allowConfigure: true,
        allowNewMenu: true,
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'role2',
        allowConfigure: true,
        allowNewMenu: false,
      },
    });

    const schema = {
      'x-uid': 'root',
      name: 'root',
      properties: {
        child2: {
          'x-uid': 'child2',
          'x-server-hooks': [
            {
              type: 'onSelfCreate',
              method: 'bindMenuToRole',
            },
          ],
        },
      },
    };

    await uiSchemaRepository.insert(schema);

    const role1Menus = await db.getRepository<BelongsToManyRepository>('roles.menuUiSchemas', 'role1').find();
    expect(role1Menus.length).toEqual(1);

    const role2Menus = await db.getRepository<BelongsToManyRepository>('roles.menuUiSchemas', 'role2').find();
    expect(role2Menus.length).toEqual(0);
  });

  it('should remove parents on self move', async () => {
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
                  'x-server-hooks': [
                    {
                      type: 'onSelfMove',
                      method: 'removeParentsIfNoChildren',
                    },
                  ],
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

    await uiSchemaRepository.insert(schema);

    await uiSchemaRepository.insertAdjacent(
      'afterEnd',
      'E',
      {
        'x-uid': 'D',
      },
      {
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

    const A = await uiSchemaRepository.getJsonSchema('A');
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
              properties: {
                D: {
                  'x-server-hooks': [
                    {
                      type: 'onSelfMove',
                      method: 'removeParentsIfNoChildren',
                    },
                  ],
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
          'x-index': 3,
        },
      },
      name: 'A',
      'x-uid': 'A',
      'x-async': false,
    });
  });
});
