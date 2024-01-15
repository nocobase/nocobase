import { ITokenBlacklistService } from '@nocobase/auth';
import Database, { Repository } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

describe('token-blacklist', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let tokenBlacklist: ITokenBlacklistService;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['auth'],
    });
    db = app.db;
    repo = db.getRepository('tokenBlacklist');
    tokenBlacklist = app.authManager.jwt.blacklist;
  });

  afterAll(async () => {
    await app.destroy();
  });

  afterEach(async () => {
    await repo.destroy({
      truncate: true,
    });
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
    expect(await tokenBlacklist.has('should be deleted')).not.toBeTruthy();
    expect(await tokenBlacklist.has('should not be deleted')).toBeTruthy();
  });
});
