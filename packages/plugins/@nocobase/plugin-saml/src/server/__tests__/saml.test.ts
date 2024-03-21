import { Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import { SAML } from '@node-saml/node-saml';
import { vi } from 'vitest';
import { authType } from '../../constants';

describe('saml', () => {
  let app: MockServer;
  let db: Database;
  let agent;
  let authenticator;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth', 'saml'],
    });
    db = app.db;
    agent = app.agent();

    const authenticatorRepo = db.getRepository('authenticators');
    authenticator = await authenticatorRepo.create({
      values: {
        name: 'saml-auth',
        authType: authType,
        enabled: 1,
        options: {
          saml: {
            ssoUrl: 'http://localhost:3000/saml/sso',
            certificate: `certificate`,
            idpIssuer: 'idpIssuer',
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
    const res = await agent.set('X-Authenticator', 'saml-auth').resource('saml').getAuthUrl();
    expect(res.body.data).toBeDefined();
  });

  it('should not sign in without auto signup', async () => {
    await authenticator.update({
      options: {
        ...authenticator.options,
        public: {
          autoSignup: false,
        },
      },
    });
    vi.spyOn(SAML.prototype, 'validatePostResponseAsync').mockResolvedValue({
      profile: {
        nameID: 'test@nocobase.com',
        email: 'test@nocobase.com',
        firstName: 'Test',
        lastName: 'Nocobase',
        issuer: 'issuer',
        nameIDFormat: 'Email',
      },
      loggedOut: false,
    });

    const res = await agent.set('X-Authenticator', 'saml-auth').resource('auth').signIn().send({
      samlResponse: {},
    });

    expect(res.statusCode).toBe(401);
  });

  it('should sign in with auto signup', async () => {
    await authenticator.update({
      options: {
        ...authenticator.options,
        public: {
          autoSignup: true,
        },
      },
    });
    vi.spyOn(SAML.prototype, 'validatePostResponseAsync').mockResolvedValue({
      profile: {
        nameID: 'test@nocobase.com',
        email: 'test@nocobase.com',
        firstName: 'Test',
        lastName: 'Nocobase',
        issuer: 'issuer',
        nameIDFormat: 'Email',
      },
      loggedOut: false,
    });

    const res = await agent.set('X-Authenticator', 'saml-auth').resource('auth').signIn().send({
      samlResponse: {},
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.nickname).toBe('Test Nocobase');
  });

  it('should sign in via email', async () => {
    await authenticator.update({
      options: {
        saml: {
          ...authenticator.options.saml,
          userBindField: 'email',
        },
        public: {
          autoSignup: false,
        },
      },
    });

    vi.spyOn(SAML.prototype, 'validatePostResponseAsync').mockResolvedValue({
      profile: {
        nameID: 'old@nocobase.com',
        email: 'old@nocobase.com',
        firstName: 'Old',
        lastName: 'Nocobase',
        issuer: 'issuer',
        nameIDFormat: 'Email',
      },
      loggedOut: false,
    });

    const email = 'old@nocobase.com';
    const userRepo = db.getRepository('users');
    const user = await userRepo.create({
      values: {
        nickname: email,
        email,
      },
    });

    const res = await agent
      .set('X-Authenticator', 'saml-auth')
      .resource('auth')
      .signIn()
      .send({
        samlResponse: {
          SAMLResponse: '',
        },
      });

    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe(user.id);
  });

  it('should sign in via usernmae', async () => {
    await authenticator.update({
      options: {
        saml: {
          ...authenticator.options.saml,
          userBindField: 'username',
        },
        public: {
          autoSignup: false,
        },
      },
    });

    vi.spyOn(SAML.prototype, 'validatePostResponseAsync').mockResolvedValue({
      profile: {
        nameID: 'username',
        email: 'old@nocobase.com',
        firstName: 'Old',
        lastName: 'Nocobase',
        issuer: 'issuer',
        nameIDFormat: '',
      },
      loggedOut: false,
    });

    const email = 'old@nocobase.com';
    const userRepo = db.getRepository('users');
    const user = await userRepo.create({
      values: {
        username: 'username',
        nickname: email,
        email,
      },
    });

    const res = await agent
      .set('X-Authenticator', 'saml-auth')
      .resource('auth')
      .signIn()
      .send({
        samlResponse: {
          SAMLResponse: '',
        },
      });

    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe(user.id);
  });
});
