import { MockServer } from '@nocobase/test';
import createApp from './index';
import { Dumper } from '../dumper';

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

    const dump = new Dumper(app);
    const dumpableCollections = await dump.dumpableCollections();

    expect((dumpableCollections.requiredGroups || []).length).toBeGreaterThan(0);
    expect(dumpableCollections.userCollections[0]['name']).toEqual('test_collection');
  });
});
