import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import { SAML } from '@node-saml/node-saml';
import { authType } from '../../constants';
import SAMLPlugin from '../index';

describe('saml', () => {
  let app: MockServer;
  let db: Database;
  let agent;

  beforeAll(async () => {
    app = mockServer({
      plugins: ['users', 'auth'],
    });
    app.plugin(SAMLPlugin);
    await app.loadAndInstall({ clean: true });
    db = app.db;
    agent = app.agent();

    const authenticatorRepo = db.getRepository('authenticators');
    await authenticatorRepo.create({
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should get auth url', async () => {
    const res = await agent.set('X-Authenticator', 'saml-auth').resource('saml').getAuthUrl();
    expect(res.body.data).toBeDefined();
  });

  it('should sign in', async () => {
    jest.spyOn(SAML.prototype, 'validatePostResponseAsync').mockResolvedValue({
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
    expect(res.body.data.user.nickname).toBe('Test Nocobase');
  });

  it('should sign in via email', async () => {
    jest.spyOn(SAML.prototype, 'validatePostResponseAsync').mockResolvedValue({
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
    expect(res.body.data.user.email).toBe('old@nocobase.com');
    expect(res.body.data.user.nickname).toBe('old@nocobase.com');
  });
});
