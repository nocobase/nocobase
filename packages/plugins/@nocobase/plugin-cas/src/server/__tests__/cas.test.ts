import { Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';
import { authType } from '../../constants';
import axios from 'axios';
import { CASAuth } from '../auth';
import { AppSupervisor } from '@nocobase/server';

describe('cas', () => {
  let app: MockServer;
  let db: Database;
  let agent;
  let authenticator;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['users', 'auth', 'cas'],
    });
    db = app.db;
    agent = app.agent();

    const authenticatorRepo = db.getRepository('authenticators');
    authenticator = await authenticatorRepo.create({
      values: {
        name: 'cas-auth',
        authType: authType,
        enabled: 1,
        options: {
          casUrl: 'http://localhost:3000/cas',
          serviceDomain: 'http://localhost:13000',
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

  it('should not sign in without auto signup', async () => {
    await authenticator.update({
      options: {
        ...authenticator.options,
        autoSignup: false,
      },
    });
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: `
<cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
    <cas:authenticationSuccess>
        <cas:user>test-user</cas:user>
            <cas:proxyGrantingTicket>PGTIOU-84678-8a9d...
        </cas:proxyGrantingTicket>
    </cas:authenticationSuccess>
</cas:serviceResponse>
`,
    });

    const res = await agent.set('X-Authenticator', 'cas-auth').get('/auth:signIn?ticket=test-ticket');

    expect(res.statusCode).toBe(401);
    expect(res.text).toBe('User not found');
  });

  it('should sign in with auto signup', async () => {
    await authenticator.update({
      options: {
        ...authenticator.options,
        autoSignup: true,
      },
    });
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: `
<cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
    <cas:authenticationSuccess>
        <cas:user>test-user</cas:user>
            <cas:proxyGrantingTicket>PGTIOU-84678-8a9d...
        </cas:proxyGrantingTicket>
    </cas:authenticationSuccess>
</cas:serviceResponse>
`,
    });

    const res = await agent.set('X-Authenticator', 'cas-auth').get('/auth:signIn?ticket=test-ticket');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.nickname).toBe('test-user');
  });

  it('missing ticket', async () => {
    const res = await agent.set('X-Authenticator', 'cas-auth').get('/auth:signIn');
    expect(res.statusCode).toBe(401);
    expect(res.text).toBe('Missing ticket');
  });

  it('invalid ticket', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: `
<cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
    <cas:authenticationFailure code="INVALID_TICKET">
        Ticket ST-1856339-aA5Yuvrxzpv8Tau1cYQ7 not recognized
    </cas:authenticationFailure>
</cas:serviceResponse>
`,
    });

    const res = await agent.set('X-Authenticator', 'cas-auth').get('/auth:signIn?ticket=test-ticket');
    expect(res.statusCode).toBe(401);
    expect(res.text).toBe('Invalid ticket');
  });

  it('cas:login', async () => {
    const res = await agent.get('/cas:login?authenticator=cas-auth');
    expect(res.statusCode).toBe(302);
    const service = encodeURIComponent(
      `http://localhost:13000${process.env.API_BASE_URL || '/api/'}cas:service?authenticator=cas-auth&__appName=${
        app.name
      }&redirect=/admin`,
    );
    expect(res.headers.location).toBe(`http://localhost:3000/cas/login?service=${service}`);
  });

  it('cas:service', async () => {
    vi.spyOn(CASAuth.prototype, 'signIn').mockResolvedValue({
      user: {} as any,
      token: 'test-token',
    });
    const res = await agent.get('/cas:service?authenticator=cas-auth&__appName=main');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/admin?authenticator=cas-auth&token=test-token`);
  });

  it('cas:service, sub app', async () => {
    vi.spyOn(CASAuth.prototype, 'signIn').mockResolvedValue({
      user: {} as any,
      token: 'test-token',
    });
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
    } as any);
    const res = await agent.get('/cas:service?authenticator=cas-auth&__appName=sub');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/apps/sub/admin?authenticator=cas-auth&token=test-token`);
  });

  it('cas:service, error', async () => {
    vi.spyOn(CASAuth.prototype, 'signIn').mockRejectedValue(new Error('test error'));
    const res = await agent.get('/cas:service?authenticator=cas-auth&__appName=main');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe(`/signin?authenticator=cas-auth&error=test%20error&redirect=/admin`);
  });
});
