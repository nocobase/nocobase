import Database, { Repository } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('actions', () => {
  describe('authenticators', () => {
    let app: MockServer;
    let db: Database;
    let repo: Repository;
    let agent;

    beforeAll(async () => {
      app = await createMockServer({
        plugins: ['auth'],
      });
      db = app.db;
      repo = db.getRepository('authenticators');
      agent = app.agent();
    });

    afterEach(async () => {
      await repo.destroy({
        truncate: true,
      });
    });

    afterAll(async () => {
      await app.destroy();
    });

    it('should list authenticator types', async () => {
      const res = await agent.resource('authenticators').listTypes();
      expect(res.body.data).toEqual([
        {
          name: 'Email/Password',
          title: 'Password',
        },
      ]);
    });

    it('should return enabled authenticators with public options', async () => {
      await repo.destroy({
        truncate: true,
      });
      await repo.createMany({
        records: [
          { name: 'test', authType: 'testType', enabled: true, options: { public: { test: 1 }, private: { test: 2 } } },
          { name: 'test2', authType: 'testType' },
        ],
      });
      const res = await agent.resource('authenticators').publicList();
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('test');
    });

    it('should keep at least one authenticator', async () => {
      await repo.createMany({
        records: [{ name: 'test', authType: 'testType', enabled: true }],
      });
      const res = await agent.resource('authenticators').destroy();
      expect(res.statusCode).toBe(400);
      expect(await repo.count()).toBe(1);
    });

    it('shoud enable at least one authenticator', async () => {
      await repo.createMany({
        records: [{ name: 'test', authType: 'testType', enabled: true }],
      });
      const res = await agent.resource('authenticators').update({
        filterByTk: 1,
        values: {
          enabled: false,
        },
      });
      expect(res.statusCode).toBe(400);
      expect(await repo.count()).toBe(1);
    });
  });

  describe('auth', () => {
    let app: MockServer;
    let db: Database;
    let agent;

    beforeEach(async () => {
      process.env.INIT_ROOT_EMAIL = 'test@nocobase.com';
      process.env.INT_ROOT_USERNAME = 'test';
      process.env.INIT_ROOT_PASSWORD = '123456';
      process.env.INIT_ROOT_NICKNAME = 'Test';
      app = await createMockServer({
        plugins: ['auth', 'users'],
      });
      db = app.db;
      agent = app.agent();
    });

    afterEach(async () => {
      await app.destroy();
    });

    it('should sign in with password', async () => {
      let res = await agent.resource('auth').check();
      expect(res.body.data.id).toBeUndefined();

      res = await agent
        .post('/auth:signIn')
        .set({ 'X-Authenticator': 'basic' })
        .send({
          account: process.env.INIT_ROOT_USERNAME || process.env.INIT_ROOT_EMAIL,
          password: process.env.INIT_ROOT_PASSWORD,
        });
      expect(res.statusCode).toEqual(200);
      const data = res.body.data;
      const token = data.token;
      expect(token).toBeDefined();

      res = await agent.get('/auth:check').set({ Authorization: `Bearer ${token}`, 'X-Authenticator': 'basic' });
      expect(res.body.data.id).toBeDefined();
    });

    it('should disable sign up', async () => {
      let res = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        username: 'new',
        password: 'new',
        confirm_password: 'new',
      });
      expect(res.statusCode).toEqual(200);

      const repo = db.getRepository('authenticators');
      await repo.update({
        filter: {
          name: 'basic',
        },
        values: {
          options: {
            public: {
              allowSignUp: false,
            },
          },
        },
      });
      res = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        username: process.env.INIT_ROOT_USERNAME,
        password: process.env.INIT_ROOT_PASSWORD,
      });
      expect(res.statusCode).toEqual(403);
    });

    it('should compitible with old api', async () => {
      // Create a user without username
      const userRepo = db.getRepository('users');
      const email = 'test2@nocobase.com';
      const password = '1234567';
      await userRepo.create({
        values: {
          email,
          password,
        },
      });
      const res = await agent.post('/auth:signIn').set({ 'X-Authenticator': 'basic' }).send({
        email: 'test@nocobase.com',
        password: '123456',
      });
      expect(res.statusCode).toEqual(200);
      const data = res.body.data;
      const token = data.token;
      expect(token).toBeDefined();
    });

    it('should change password', async () => {
      // Create a user without email
      const userRepo = db.getRepository('users');
      const user = await userRepo.create({
        values: {
          username: 'test',
          password: '12345',
        },
      });
      const res = await agent.login(user).post('/auth:changePassword').set({ 'X-Authenticator': 'basic' }).send({
        oldPassword: '12345',
        newPassword: '123456',
        confirmPassword: '123456',
      });
      expect(res.statusCode).toEqual(200);

      // Create a user without username
      const user1 = await userRepo.create({
        values: {
          username: 'test2',
          password: '12345',
        },
      });
      const res2 = await agent.login(user1).post('/auth:changePassword').set({ 'X-Authenticator': 'basic' }).send({
        oldPassword: '12345',
        newPassword: '123456',
        confirmPassword: '123456',
      });
      expect(res2.statusCode).toEqual(200);
    });

    it('should check confirm password', async () => {
      const res = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        username: 'new',
        password: 'new',
        confirm_password: 'new1',
      });
      expect(res.statusCode).toEqual(400);
    });
  });
});
