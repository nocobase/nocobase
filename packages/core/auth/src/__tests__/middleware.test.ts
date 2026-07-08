/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import { getAuthCookieName } from '@nocobase/utils';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { vi } from 'vitest';
import { AuthErrorCode } from '../auth';

describe('middleware', () => {
  let app: MockServer;
  let db: Database;
  let agent;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['users', 'auth', 'acl', 'field-sort', 'data-source-manager', 'error-handler', 'system-settings'],
    });

    // app.plugin(ApiKeysPlugin);
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
      const user = await db.getRepository('users').findOne();
      await agent.login(user.id);
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
      const { jti } = jwt.decode(token) as JwtPayload;
      expect(res.status).toBe(200);
      expect(hasFn).toHaveBeenCalledWith(jti);
    });

    it('signOut should add token to blacklist', async () => {
      // signOut will add token
      const res = await agent.resource('auth').signOut();
      const token = res.request.header['Authorization'].replace('Bearer ', '');
      const { jti } = jwt.decode(token) as JwtPayload;
      expect(addFn).toHaveBeenCalledWith({
        token: jti,
        // Date or String is ok
        expiration: expect.any(String),
      });
    });

    it('should throw 401 when token in blacklist', async () => {
      hasFn.mockImplementation(() => true);
      const res = await agent.resource('auth').check();
      expect(res.status).toBe(401);
      expect(res.body.errors.some((error) => error.code === AuthErrorCode.BLOCKED_TOKEN)).toBe(true);
    });

    it('should throw 401 when token in empty', async () => {
      const visitorAgent = app.agent();
      hasFn.mockImplementation(() => true);
      const res = await visitorAgent.resource('auth').check();
      expect(res.status).toBe(401);
      expect(res.body.errors.some((error) => error.code === AuthErrorCode.EMPTY_TOKEN)).toBe(true);
    });
  });

  describe('cookie token fallback', () => {
    function getCookieValue(cookies: string[], name: string) {
      return cookies
        .find((cookie) => cookie.startsWith(`${name}=`))
        ?.split(';')[0]
        .slice(name.length + 1);
    }

    it('should use auth cookie when authorization header and query token are absent', async () => {
      const user = await db.getRepository('users').findOne();
      await agent.login(user.id);
      const checkRes = await agent.resource('auth').check();
      const token = checkRes.request.header['Authorization'].replace('Bearer ', '');
      const visitorAgent = app.agent();

      const res = await visitorAgent
        .get('/auth:check')
        .set('Cookie', [`${getAuthCookieName('authToken', app.name)}=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(user.id);
    });

    it('should read auth cookie only from the current app namespace', async () => {
      const originalName = app.options.name;
      app.options.name = 'subapp';

      try {
        const user = await db.getRepository('users').findOne();
        await agent.login(user.id);
        const checkRes = await agent.resource('auth').check();
        const token = checkRes.request.header['Authorization'].replace('Bearer ', '');
        const visitorAgent = app.agent();

        const wrongAppCookieRes = await visitorAgent
          .get('/auth:check')
          .set('Cookie', [`${getAuthCookieName('authToken', 'main')}=${token}`]);
        expect(wrongAppCookieRes.status).toBe(401);
        expect(wrongAppCookieRes.body.errors.some((error) => error.code === AuthErrorCode.EMPTY_TOKEN)).toBe(true);

        const res = await visitorAgent
          .get('/auth:check')
          .set('Cookie', [`${getAuthCookieName('authToken', 'subapp')}=${token}`]);
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(user.id);
      } finally {
        app.options.name = originalName;
      }
    });

    it('should not refresh auth cookies after successful header token check', async () => {
      const user = await db.getRepository('users').findOne();
      await agent.login(user.id);
      const checkRes = await agent.resource('auth').check();
      const token = checkRes.request.header['Authorization'].replace('Bearer ', '');
      const visitorAgent = app.agent();

      const res = await visitorAgent.get('/auth:check').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('should not fallback to auth cookie when authorization header exists but is invalid', async () => {
      const user = await db.getRepository('users').findOne();
      await agent.login(user.id);
      const checkRes = await agent.resource('auth').check();
      const token = checkRes.request.header['Authorization'].replace('Bearer ', '');
      const visitorAgent = app.agent();

      const res = await visitorAgent
        .get('/auth:check')
        .set('Authorization', 'Bearer invalid-token')
        .set('Cookie', [`${getAuthCookieName('authToken', app.name)}=${token}`]);

      expect(res.status).toBe(401);
      expect(res.body.errors.some((error) => error.code === AuthErrorCode.INVALID_TOKEN)).toBe(true);
    });

    it('should not fallback to auth cookie when query token exists but is invalid', async () => {
      const user = await db.getRepository('users').findOne();
      await agent.login(user.id);
      const checkRes = await agent.resource('auth').check();
      const token = checkRes.request.header['Authorization'].replace('Bearer ', '');
      const visitorAgent = app.agent();

      const res = await visitorAgent
        .get('/auth:check?token=invalid-token')
        .set('Cookie', [`${getAuthCookieName('authToken', app.name)}=${token}`]);

      expect(res.status).toBe(401);
      expect(res.body.errors.some((error) => error.code === AuthErrorCode.INVALID_TOKEN)).toBe(true);
    });

    it('should require csrf token for unsafe cookie-auth requests only', async () => {
      const signInRes = await app
        .agent()
        .post('/auth:signIn')
        .set({ 'X-Authenticator': 'basic' })
        .send({
          account: process.env.INIT_ROOT_USERNAME || process.env.INIT_ROOT_EMAIL,
          password: process.env.INIT_ROOT_PASSWORD,
        });
      const cookies = signInRes.headers['set-cookie'];
      const csrfToken = getCookieValue(cookies, getAuthCookieName('csrfToken', app.name));
      const cookieHeader = cookies.map((cookie) => cookie.split(';')[0]);
      expect(cookies.join('; ')).toContain(`${getAuthCookieName('role', app.name)}=`);

      const blockedRes = await app.agent().post('/auth:check').set('Cookie', cookieHeader);
      expect(blockedRes.status).toBe(403);

      const passedRes = await app
        .agent()
        .post('/auth:check')
        .set('Cookie', cookieHeader)
        .set('X-CSRF-Token', csrfToken);
      expect(passedRes.status).toBe(200);

      const headerTokenRes = await app
        .agent()
        .post('/auth:check')
        .set('Authorization', `Bearer ${signInRes.body.data.token}`)
        .set('Cookie', cookieHeader);
      expect(headerTokenRes.status).toBe(200);
    });

    it('should not require csrf token for unsafe query-token requests', async () => {
      const signInRes = await app
        .agent()
        .post('/auth:signIn')
        .set({ 'X-Authenticator': 'basic' })
        .send({
          account: process.env.INIT_ROOT_USERNAME || process.env.INIT_ROOT_EMAIL,
          password: process.env.INIT_ROOT_PASSWORD,
        });

      const res = await app.agent().post(`/auth:check?token=${signInRes.body.data.token}`);

      expect(res.status).toBe(200);
    });

    it('should not require csrf token for public actions when an old auth cookie exists', async () => {
      const res = await app
        .agent()
        .post('/auth:signIn')
        .set({ 'X-Authenticator': 'basic' })
        .set('Cookie', [`${getAuthCookieName('authToken', app.name)}=invalid-token`])
        .send({
          account: process.env.INIT_ROOT_USERNAME || process.env.INIT_ROOT_EMAIL,
          password: process.env.INIT_ROOT_PASSWORD,
        });

      expect(res.status).toBe(200);
    });

    it('should not treat auth cookies as explicit auth when acl is disabled', async () => {
      app.options.acl = false;

      const res = await app
        .agent()
        .post('/auth:check')
        .set('Cookie', [`${getAuthCookieName('authToken', app.name)}=invalid-token`]);

      expect(res.status).not.toBe(401);
    });
  });

  describe('cors credentials', () => {
    const restoreEnv = (name: string, value: string | undefined) => {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    };

    it('should not allow credentials for reflected origins without whitelist', async () => {
      const originalWhitelist = process.env.CORS_ORIGIN_WHITELIST;
      delete process.env.CORS_ORIGIN_WHITELIST;

      try {
        const res = await app.agent().get('/auth:check').set('Origin', 'https://evil.example');

        expect(res.headers['access-control-allow-origin']).toBe('https://evil.example');
        expect(res.headers['access-control-allow-credentials']).toBeUndefined();
      } finally {
        restoreEnv('CORS_ORIGIN_WHITELIST', originalWhitelist);
      }
    });

    it('should allow credentials for whitelisted origins', async () => {
      const originalWhitelist = process.env.CORS_ORIGIN_WHITELIST;
      process.env.CORS_ORIGIN_WHITELIST = 'https://trusted.example';

      try {
        const res = await app.agent().get('/auth:check').set('Origin', 'https://trusted.example');

        expect(res.headers['access-control-allow-origin']).toBe('https://trusted.example');
        expect(res.headers['access-control-allow-credentials']).toBe('true');
      } finally {
        restoreEnv('CORS_ORIGIN_WHITELIST', originalWhitelist);
      }
    });
  });

  describe('not exist user', async () => {
    it('should throw 401 when user not exist', async () => {
      const notExistUserAgent = await agent.login(1001);
      const res = await notExistUserAgent.resource('auth').check();
      expect(res.status).toBe(401);
      expect(res.body.errors.some((error) => error.code === AuthErrorCode.NOT_EXIST_USER)).toBe(true);
    });
  });
});
