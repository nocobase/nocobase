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
        'x-server-hooks': {
          afterDestroyCollection: ['aaa'],
        },
        properties: {
          col1: {
            'x-uid': 'col1',
            'x-component': 'Col',
            properties: {
              field1: {
                'x-uid': 'field1',
                'x-component': 'Input',
                'x-collection-field': 'posts.title',
                'x-server-hooks': {
                  afterDestroyField: ['onFieldDestroy'],
                },
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

  it('should save uiSchemaAttrs', async () => {
    const node = await uiSchemaRepository.findOne({
      filter: {
        uid: 'table',
      },
    });

    // @ts-ignore
    const nodeAttr = await node.getAttrs();
    expect(nodeAttr.get('collectionPath')).toEqual('posts');

    const nodeField = await uiSchemaRepository.findOne({
      filter: {
        uid: 'field1',
      },
    });

    // @ts-ignore
    const nodeFieldAttr = await nodeField.getAttrs();
    expect(nodeFieldAttr.get('collectionPath')).toEqual('posts.title');
  });

  it('should call server hooks', async () => {
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

    serverHooks.register('afterDestroyField', 'onFieldDestroy', hookFn);

    // destroy a field
    await db.getRepository('fields').destroy({
      filter: {
        name: 'title',
      },
      individualHooks: true,
    });

    expect(hookFn).toHaveBeenCalled();
  });
});
