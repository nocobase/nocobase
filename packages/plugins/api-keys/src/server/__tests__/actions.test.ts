import Database, { Repository } from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';
import ApiKeysPlugin from '../';

describe('actions', () => {
  describe('api-keys', () => {
    let app: MockServer;
    let db: Database;
    let repo: Repository;
    let agent;

    beforeAll(async () => {
      app = mockServer();
      app.plugin(ApiKeysPlugin);
      await app.loadAndInstall({ clean: true });
      db = app.db;
      repo = db.getRepository('apiKeys');
      agent = app.agent();
    });

    afterEach(async () => {
      await repo.destroy({
        truncate: true,
      });
    });

    afterAll(async () => {
      await db.close();
    });

    // it('should list authenticator types', async () => {
    //   expect(repo.count()).toMatchInlineSnapshot();
    // });
  });
});
