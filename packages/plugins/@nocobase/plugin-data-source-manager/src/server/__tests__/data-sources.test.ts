import { createMockServer, MockServer } from '@nocobase/test';

describe('data source', async () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'data-source-manager'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create data source', async () => {});
});
