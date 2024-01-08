import { BaseAuth } from '@nocobase/auth';
import { Database, Model } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

describe('auth', () => {
  let auth: BaseAuth;
  let app: MockServer;
  let db: Database;
  let user: Model;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth'],
    });
    db = app.db;

    user = await db.getRepository('users').create({
      values: {
        username: 'admin',
      },
    });

    const jwt = app.authManager.jwt;
    auth = new BaseAuth({
      userCollection: db.getCollection('users'),
      ctx: {
        app,
        getBearerToken() {
          return jwt.sign({ userId: user.id });
        },
        cache: app.cache,
      } as any,
    } as any);

    await app.cache.reset();
  });

  afterEach(async () => {
    await app.cache.reset();
    await app.destroy();
  });

  it('should get user from cache', async () => {
    expect(await app.cache.get(auth.getCacheKey(user.id))).toBeUndefined();
    let userData = await auth.check();
    expect(userData).not.toBeNull();
    expect(await app.cache.get(auth.getCacheKey(user.id))).toBeDefined();
    userData = await auth.check();
    expect(userData).not.toBeNull();
  });

  it('should update cache when user changed', async () => {
    await auth.check();
    let cacheData = await app.cache.get(auth.getCacheKey(user.id));
    expect(cacheData['nickname']).toBeNull();
    await db.getRepository('users').update({
      values: {
        nickname: 'admin',
      },
      filterByTk: user.id,
    });
    cacheData = await app.cache.get(auth.getCacheKey(user.id));
    console.log(cacheData);
    expect(cacheData['nickname']).toBe('admin');
  });

  it('should delete cache when user deleted', async () => {
    await auth.check();
    let cacheData = await app.cache.get(auth.getCacheKey(user.id));
    expect(cacheData['nickname']).toBeNull();
    await db.getRepository('users').destroy({
      filterByTk: user.id,
    });
    cacheData = await app.cache.get(auth.getCacheKey(user.id));
    expect(cacheData).toBeUndefined();
  });
});
