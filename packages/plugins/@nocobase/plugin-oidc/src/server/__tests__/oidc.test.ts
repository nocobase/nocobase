import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import OIDCPlugin from '../index';
import { authType } from '../../constants';
import { OIDCAuth } from '../oidc-auth';

describe('oidc', () => {
  let app: MockServer;
  let db: Database;
  let agent;

  beforeAll(async () => {
    app = mockServer({
      plugins: ['users', 'auth'],
    });
    app.plugin(OIDCPlugin);
    await app.loadAndInstall({ clean: true });
    db = app.db;
    agent = app.agent();

    const authenticatorRepo = db.getRepository('authenticators');
    await authenticatorRepo.create({
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should get auth url', async () => {
    agent = app.agent();
    jest.spyOn(OIDCAuth.prototype, 'createOIDCClient').mockResolvedValue({
      authorizationUrl: ({ state }) => state,
    } as any);
    const res = await agent.set('X-Authenticator', 'oidc-auth').resource('oidc').getAuthUrl();
    expect(res.body.data).toBeDefined();
    const search = new URLSearchParams(res.body.data);
    expect(search.get('token')).toBeDefined();
    expect(search.get('name')).toBe('oidc-auth');
    expect(res.headers['set-cookie']).toBeDefined();
    const token = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
    expect(token).toBe(search.get('token'));
  });

  it('should sign in', async () => {
    agent = app.agent();
    jest.spyOn(OIDCAuth.prototype, 'createOIDCClient').mockResolvedValue({
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
      .resource('auth')
      .signIn()
      .send({
        code: '',
        state: 'token=token&name=oidc-auth',
      });

    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.nickname).toBe('user1');
  });
});

it('field mapping', () => {
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
