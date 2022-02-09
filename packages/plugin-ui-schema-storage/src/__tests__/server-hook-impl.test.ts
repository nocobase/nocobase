import { mockServer, MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import PluginUiSchema, { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import PluginCollectionManager from '@nocobase/plugin-collection-manager';
import { removeEmptyParents } from '../server-hooks/removeEmptyParents';

describe('server hooks', () => {
  let app: MockServer;
  let db: Database;
  let uiSchemaRepository: UiSchemaRepository;
  let uiSchemaPlugin: PluginUiSchema;

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

    uiSchemaPlugin = app.getPlugin<PluginUiSchema>('PluginUiSchema');
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
                      fields: ['name'],
                      method: 'removeEmptyParents',
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
                      fields: ['title'],
                      method: 'removeEmptyParents',
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
                      fields: ['intro'],
                      method: 'removeEmptyParents',
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

    uiSchemaPlugin.serverHooks.register('onCollectionFieldDestroy', 'removeEmptyParents', removeEmptyParents);

    await db.getRepository('fields').destroy({
      filter: {
        name: 'intro',
      },
      individualHooks: true,
    });

    const jsonTree = await uiSchemaRepository.getJsonSchema('grid1');
    expect(jsonTree['properties']['row1']['properties']['col11']).toBeDefined();
    expect(jsonTree['properties']['row1']['properties']['col12']).not.toBeDefined();
  });
});
