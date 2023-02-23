import { mockServer, MockServer } from '@nocobase/test';
import { Database, Model } from '@nocobase/database';

describe('dump with multiple apps', () => {
  let app: MockServer;
  let db: Database;
  beforeEach(async () => {
    app = mockServer({
      plugins: ['nocobase'],
    });

    db = app.db;
    await app.loadAndInstall({ clean: true });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should dump sub app', async () => {
    console.log('hello world');
  });
});
