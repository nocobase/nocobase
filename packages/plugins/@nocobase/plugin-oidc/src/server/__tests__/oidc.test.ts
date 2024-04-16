import { Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';
import { authType } from '../../constants';
import { OIDCAuth } from '../oidc-auth';
import { AppSupervisor } from '@nocobase/server';

describe('oidc', () => {
  let app: MockServer;
  let db: Database;
  let agent;
  let authenticator;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth', 'oidc'],
    });
    db = app.db;
    agent = app.agent();

    const authenticatorRepo = db.getRepository('authenticators');
    authenticator = await authenticatorRepo.create({
      values: {
        name: 'oidc-auth',
        authType: authType,
        enabled: 1,
        options: {
          oidc: {
            issuer: '',
            clientId: '',
            clientSecret: '',
          },
        },
      },
    });
  });

  afterAll(async () => {
    await app.destroy();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.getRepository('users').destroy({
      truncate: true,
    });
  });

  it('should get auth url', async () => {
    agent = app.agent();
    vi.spyOn(OIDCAuth.prototype, 'createOIDCClient').mockResolvedValue({
      authorizationUrl: ({ state }) => state,
    } as any);
    const res = await agent.set('X-Authenticator', 'oidc-auth').resource('oidc').getAuthUrl();
    expect(res.body.data).toBeDefined();
    const search = new URLSearchParams(decodeURIComponent(res.body.data));
    expect(search.get('token')).toBeDefined();
    expect(search.get('name')).toBe('oidc-auth');
    expect(res.headers['set-cookie']).toBeDefined();
    const token = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
    expect(token).toBe(search.get('token'));
  });

  it('should not sign in without auto signup', async () => {
    await authenticator.update({
      options: {
        public: {
          autoSignup: false,
        },
      },
    });
    agent = app.agent();
    vi.spyOn(OIDCAuth.prototype, 'createOIDCClient').mockResolvedValue({
      callback: (uri, { code }) => ({
        access_token: 'access_token',
      }),
      userinfo: () => ({
        sub: 'user1',
      }),
    } as any);

    const res = await agent
      .set('X-Authenticator', 'oidc-auth')
      .set('Cookie', ['nocobase_oidc=token'])
      .get('/auth:signIn?state=token%3Dtoken&name=oidc-auth');

    expect(res.statusCode).toBe(401);
  });

  it('should sign in with auto signup', async () => {
    await authenticator.update({
      options: {
        public: {
          autoSignup: true,
        },
      },
    });
    agent = app.agent();
    vi.spyOn(OIDCAuth.prototype, 'createOIDCClient').mockResolvedValue({
      callback: (uri, { code }) => ({
        access_token: 'access_token',
      }),
      userinfo: () => ({
        sub: 'user1',
      }),
    } as any);

    const res = await agent
      .set('X-Authenticator', 'oidc-auth')
      .set('Cookie', ['nocobase_oidc=token'])
      .get('/auth:signIn?state=token%3Dtoken&name=oidc-auth');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.nickname).toBe('user1');
  });

  it('should sign in with existed email', async () => {
    await authenticator.update({
      options: {
        oidc: {
          userBindField: 'email',
        },
        public: {
          autoSignup: false,
        },
      },
    });
    const user = await db.getRepository('users').create({
      values: {
        nickname: 'has-email',
        email: 'test@nocobase.com',
      },
    });
    agent = app.agent();
    vi.spyOn(OIDCAuth.prototype, 'createOIDCClient').mockResolvedValue({
      callback: (uri, { code }) => ({
        access_token: 'access_token',
      }),
      userinfo: () => ({
        sub: 'user1',
        email: 'test@nocobase.com',
      }),
    } as any);

    const res = await agent
      .set('X-Authenticator', 'oidc-auth')
      .set('Cookie', ['nocobase_oidc=token'])
      .get('/auth:signIn?state=token%3Dtoken&name=oidc-auth');

    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe(user.id);
  });

  it('should sign in with existed username', async () => {
    await authenticator.update({
      options: {
        oidc: {
          userBindField: 'username',
        },
        public: {
          autoSignup: false,
        },
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        nickname: 'has-username',
        username: 'username',
      },
    });
    agent = app.agent();
    vi.spyOn(OIDCAuth.prototype, 'createOIDCClient').mockResolvedValue({
      callback: (uri, { code }) => ({
        access_token: 'access_token',
      }),
      userinfo: () => ({
        username: 'username',
        sub: 'username',
      }),
    } as any);

    const res = await agent
      .set('X-Authenticator', 'oidc-auth')
      .set('Cookie', ['nocobase_oidc=token'])
      .get('/auth:signIn?state=token%3Dtoken&name=oidc-auth');

    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe(user.id);
  });

  it('oidc:redirect', async () => {
    vi.spyOn(OIDCAuth.prototype, 'signIn').mockResolvedValue({
      user: {} as any,
      token: 'test-token',
    });
    const res = await agent.get(`/oidc:redirect?state=${encodeURIComponent('name=oidc-auth&app=main')}`);
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/admin?authenticator=oidc-auth&token=test-token`);
  });

  it('oidc:redirect, sub app', async () => {
    vi.spyOn(OIDCAuth.prototype, 'signIn').mockResolvedValue({
      user: {} as any,
      token: 'test-token',
    });
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
    } as any);
    const res = await agent.get(`/oidc:redirect?state=${encodeURIComponent('name=oidc-auth&app=sub')}`);
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/apps/sub/admin?authenticator=oidc-auth&token=test-token`);
  });

  it('oidc:redirect, error', async () => {
    vi.spyOn(OIDCAuth.prototype, 'signIn').mockRejectedValue(new Error('test error'));
    const res = await agent.get(`/oidc:redirect?state=${encodeURIComponent('name=oidc-auth&app=main')}`);
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/signin?redirect=/admin&authenticator=oidc-auth&error=test%20error`);
  });
});

test('field mapping', () => {
  const auth = new OIDCAuth({
    authenticator: null,
    ctx: {
      db: {
        getCollection: () => ({}),
      } as any,
    } as any,
    options: {
      oidc: {
        fieldMap: [
          {
            source: 'username',
            target: 'nickname',
          },
        ],
      },
    },
  });
  const userInfo = auth.mapField({
    sub: 1,
    username: 'user1',
  });
  expect(userInfo).toEqual({
    sub: 1,
    username: 'user1',
    nickname: 'user1',
  });
});

test('getExchangeBody', () => {
  const auth = new OIDCAuth({
    ctx: {
      db: {
        getCollection: () => ({}),
      },
    },
    options: {
      oidc: {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        exchangeBodyKeys: [
          {
            paramName: 'client_id',
            optionsKey: 'clientId',
            enabled: true,
          },
          {
            paramName: 'client_secret',
            optionsKey: 'clientSecret',
            enabled: false,
          },
        ],
      },
    },
  } as any);
  const body = auth.getExchangeBody();
  expect(body).toMatchObject({
    client_id: 'test_client_id',
  });
});
