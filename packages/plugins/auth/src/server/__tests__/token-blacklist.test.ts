import Database, { Repository } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import { createTokenBlacklistService } from '../token-blacklist';

describe('token-blacklist', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let tokenBlacklist: ReturnType<typeof createTokenBlacklistService>;

  beforeAll(async () => {
    app = mockServer({
      plugins: ['auth'],
    });
    await app.loadAndInstall({ clean: true });
    db = app.db;
    repo = db.getRepository('tokenBlacklist');
    tokenBlacklist = createTokenBlacklistService(repo);
  });

  afterEach(async () => {
    await repo.destroy({
      truncate: true,
    });
    await db.close();
  });

  it('add and has correctly', async () => {
    await tokenBlacklist.add({
      token: 'test',
      expiration: new Date(),
    });

    await tokenBlacklist.add({
      token: 'test1',
      expiration: new Date(),
    });

    expect(tokenBlacklist.has('test')).toBeTruthy();
    expect(tokenBlacklist.has('test1')).toBeTruthy();
  });

  it('add same token correctly', async () => {
    await tokenBlacklist.add({
      token: 'test',
      expiration: new Date(),
    });

    await tokenBlacklist.add({
      token: 'test',
      expiration: new Date(),
    });

    expect(tokenBlacklist.has('test')).toBeTruthy();
  });

  it('delete expired token correctly', async () => {
    await tokenBlacklist.add({
      token: 'should be deleted',
      expiration: new Date('2020-01-01'),
    });
    await tokenBlacklist.add({
      token: 'should not be deleted',
      expiration: new Date('2100-01-01'),
    });
    await tokenBlacklist.deleteExpiredToken();
    expect(await tokenBlacklist.has('should be deleted')).not.toBeTruthy();
    expect(await tokenBlacklist.has('should not be deleted')).toBeTruthy();
  });
});
