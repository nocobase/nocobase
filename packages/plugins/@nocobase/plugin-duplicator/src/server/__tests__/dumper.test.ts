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

  it('should get dumped collections by data types', async () => {
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

    const dumper = new Dumper(app);
    const collections = dumper.getCollectionsByDataTypes(new Set(['business']));
    expect(collections.includes('test_collection')).toBeTruthy();
  });
});
