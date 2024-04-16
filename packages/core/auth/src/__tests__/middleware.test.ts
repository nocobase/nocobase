import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import { vi } from 'vitest';

describe('middleware', () => {
  let app: MockServer;
  let db: Database;
  let agent;

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
      acl: true,
      plugins: ['users', 'auth', 'acl', 'data-source-manager'],
    });

    // app.plugin(ApiKeysPlugin);
    await app.loadAndInstall({ clean: true });
    db = app.db;
    agent = app.agent();
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('blacklist', () => {
    const hasFn = vi.fn();
    const addFn = vi.fn();
    beforeEach(async () => {
      await agent.login(1);
      app.authManager.setTokenBlacklistService({
        has: hasFn,
        add: addFn,
      });
    });

    afterEach(() => {
      hasFn.mockReset();
      addFn.mockReset();
    });

    it('basic', async () => {
      const res = await agent.resource('auth').check();
      const token = res.request.header['Authorization'].replace('Bearer ', '');
      expect(res.status).toBe(200);
      expect(hasFn).toHaveBeenCalledWith(token);
    });

    it('signOut should add token to blacklist', async () => {
      // signOut will add token
      const res = await agent.resource('auth').signOut();
      const token = res.request.header['Authorization'].replace('Bearer ', '');
      expect(addFn).toHaveBeenCalledWith({
        token,
        // Date or String is ok
        expiration: expect.any(String),
      });
    });

    it('should throw 401 when token in blacklist', async () => {
      hasFn.mockImplementation(() => true);
      const res = await agent.resource('auth').check();
      expect(res.status).toBe(401);
      expect(res.text).toContain('token is not available');
    });
  });
});
