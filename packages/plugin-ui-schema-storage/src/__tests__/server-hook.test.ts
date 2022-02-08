import { mockServer, MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import PluginUiSchema, { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';

describe('server hooks', () => {
  let app: MockServer;
  let db: Database;
  let uiSchemaRepository: UiSchemaRepository;

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

    await app.loadAndInstall();

    uiSchemaRepository = db.getRepository('ui_schemas');
  });

  it('should save uiSchemaAttrs', async () => {
    const schema = {
      name: 'row',
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
                afterDestroyField: ['bbb'],
              },
            },
          },
        },
      },
    };

    await uiSchemaRepository.insert(schema);
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
});
