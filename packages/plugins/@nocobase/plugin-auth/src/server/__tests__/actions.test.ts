/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Repository } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import { getAuthCookieName } from '@nocobase/utils';

describe('actions', () => {
  describe('authenticators', () => {
    let app: MockServer;
    let db: Database;
    let repo: Repository;
    let agent;

    beforeAll(async () => {
      app = await createMockServer({
        plugins: ['field-sort', 'auth'],
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
      expect(res.body.data).toMatchObject([
        {
          name: 'Email/Password',
        },
      ]);
    });

    it('should return enabled authenticators with public options', async () => {
      app.authManager.registerTypes('testType1', {
        auth: {} as any,
        getPublicOptions: (options) => {
          return {
            text: 'custom public options',
          };
        },
      });
      await repo.destroy({
        truncate: true,
      });
      await repo.createMany({
        records: [
          { name: 'test', authType: 'testType', enabled: true, options: { public: { test: 1 }, private: { test: 2 } } },
          { name: 'test1', authType: 'testType1', enabled: true },
          { name: 'test2', authType: 'testType' },
        ],
      });
      const res = await agent.resource('authenticators').publicList();
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].name).toBe('test');
      expect(res.body.data[0].options).toMatchObject({ test: 1 });
      expect(res.body.data[1].name).toBe('test1');
      expect(res.body.data[1].options).toMatchObject({ text: 'custom public options' });
    });

    it('should keep at least one authenticator', async () => {
      await repo.destroy({ truncate: true });
      const authenticator = await repo.create({
        values: { name: 'test', authType: 'testType', enabled: true },
      });
      const res = await agent.resource('authenticators').destroy({
        filterByTk: authenticator.id,
      });
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

    function getCookieValue(cookies: string[], name: string) {
      return cookies
        .find((cookie) => cookie.startsWith(`${name}=`))
        ?.split(';')[0]
        .slice(name.length + 1);
    }

    beforeEach(async () => {
      process.env.INIT_ROOT_EMAIL = 'test@nocobase.com';
      process.env.INT_ROOT_USERNAME = 'test';
      process.env.INIT_ROOT_PASSWORD = '123456';
      process.env.INIT_ROOT_NICKNAME = 'Test';
      app = await createMockServer({
        plugins: ['field-sort', 'auth', 'users', 'system-settings'],
      });
      db = app.db;
      agent = app.agent();
    });

    afterEach(async () => {
      await app.db.clean({ drop: true });
      await app.destroy();
    });

    it('should check parameters when signing in', async () => {
      const res = await agent.post('/auth:signIn').set({ 'X-Authenticator': 'basic' }).send({});
      expect(res.statusCode).toEqual(400);
      expect(res.error.text).toBe('Please enter your username or email');
    });

    it('should check user when signing in', async () => {
      const res = await agent.post('/auth:signIn').set({ 'X-Authenticator': 'basic' }).send({
        email: 'no-exists@nocobase.com',
      });
      expect(res.statusCode).toEqual(401);
      expect(res.error.text).toBe('The username/email or password is incorrect, please re-enter');
    });

    it('should check password when signing in', async () => {
      const res = await agent.post('/auth:signIn').set({ 'X-Authenticator': 'basic' }).send({
        email: process.env.INIT_ROOT_EMAIL,
        password: 'incorrect',
      });
      expect(res.statusCode).toEqual(401);
      expect(res.error.text).toBe('The username/email or password is incorrect, please re-enter');
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
      expect(res.body.data.password).toBeUndefined();
    });

    it('should set auth cookies when signing in and clear auth cookies when signing out', async () => {
      const res = await agent
        .post('/auth:signIn')
        .set({ 'X-Authenticator': 'basic' })
        .send({
          account: process.env.INIT_ROOT_USERNAME || process.env.INIT_ROOT_EMAIL,
          password: process.env.INIT_ROOT_PASSWORD,
        });
      expect(res.statusCode).toEqual(200);

      const token = res.body.data.token;
      const cookies = res.headers['set-cookie'].join('; ');
      const normalizedCookies = cookies.toLowerCase();
      expect(cookies).toContain(`${getAuthCookieName('authToken', app.name)}=`);
      expect(cookies).toContain(`${getAuthCookieName('authenticator', app.name)}=basic`);
      expect(cookies).toContain(`${getAuthCookieName('csrfToken', app.name)}=`);
      expect(normalizedCookies).toContain('httponly');
      expect(normalizedCookies).toContain('samesite=lax');
      expect(normalizedCookies).toContain('path=/');

      const signOutRes = await agent
        .post('/auth:signOut')
        .set({ Authorization: `Bearer ${token}`, 'X-Authenticator': 'basic' });
      expect(signOutRes.statusCode).toEqual(200);

      const clearedCookies = signOutRes.headers['set-cookie'].join('; ');
      expect(clearedCookies).toContain(`${getAuthCookieName('authToken', app.name)}=`);
      expect(clearedCookies).toContain(`${getAuthCookieName('authenticator', app.name)}=`);
      expect(clearedCookies).toContain(`${getAuthCookieName('role', app.name)}=`);
      expect(clearedCookies).toContain(`${getAuthCookieName('csrfToken', app.name)}=`);
      expect(clearedCookies.toLowerCase()).toContain('expires=thu, 01 jan 1970 00:00:00 gmt');
    });

    it('should set secure auth cookies behind an HTTPS reverse proxy', async () => {
      const res = await agent
        .post('/auth:signIn')
        .set({ 'X-Authenticator': 'basic', 'X-Forwarded-Proto': 'https, http' })
        .send({
          account: process.env.INIT_ROOT_USERNAME || process.env.INIT_ROOT_EMAIL,
          password: process.env.INIT_ROOT_PASSWORD,
        });

      expect(res.statusCode).toEqual(200);
      const cookies = res.headers['set-cookie'].join('; ').toLowerCase();
      expect(cookies).toContain('secure');
    });

    it('should use APP_PUBLIC_PATH as auth cookie path', async () => {
      const originalPath = process.env.APP_PUBLIC_PATH;
      process.env.APP_PUBLIC_PATH = '/nocobase';

      try {
        const res = await agent
          .post('/auth:signIn')
          .set({ 'X-Authenticator': 'basic' })
          .send({
            account: process.env.INIT_ROOT_USERNAME || process.env.INIT_ROOT_EMAIL,
            password: process.env.INIT_ROOT_PASSWORD,
          });

        expect(res.statusCode).toEqual(200);
        const cookies = res.headers['set-cookie'].join('; ');
        expect(cookies).toContain(`${getAuthCookieName('authToken', app.name)}=`);
        expect(cookies).toContain(`${getAuthCookieName('authenticator', app.name)}=basic`);
        expect(cookies).toContain(`${getAuthCookieName('csrfToken', app.name)}=`);
        expect(cookies.toLowerCase()).toContain('path=/nocobase');
      } finally {
        if (originalPath === undefined) {
          delete process.env.APP_PUBLIC_PATH;
        } else {
          process.env.APP_PUBLIC_PATH = originalPath;
        }
      }
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
      const userAgent = await agent.login(user, null);

      // Should check password consistency
      const res = await userAgent.post('/auth:changePassword').set({ 'X-Authenticator': 'basic' }).send({
        oldPassword: '12345',
        newPassword: '123456',
        confirmPassword: '1234567',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.error.text).toBe('The password is inconsistent, please re-enter');

      // Should check old password
      const res1 = await userAgent.post('/auth:changePassword').set({ 'X-Authenticator': 'basic' }).send({
        oldPassword: '1',
        newPassword: '123456',
        confirmPassword: '123456',
      });
      expect(res1.statusCode).toEqual(401);
      expect(res1.error.text).toBe('The password is incorrect, please re-enter');

      const res2 = await userAgent.post('/auth:changePassword').set({ 'X-Authenticator': 'basic' }).send({
        oldPassword: '12345',
        newPassword: '123456',
        confirmPassword: '123456',
      });
      expect(res2.statusCode).toEqual(200);

      // Create a user without username
      const user1 = await userRepo.create({
        values: {
          email: 'test3@nocobase.com',
          password: '12345',
        },
      });
      const res3 = await (await agent.login(user1))
        .post('/auth:changePassword')
        .set({ 'X-Authenticator': 'basic' })
        .send({
          oldPassword: '12345',
          newPassword: '123456',
          confirmPassword: '123456',
        });
      expect(res3.statusCode).toEqual(200);
    });

    it('should not allow to change password', async () => {
      await db.getRepository('systemSettings').update({
        filterByTk: 1,
        values: {
          enableChangePassword: false,
        },
      });
      const userRepo = db.getRepository('users');
      const user = await userRepo.create({
        values: {
          username: 'test',
          password: '12345',
        },
      });
      const userAgent = await agent.login(user);

      const res = await userAgent.post('/auth:changePassword').set({ 'X-Authenticator': 'basic' }).send({
        oldPassword: '12345',
        newPassword: '123456',
        confirmPassword: '123456',
      });
      expect(res.statusCode).toEqual(403);
      expect(res.error.text).toBe('Password is not allowed to be changed');
    });

    it('should check confirm password when signing up', async () => {
      const res = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        username: 'new',
        password: 'new',
        confirm_password: 'new1',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.error.text).toBe('The password is inconsistent, please re-enter');
    });

    it('should check username when signing up', async () => {
      const res = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        username: '',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.error.text).toBe('Please enter a valid username');
      const res1 = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        username: '@@',
      });
      expect(res1.statusCode).toEqual(400);
      expect(res1.error.text).toBe('Please enter a valid username');

      const repo = db.getRepository('authenticators');
      await repo.update({
        filter: {
          name: 'basic',
        },
        values: {
          options: {
            public: {
              allowSignUp: true,
              signupForm: [{ field: 'nickname', show: true }],
            },
          },
        },
      });

      const res2 = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        nickname: 'test',
      });
      expect(res2.statusCode).toEqual(400);
      expect(res2.error.text).toBe('Please enter a valid username');
    });

    it('should check email when signing up', async () => {
      const repo = db.getRepository('authenticators');
      await repo.update({
        filter: {
          name: 'basic',
        },
        values: {
          options: {
            public: {
              allowSignUp: true,
              signupForm: [{ field: 'email', show: true, required: true }],
            },
          },
        },
      });
      const res1 = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        email: '',
      });
      expect(res1.statusCode).toEqual(400);
      expect(res1.error.text).toBe('Please enter a valid email address');
      const res2 = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        email: 'abc',
      });
      expect(res2.statusCode).toEqual(400);
      expect(res2.error.text).toBe('Please enter a valid email address');
      const res3 = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        email: 'test1@nocobase.com',
        password: '123',
        confirm_password: '123',
      });
      expect(res3.statusCode).toEqual(200);
    });

    it('should check a required field when signing up', async () => {
      const repo = db.getRepository('authenticators');
      await repo.update({
        filter: {
          name: 'basic',
        },
        values: {
          options: {
            public: {
              allowSignUp: true,
              signupForm: [
                { field: 'username', show: true, required: true },
                { field: 'nickname', show: true, required: true },
              ],
            },
          },
        },
      });
      const res1 = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        username: 'test',
      });
      expect(res1.statusCode).toEqual(400);
      expect(res1.error.text).toBe('Please enter nickname');
    });

    it('should check password when signing up', async () => {
      const res = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        username: 'new',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.error.text).toBe('Please enter a password');
    });

    it('should write correct user data when signing up', async () => {
      const repo = db.getRepository('authenticators');
      await repo.update({
        filter: {
          name: 'basic',
        },
        values: {
          options: {
            public: {
              allowSignUp: true,
              signupForm: [
                { field: 'username', show: true, required: true },
                { field: 'nickname', show: true, required: true },
              ],
            },
          },
        },
      });
      const res = await agent.post('/auth:signUp').set({ 'X-Authenticator': 'basic' }).send({
        username: 'test',
        nickname: 'Test',
        phone: '12345678901',
        password: '123456',
        confirm_password: '123456',
      });
      expect(res.statusCode).toEqual(200);
      const user = await db.getRepository('users').findOne({
        filter: {
          username: 'test',
        },
      });
      expect(user.nickname).toBe('Test');
      expect(user.phone).toBeNull();
    });

    it('should sign user out when changing password', async () => {
      const userRepo = db.getRepository('users');
      const user = await userRepo.create({
        values: {
          username: 'test',
          password: '12345',
        },
      });
      const userAgent = await agent.login(user, null);
      const res = await userAgent.post('/auth:check').set({ 'X-Authenticator': 'basic' }).send();
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.id).toBeDefined();
      const res2 = await userAgent.post('/auth:changePassword').set({ 'X-Authenticator': 'basic' }).send({
        oldPassword: '12345',
        newPassword: '123456',
        confirmPassword: '123456',
      });
      expect(res2.statusCode).toEqual(200);
      const res3 = await userAgent.post('/auth:check').set({ 'X-Authenticator': 'basic' }).send();
      expect(res3.statusCode).toEqual(401);
      expect(res3.text).toBe('User password changed, please signin again.');
    });

    it('should not renew an expired token after password changed', async () => {
      await app.authManager.tokenController.setConfig({
        tokenExpirationTime: '1s',
        sessionExpirationTime: '1d',
        expiredTokenRenewLimit: '1d',
      });

      const userRepo = db.getRepository('users');
      const user = await userRepo.create({
        values: {
          username: 'test',
          password: '12345',
        },
      });
      const firstAgent = await agent.login(user, null);
      const secondAgent = await agent.login(user, null);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await firstAgent.post('/auth:changePassword').set({ 'X-Authenticator': 'basic' }).send({
        oldPassword: '12345',
        newPassword: '123456',
        confirmPassword: '123456',
      });
      expect(res.statusCode).toEqual(200);

      const res2 = await secondAgent.post('/auth:check').set({ 'X-Authenticator': 'basic' }).send();
      expect(res2.statusCode).toEqual(401);
      expect(res2.text).toBe('User password changed, please signin again.');
      expect(res2.headers['x-new-token']).toBeUndefined();
    });

    it('should refresh auth cookies without rotating csrf cookie when renewing token', async () => {
      await app.authManager.tokenController.setConfig({
        tokenExpirationTime: '1s',
        sessionExpirationTime: '1d',
        expiredTokenRenewLimit: '1d',
      });

      const signInRes = await agent
        .post('/auth:signIn')
        .set({ 'X-Authenticator': 'basic' })
        .send({
          account: process.env.INIT_ROOT_USERNAME || process.env.INIT_ROOT_EMAIL,
          password: process.env.INIT_ROOT_PASSWORD,
        });
      const token = signInRes.body.data.token;
      const csrfToken = getCookieValue(signInRes.headers['set-cookie'], getAuthCookieName('csrfToken', app.name));

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await agent.get('/auth:check').set({ Authorization: `Bearer ${token}`, 'X-Authenticator': 'basic' });

      expect(res.statusCode).toEqual(200);
      expect(res.headers['x-new-token']).toBeDefined();
      const renewedCookies = res.headers['set-cookie'].join('; ');
      expect(renewedCookies).toContain(`${getAuthCookieName('authToken', app.name)}=`);
      expect(renewedCookies).not.toContain(`${getAuthCookieName('csrfToken', app.name)}=`);
      expect(csrfToken).toBeDefined();
    });
  });
});
