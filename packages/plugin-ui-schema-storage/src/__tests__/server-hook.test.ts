import { mockServer, MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import PluginUiSchema, { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import PluginCollectionManager from '@nocobase/plugin-collection-manager';

describe('server hooks', () => {
  let app: MockServer;
  let db: Database;
  let uiSchemaRepository: UiSchemaRepository;
  let uiSchemaPlugin: PluginUiSchema;

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
                    fields: ['title'],
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
    app = mockServer({
      registerActions: true,
    });

    db = app.db;

    await app.cleanDb();
    app.plugin(PluginUiSchema);
    app.plugin(PluginCollectionManager);

    await app.loadAndInstall();

    uiSchemaRepository = db.getRepository('ui_schemas');
    await uiSchemaRepository.insert(schema);

    uiSchemaPlugin = app.getPlugin<PluginUiSchema>('PluginUiSchema');
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
    const hookFn = jest.fn();

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

    const hookFn = jest.fn();

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
    const hookFn = jest.fn();

    serverHooks.register('onSelfCreate', 'afterCreateMenu', hookFn);

    await uiSchemaRepository.create({
      values: {
        schema: menuSchema,
      },
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
          fields: ['title'],
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

    const jestFn = jest.fn();

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
    } catch (e) {}

    expect(jestFn).toHaveBeenCalled();
    expect(
      await db.getRepository('fields').findOne({
        filter: {
          name: 'title',
        },
      }),
    ).toBeDefined();
  });
});
