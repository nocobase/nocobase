import { createAuthMiddleware } from 'better-auth/api';
// @vitest-environment node
import { createServer, type Socket } from 'node:net';
import { afterEach, expect, it, vi } from 'vitest';
import { Application } from '@nocobase/app-server/application';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import {
  SendingProvider,
  sendingServiceToken,
} from '@nocobase/app-server/sending';
import { Logging } from '@nocobase/logging';
import { loggingToken } from '@nocobase/app-server/logging';
import { createCaching } from '@nocobase/caching';
import { cachingToken } from '@nocobase/app-server/caching';
import { databaseManagerToken } from '@nocobase/db';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { AuthenticationProvider } from '../../providers/authentication.js';
import { apiRoutes } from '../../routes/index.js';
import { authenticationToken } from '../../tokens.js';
import { createAuthTestDatabase, testSecret } from './support.js';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
});

async function smtp(): Promise<{
  readonly port: number;
  readonly messages: string[];
}> {
  const messages: string[] = [];
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.write('220 localhost ESMTP\r\n');
    let buffer = '';
    let data = false;
    let message = '';
    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      let index: number;
      while ((index = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (data) {
          if (line === '.') {
            messages.push(message);
            message = '';
            data = false;
            socket.write('250 Accepted\r\n');
          } else message += line + '\n';
        } else if (/^EHLO|^HELO/.test(line)) socket.write('250 localhost\r\n');
        else if (line === 'DATA') {
          data = true;
          socket.write('354 Send message\r\n');
        } else if (line === 'QUIT') {
          socket.end('221 Bye\r\n');
        } else socket.write('250 OK\r\n');
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('SMTP listener unavailable');
  cleanup.push(
    () =>
      new Promise<void>((resolve, reject) => {
        for (const socket of sockets) socket.destroy();
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );
  return { port: address.port, messages };
}

async function setup(
  port?: number,
  customSender?: NonNullable<
    NonNullable<
      import('better-auth').BetterAuthOptions['emailAndPassword']
    >['sendResetPassword']
  >,
  authOverrides: Partial<import('../../config.js').AuthConfig> = {},
) {
  const database = await createAuthTestDatabase();
  cleanup.push(() => database.destroy());
  const caching = createCaching();
  cleanup.push(() => caching.dispose());
  const logging = new Logging({ console: { enabled: false } });
  cleanup.push(() => logging.close());
  const config = new AppConfig();
  config.load({
    name: 'test',
    read: async () => ({
      kind: 'map',
      value: {
        app: {
          name: 'reset-test',
          publicOrigin: 'http://localhost',
          publicBasePath: '/main',
          internalBasePath: '',
        },
        auth: {
          secret: testSecret,
          emailAndPassword: {
            enabled: true,
            autoSignIn: true,
            ...(customSender ? { sendResetPassword: customSender } : {}),
          },
          session: { storeSessionInDatabase: true },
          advanced: { disableOriginCheck: false },
          rateLimit: { enabled: false },
          ...authOverrides,
        },
        notification: {
          channels: port
            ? {
                'system-email': {
                  provider: 'smtp',
                  host: '127.0.0.1',
                  port,
                  from: 'system@example.test',
                },
              }
            : {},
        },
        api: { bodyLimit: 1048576 },
      },
    }),
  });
  await config.loadAll();
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: process.cwd() }),
  });
  app.container.instance(databaseManagerToken, database.database);
  app.container.instance(cachingToken, caching);
  app.container.instance(loggingToken, logging);
  app.container.instance(idGeneratorToken, {
    generate: () => 1,
    generateString: () => crypto.randomUUID(),
  });
  app.addServiceProvider(SendingProvider);
  app.addServiceProvider(AuthenticationProvider);
  app.addRoutes(apiRoutes);
  await app.start();
  cleanup.push(() => app.shutdown());
  const request = (
    path: string,
    body: object,
    cookie?: string,
  ): Promise<Response> =>
    Promise.resolve(
      app.fetch(
        new Request(`http://localhost/api/auth/${path}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost',
            ...(cookie ? { cookie } : {}),
          },
          body: JSON.stringify(body),
        }),
      ),
    );
  return { app, request, config, connection: database.database.connection() };
}

it('resets through real SMTP without notification or authorization, revokes sessions and consumes the token once', async () => {
  const receiver = await smtp();
  const { app, request } = await setup(receiver.port);
  expect(
    app.container
      .resolve(sendingServiceToken)
      .available('system-email', 'email'),
  ).toBe(true);
  expect(app.config.publicValues?.()).toMatchObject({
    auth: { passwordReset: { available: true } },
  });
  const registered = await request('sign-up/email', {
    email: 'alice@example.test',
    name: 'Alice',
    username: 'alice',
    password: 'original-password',
  });
  expect(registered.status).toBe(200);
  const cookie = registered.headers.get('set-cookie')!;
  const started = Date.now();
  const requested = await request('request-password-reset', {
    email: 'alice@example.test',
    redirectTo: 'http://localhost/main/reset-password',
  });
  expect(requested.status).toBe(200);
  expect(Date.now() - started).toBeLessThan(2000);
  await vi.waitFor(() => expect(receiver.messages).toHaveLength(1));
  const token = /reset-password\/([\w-]+)\?/.exec(
    receiver.messages[0].replace(/=\n/g, ''),
  )?.[1];
  expect(token).toBeTruthy();
  const reset = await request('reset-password', {
    token,
    newPassword: 'changed-password',
  });
  expect(reset.status).toBe(200);
  expect(
    (
      await request('reset-password', {
        token,
        newPassword: 'another-password',
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await request('sign-in/email', {
        email: 'alice@example.test',
        password: 'original-password',
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await request('sign-in/email', {
        email: 'alice@example.test',
        password: 'changed-password',
      })
    ).status,
  ).toBe(200);
  expect(
    await app.container
      .resolve(authenticationToken)
      .getSession(new Headers({ cookie })),
  ).toBeNull();
});

it('keeps reset closed without an email channel', async () => {
  const { app } = await setup();
  expect(app.config.publicValues?.()).toMatchObject({
    auth: { passwordReset: { available: false } },
  });
  expect(
    app.container.resolve(authenticationToken).passwordResetAvailable(),
  ).toBe(false);
});

it('keeps anonymous outcomes identical and checks disabled accounts before custom callbacks and token use', async () => {
  const sender = vi.fn();
  const { request, connection, app } = await setup(undefined, sender);
  await request('sign-up/email', {
    email: 'disabled@example.test',
    name: 'Disabled',
    username: 'disabled',
    password: 'original-password',
  });
  const user = await connection.query
    .selectFrom('user')
    .select('id')
    .where('email', '=', 'disabled@example.test')
    .executeTakeFirstOrThrow();
  await connection.query
    .updateTable('user')
    .set({ disabledAt: new Date() })
    .where('id', '=', user.id)
    .execute();
  const existing = await request('request-password-reset', {
    email: 'disabled@example.test',
  });
  const missing = await request('request-password-reset', {
    email: 'missing@example.test',
  });
  expect(existing.status).toBe(missing.status);
  expect(await existing.json()).toEqual(await missing.json());
  await app.shutdown();
  expect(sender).not.toHaveBeenCalled();
  const context = await app.container
    .resolve(authenticationToken)
    .administrationContext();
  await context.internalAdapter.createVerificationValue({
    identifier: 'reset-password:test-token',
    value: user.id,
    expiresAt: new Date(Date.now() + 60000),
  });
  expect(
    (
      await request('reset-password', {
        token: 'test-token',
        newPassword: 'changed-password',
      })
    ).status,
  ).toBe(400);
});

it.each(['service', 'disabled', 'deleted', 'removed'] as const)(
  'does not send to a %s account and rejects its reset token',
  async (state) => {
    const sender = vi.fn();
    const { request, connection, app } = await setup(undefined, sender);
    await request('sign-up/email', {
      email: 'protected@example.test',
      name: 'Protected',
      username: 'protected',
      password: 'original-password',
    });
    const row = await connection.query
      .selectFrom('user')
      .select('id')
      .where('email', '=', 'protected@example.test')
      .executeTakeFirstOrThrow();
    const context = await app.container
      .resolve(authenticationToken)
      .administrationContext();
    await context.internalAdapter.createVerificationValue({
      identifier: 'reset-password:protected-token',
      value: row.id,
      expiresAt: new Date(Date.now() + 60000),
    });
    if (state === 'removed')
      await connection.query
        .deleteFrom('user')
        .where('id', '=', row.id)
        .execute();
    else
      await connection.query
        .updateTable('user')
        .set(
          state === 'service'
            ? { kind: 'service' }
            : state === 'disabled'
              ? { disabledAt: new Date() }
              : { deletedAt: new Date() },
        )
        .where('id', '=', row.id)
        .execute();
    const existing = await request('request-password-reset', {
      email: 'protected@example.test',
    });
    const missing = await request('request-password-reset', {
      email: 'missing@example.test',
    });
    expect(existing.status).toBe(200);
    expect(await existing.json()).toEqual(await missing.json());
    expect(
      (
        await request('reset-password', {
          token: 'protected-token',
          newPassword: 'changed-password',
        })
      ).status,
    ).toBe(400);
    await app.shutdown();
    expect(sender).not.toHaveBeenCalled();
  },
);

it('returns while a custom sender is still pending and does not leak its failure', async () => {
  let release: (() => void) | undefined;
  const sender = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  const { request, app } = await setup(undefined, sender);
  await request('sign-up/email', {
    email: 'slow@example.test',
    name: 'Slow',
    username: 'slow',
    password: 'original-password',
  });
  const response = await request('request-password-reset', {
    email: 'slow@example.test',
  });
  expect(response.status).toBe(200);
  await vi.waitFor(() => expect(sender).toHaveBeenCalledTimes(1));
  release?.();
  await app.shutdown();
});

it('applies account-independent email throttling and rejects expired tokens', async () => {
  const sender = vi.fn();
  const { request, app, connection } = await setup(undefined, sender);
  await request('sign-up/email', {
    email: 'throttle@example.test',
    name: 'Throttle',
    username: 'throttle',
    password: 'original-password',
  });
  const first = await request('request-password-reset', {
    email: 'throttle@example.test',
  });
  const second = await request('request-password-reset', {
    email: 'throttle@example.test',
  });
  const absent = await request('request-password-reset', {
    email: 'absent@example.test',
  });
  const absentSecond = await request('request-password-reset', {
    email: 'absent@example.test',
  });
  expect(await first.json()).toEqual(await second.json());
  expect(await absent.json()).toEqual(await absentSecond.json());
  await vi.waitFor(() => expect(sender).toHaveBeenCalledTimes(1));
  const row = await connection.query
    .selectFrom('user')
    .select('id')
    .where('email', '=', 'throttle@example.test')
    .executeTakeFirstOrThrow();
  const context = await app.container
    .resolve(authenticationToken)
    .administrationContext();
  await context.internalAdapter.createVerificationValue({
    identifier: 'reset-password:expired-token',
    value: row.id,
    expiresAt: new Date(Date.now() - 60000),
  });
  expect(
    (
      await request('reset-password', {
        token: 'expired-token',
        newPassword: 'changed-password',
      })
    ).status,
  ).toBe(400);
});

it('preserves callback origin checks even for a throttled address', async () => {
  const { request } = await setup(undefined, vi.fn());
  await request('request-password-reset', { email: 'absent@example.test' });
  const rejected = await request('request-password-reset', {
    email: 'absent@example.test',
    redirectTo: 'https://untrusted.example/reset',
  });
  expect(rejected.status).toBe(403);
});

it.each(['disabledAt', 'deletedAt'] as const)(
  'protects a passwordless %s account for body and query token forms',
  async (field) => {
    const { app, request, connection } = await setup(undefined, vi.fn());
    await request('sign-up/email', {
      email: 'oauth@example.test',
      username: 'oauth',
      name: 'OAuth',
      password: 'original-password',
    });
    const user = await connection.query
      .selectFrom('user')
      .select('id')
      .where('email', '=', 'oauth@example.test')
      .executeTakeFirstOrThrow();
    await connection.query
      .deleteFrom('account')
      .where('userId', '=', user.id)
      .where('providerId', '=', 'credential')
      .execute();
    await connection.query
      .updateTable('user')
      .set({ [field]: new Date() })
      .where('id', '=', user.id)
      .execute();
    const context = await app.container
      .resolve(authenticationToken)
      .administrationContext();
    for (const form of ['body', 'query', 'empty-body'] as const) {
      const token = crypto.randomUUID();
      await context.internalAdapter.createVerificationValue({
        identifier: `reset-password:${token}`,
        value: user.id,
        expiresAt: new Date(Date.now() + 60000),
      });
      const response = await request(
        form === 'body' ? 'reset-password' : `reset-password?token=${token}`,
        {
          ...(form === 'body'
            ? { token }
            : form === 'empty-body'
              ? { token: '' }
              : {}),
          newPassword: 'replacement-password',
        },
      );
      expect(response.status).toBe(400);
      expect(
        await connection.query
          .selectFrom('account')
          .select('id')
          .where('userId', '=', user.id)
          .where('providerId', '=', 'credential')
          .execute(),
      ).toEqual([]);
    }
  },
);

it('does not install reset delivery when password login starts disabled', async () => {
  const receiver = await smtp();
  const { app, request } = await setup(receiver.port, undefined, {
    emailAndPassword: { enabled: false },
  });
  const context = await app.container
    .resolve(authenticationToken)
    .administrationContext();
  await context.internalAdapter.createUser({
    email: 'closed@example.test',
    name: 'Closed',
    emailVerified: false,
  });
  expect(
    app.container.resolve(authenticationToken).passwordResetAvailable(),
  ).toBe(false);
  expect(
    (await request('request-password-reset', { email: 'closed@example.test' }))
      .status,
  ).toBe(400);
  await app.shutdown();
  expect(receiver.messages).toEqual([]);
});

it('suppresses delivery after password login is disabled in current configuration', async () => {
  const receiver = await smtp();
  const overrides: Partial<import('../../config.js').AuthConfig> = {};
  const { app, request, config } = await setup(
    receiver.port,
    undefined,
    overrides,
  );
  await request('sign-up/email', {
    email: 'closed@example.test',
    username: 'closed',
    name: 'Closed',
    password: 'original-password',
  });
  overrides.emailAndPassword = { enabled: false };
  await config.loadAll();
  expect(
    app.container.resolve(authenticationToken).passwordResetAvailable(),
  ).toBe(false);
  expect(app.config.publicValues?.()).toMatchObject({
    auth: { passwordReset: { available: false } },
  });
  expect(
    (await request('request-password-reset', { email: 'closed@example.test' }))
      .status,
  ).toBe(200);
  await app.shutdown();
  expect(receiver.messages).toEqual([]);
});

it('composes reset protection with application before/after hooks', async () => {
  const before = vi.fn();
  const after = vi.fn();
  const sender = vi.fn();
  const { app, request } = await setup(undefined, sender, {
    hooks: {
      before: createAuthMiddleware((context) => {
        before(context.path);
      }),
      after: createAuthMiddleware((context) => {
        after(context.path);
        context.setHeader('x-application-after', 'preserved');
      }),
    },
  });
  await request('sign-up/email', {
    email: 'hooks@example.test',
    username: 'hooks',
    name: 'Hooks',
    password: 'original-password',
  });
  const response = await request('request-password-reset', {
    email: 'hooks@example.test',
  });
  expect(response.status).toBe(200);
  expect(response.headers.get('x-application-after')).toBe('preserved');
  expect(before).toHaveBeenCalledWith('/request-password-reset');
  expect(after).toHaveBeenCalledWith('/request-password-reset');
  await app.shutdown();
  expect(sender).toHaveBeenCalledTimes(1);
});
