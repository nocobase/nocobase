import { MockServer } from '@nocobase/test';
import createApp from './index';
import { CollectionGroupManager } from '../collection-group-manager';

describe('dumper', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get collection groups', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test_collection',
        fields: [
          {
            name: 'test_field1',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const collectionGroups = CollectionGroupManager.getGroups(app);

    console.log(collectionGroups);
  });
});
