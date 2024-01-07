import { Database } from '@nocobase/database';
import UiSchemaStoragePlugin, { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { createMockServer, MockServer } from '@nocobase/test';
import { vi } from 'vitest';

describe('server hooks', () => {
  let app: MockServer;
  let db: Database;
  let uiSchemaRepository: UiSchemaRepository;
  let uiSchemaPlugin: UiSchemaStoragePlugin;

  const schema = {
    'x-uid': 'root',
    name: 'root',
    properties: {
      row: {
        'x-uid': 'table',
        'x-component': 'Table',
        'x-collection': 'posts',
        'x-server-hooks': [
          {
            type: 'onCollectionDestroy',
            collection: 'posts',
            method: 'onCollectionDestroy',
          },
        ],
        properties: {
          col1: {
            'x-uid': 'col1',
            'x-component': 'Col',
            properties: {
              field1: {
                'x-uid': 'field1',
                'x-component': 'Input',
                'x-collection-field': 'posts.title',
                'x-server-hooks': [
                  {
                    type: 'onCollectionFieldDestroy',
                    collection: 'posts',
                    field: 'title',
                    method: 'onFieldDestroy',
                  },
                ],
              },
            },
          },
        },
      },
    },
  };

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-schema-storage', 'collection-manager', 'error-handler'],
    });

    db = app.db;

    uiSchemaRepository = db.getRepository('uiSchemas');
    await uiSchemaRepository.insert(schema);

    uiSchemaPlugin = app.getPlugin<UiSchemaStoragePlugin>('ui-schema-storage');
  });

  it('should call server hooks onFieldDestroy', async () => {
    const PostModel = await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    const fieldModel = await db.getRepository('fields').create({
      values: {
        name: 'title',
        type: 'string',
        collectionName: 'posts',
      },
    });

    // @ts-ignore
    await PostModel.migrate();

    const serverHooks = uiSchemaPlugin.serverHooks;
    const hookFn = vi.fn();

    serverHooks.register('onCollectionFieldDestroy', 'onFieldDestroy', hookFn);

    // destroy a field
    await db.getRepository('fields').destroy({
      filter: {
        name: 'title',
      },
      individualHooks: true,
    });

    expect(hookFn).toHaveBeenCalled();
  });

  it('should call server hooks onCollectionDestroy', async () => {
    const PostModel = await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    const fieldModel = await db.getRepository('fields').create({
      values: {
        name: 'title',
        type: 'string',
        collectionName: 'posts',
      },
    });

    // @ts-ignore
    await PostModel.migrate();

    const serverHooks = uiSchemaPlugin.serverHooks;

    const hookFn = vi.fn();

    serverHooks.register('onCollectionDestroy', 'onCollectionDestroy', hookFn);

    // destroy a field
    await db.getRepository('collections').destroy({
      filter: {
        name: 'posts',
      },
      individualHooks: true,
    });

    expect(hookFn).toHaveBeenCalled();
  });

  it('should call server hooks onUiSchemaCreate', async () => {
    const menuSchema = {
      'x-uid': 'menu',
      'x-server-hooks': [
        {
          type: 'onSelfCreate',
          method: 'afterCreateMenu',
        },
      ],
    };

    const serverHooks = uiSchemaPlugin.serverHooks;
    const hookFn = vi.fn();

    serverHooks.register('onSelfCreate', 'afterCreateMenu', hookFn);

    await uiSchemaRepository.insert(menuSchema);

    expect(hookFn).toHaveBeenCalled();
  });

  it('should call server hooks onAnyCollectionFieldDestroy', async () => {
    const menuSchema = {
      'x-uid': 'menu',
      'x-server-hooks': [
        {
          type: 'onAnyCollectionFieldDestroy',
          collection: 'posts',
          method: 'test1',
        },
      ],
    };

    await uiSchemaRepository.insert(menuSchema);

    const PostModel = await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    const fieldModel = await db.getRepository('fields').create({
      values: {
        name: 'title',
        type: 'string',
        collectionName: 'posts',
      },
    });

    // @ts-ignore
    await PostModel.migrate();

    const serverHooks = uiSchemaPlugin.serverHooks;
    const hookFn = vi.fn();

    serverHooks.register('onAnyCollectionFieldDestroy', 'test1', hookFn);

    // destroy a field
    await db.getRepository('fields').destroy({
      filter: {
        name: 'title',
      },
      individualHooks: true,
    });

    expect(hookFn).toHaveBeenCalled();
  });

  it('should rollback after throw error', async () => {
    const testSchema = {
      'x-uid': 'test',
      'x-collection-field': 'posts.title',
      'x-server-hooks': [
        {
          type: 'onCollectionFieldDestroy',
          collection: 'posts',
          field: 'title',
          method: 'preventDestroy',
        },
      ],
    };

    await uiSchemaRepository.create({
      values: {
        schema: testSchema,
      },
    });

    const PostModel = await db.getRepository('collections').create({
      values: {
        name: 'posts',
      },
    });

    const fieldModel = await db.getRepository('fields').create({
      values: {
        name: 'title',
        type: 'string',
        collectionName: 'posts',
      },
    });

    // @ts-ignore
    await PostModel.migrate();

    const serverHooks = uiSchemaPlugin.serverHooks;

    const jestFn = vi.fn();

    serverHooks.register('onCollectionFieldDestroy', 'preventDestroy', async ({ options }) => {
      await options.transaction.rollback();
      jestFn();
      throw new Error('cant delete field');
    });

    try {
      // destroy a field
      await db.getRepository('fields').destroy({
        filter: {
          name: 'title',
        },
        individualHooks: true,
      });
    } catch (e) {
      console.log(e);
    }

    expect(jestFn).toHaveBeenCalled();
    expect(
      await db.getRepository('fields').findOne({
        filter: {
          name: 'title',
        },
      }),
    ).toBeDefined();
  });

  it('should call onSelfMove', async () => {
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
                      method: 'testOnSelfMove',
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

    const serverHooks = uiSchemaPlugin.serverHooks;

    const jestFn = vi.fn();

    serverHooks.register('onSelfMove', 'testOnSelfMove', async ({ options }) => {
      jestFn();
    });

    await uiSchemaRepository.insert(schema);

    await uiSchemaRepository.insertAdjacent(
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

    expect(jestFn).toHaveBeenCalled();
  });
});
