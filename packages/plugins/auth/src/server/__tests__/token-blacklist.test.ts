import Database, { Repository } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import { TokenBlacklistService } from '../token-blacklist';

describe('token-blacklist', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let tokenBlacklist: TokenBlacklistService;

  beforeAll(async () => {
    app = mockServer({
      plugins: ['auth'],
    });
    await app.loadAndInstall({ clean: true });
    db = app.db;
    repo = db.getRepository('tokenBlacklist');
    tokenBlacklist = new TokenBlacklistService(app.getPlugin('auth'));
  });

  afterAll(async () => {
    await db.close();
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
    await tokenBlacklist.deleteByExpiration();
    expect(await tokenBlacklist.has('should be deleted')).not.toBeTruthy();
    expect(await tokenBlacklist.has('should not be deleted')).toBeTruthy();
  });

  it('should stop corn job when plugin disabled', async () => {
    const cornJob = tokenBlacklist.cornJob;
    expect(cornJob.running).toBeTruthy();
    // pm.enable
    await app.emitAsync('afterDisablePlugin', 'auth');
    expect(cornJob.running).toBeFalsy();
  });

  it('should start corn job when plugin enabled', async () => {
    const cornJob = tokenBlacklist.cornJob;
    expect(cornJob.running).toBeFalsy();
    // pm.disable
    await app.emitAsync('afterEnablePlugin', 'auth');
    expect(cornJob.running).toBeTruthy();
  });

  it('should stop corn job when server is stop', async () => {
    const cornJob = tokenBlacklist.cornJob;
    expect(cornJob.running).toBeTruthy();
    await app.emitAsync('beforeStop', 'auth');
    expect(cornJob.running).toBeFalsy();

    // reset
    cornJob.start();
  });
});
