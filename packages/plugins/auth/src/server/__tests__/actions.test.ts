import Database from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';
import AuthPlugin from '../';
import UsersPlugin from '@nocobase/plugin-users';

describe('actions', () => {
  describe('authenticators', () => {
    let app: MockServer;
    let db: Database;
    let agent;

    beforeAll(async () => {
      app = mockServer();
      app.plugin(AuthPlugin);
      await app.loadAndInstall({ clean: true });
      db = app.db;

      agent = app.agent();
    });

    afterAll(async () => {
      await db.close();
    });

    it('should list authenticator types', async () => {
      const res = await agent.resource('authenticators').listTypes();
      expect(res.body.data).toEqual(['email/password']);
    });

    it('should return enabled authenticators', async () => {
      const repo = db.getRepository('authenticators');
      await repo.createMany({
        records: [
          { name: 'test', authType: 'testType', enabled: true },
          { name: 'test2', authType: 'testType' },
        ],
      });
      const res = await agent.resource('authenticators').publicList();
      expect(res.body.data).toEqual([
        { name: 'basic', authType: 'email/password' },
        { name: 'test', authType: 'testType' },
      ]);
    });
  });

  describe('auth', () => {
    let app: MockServer;
    let db: Database;
    let agent;

    beforeAll(async () => {
      app = mockServer();
      process.env.INIT_ROOT_EMAIL = 'test@nocobase.com';
      process.env.INIT_ROOT_PASSWORD = '123456';
      process.env.INIT_ROOT_NICKNAME = 'Test';
      app.plugin(AuthPlugin);
      app.plugin(UsersPlugin, { name: 'users' });
      await app.loadAndInstall({ clean: true });
      db = app.db;
      agent = app.agent();
    });

    afterAll(async () => {
      await db.close();
    });

    it('should sign in with email and password', async () => {
      let res = await agent.resource('auth').check();
      expect(res.body.data.id).toBeUndefined();

      res = await agent.post('/auth:signIn').set({ 'X-Authenticator': 'basic' }).send({
        email: process.env.INIT_ROOT_EMAIL,
        password: process.env.INIT_ROOT_PASSWORD,
      });
      expect(res.statusCode).toEqual(200);
      const data = res.body.data;
      const token = data.token;
      expect(token).toBeDefined();

      res = await agent.get('/auth:check').set({ Authorization: `Bearer ${token}`, 'X-Authenticator': 'basic' });
      expect(res.body.data.id).toBeDefined();
    });
  });
});
