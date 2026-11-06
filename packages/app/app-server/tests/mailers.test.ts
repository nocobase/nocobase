import { afterEach, expect, it, vi } from 'vitest';
import * as transports from '@nocobase/mailer';
import {
  MailSenderFactory,
  mailSenderFactoryToken,
  defineMailersConfig,
  mailerEnvironment,
  resolveMailSenderFactory,
} from '../src/mailers/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import { Application } from '../src/application/index.js';
import { ServiceContainer, ServiceProvider } from '@nocobase/service-provider';

afterEach(() => vi.restoreAllMocks());
const smtp = { provider: 'smtp', host: 'localhost', port: 25 } as const;
const message = {
  to: 'synthetic@example.test',
  subject: 'Test',
  text: 'Synthetic',
};

function fakeTransports() {
  const transportsCreated: {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    finish: (result: transports.MailResult) => void;
  }[] = [];
  const create = vi
    .spyOn(transports, 'createMailTransport')
    .mockImplementation(() => {
      const pending = Promise.withResolvers<transports.MailResult>();
      const entry = {
        send: vi.fn(() => pending.promise),
        close: vi.fn(async () => {}),
        finish: pending.resolve,
      };
      transportsCreated.push(entry);
      return { send: entry.send, close: entry.close };
    });
  return { create, created: transportsCreated };
}

it('does not choose the first entry, validates references and keeps diagnostics private', () => {
  const factory = new MailSenderFactory({ system: smtp });
  expect(factory.defaultMailer).toBeUndefined();
  expect(() => factory.create()).toThrow(/mailers\.default/u);
  expect(() => factory.create('absent', 'users.invitations.mailer')).toThrow(
    /users\.invitations\.mailer/u,
  );
  for (const config of [
    { default: 'absent', first: smtp },
    { default: 'first', first: { ...smtp, enabled: false } },
    { first: { ...smtp, apiKey: 'synthetic-secret' } },
    { first: { provider: 'synthetic-secret' } },
    { first: { ...smtp, secure: 'synthetic-secret' } },
  ]) {
    expect(() => new MailSenderFactory(config as never)).toThrow(/mailers/u);
    try {
      new MailSenderFactory(config as never);
    } catch (error) {
      expect(String(error)).not.toContain('synthetic-secret');
    }
  }
  expect(() =>
    new MailSenderFactory({ first: smtp }).createFromConfig({
      provider: 'smtp',
      host: '',
      port: 25,
    }),
  ).toThrow();
  expect(() =>
    defineMailersConfig({ defaults: {}, public: ['first.auth.pass'] }),
  ).toThrow(/private/u);
});

it('declares discoverable typed environment values and never publishes credentials', async () => {
  const config = new AppConfig();
  await config.loadAll();
  const factory = defineMailersConfig({
    defaults: {},
    env: {
      ...mailerEnvironment('system', 'MAILERS_SYSTEM'),
      ...mailerEnvironment('transactional', 'CUSTOM_TRANSACTIONAL'),
    },
  });
  config.mergeDefaults({ mailers: factory({} as never) });
  config.defineSections(new Map([['mailers', factory.rules!]]));
  await config.loadSectionEnvironment({
    MAILERS_DEFAULT: 'system',
    MAILERS_SYSTEM_PROVIDER: 'smtp',
    MAILERS_SYSTEM_HOST: 'localhost',
    MAILERS_SYSTEM_PORT: '2525',
    MAILERS_SYSTEM_SECURE: 'false',
    MAILERS_SYSTEM_USER: 'synthetic',
    MAILERS_SYSTEM_PASSWORD: 'synthetic-secret',
    CUSTOM_TRANSACTIONAL_PROVIDER: 'resend',
    CUSTOM_TRANSACTIONAL_API_KEY: 'synthetic-api-key',
    CUSTOM_TRANSACTIONAL_FROM: 'mailer@example.test',
  });
  expect(await config.validate()).toEqual([]);
  expect(config.get('mailers.default')).toBe('system');
  expect(config.get('mailers.system')).toMatchObject({
    port: 2525,
    secure: false,
    auth: { pass: 'synthetic-secret' },
  });
  expect(config.get('mailers.transactional')).toMatchObject({
    provider: 'resend',
    apiKey: 'synthetic-api-key',
  });
  expect(config.publicValues()).toEqual({});
  expect(factory.rules?.env?.MAILERS_SYSTEM_PASSWORD.secret).toBe(true);
  expect(factory.rules?.env?.MAILERS_SYSTEM_API_KEY.secret).toBe(true);
  expect(factory.rules?.env?.CUSTOM_TRANSACTIONAL_API_KEY.secret).toBe(true);
});

it('creates exclusive senders: concurrent first sends share one transport, closing one leaves others working', async () => {
  const { create, created } = fakeTransports();
  const configured = {
    default: 'main',
    main: { ...smtp, auth: { user: 'synthetic', pass: 'original' } },
  };
  const factory = new MailSenderFactory(configured);
  configured.main.auth.pass = 'changed';
  const auth = factory.create();
  const users = factory.create('main');
  const inline = factory.createFromConfig(smtp);
  const otherApplication = new MailSenderFactory({
    default: 'main',
    main: smtp,
  }).create();
  // Lazy: creating a sender allocates nothing.
  expect(create).not.toHaveBeenCalled();
  const first = [auth.send(message), auth.send(message)];
  expect(create).toHaveBeenCalledOnce();
  expect(create.mock.calls[0][0]).toMatchObject({ auth: { pass: 'original' } });
  const others = [
    users.send(message),
    inline.send(message),
    otherApplication.send(message),
  ];
  expect(create).toHaveBeenCalledTimes(4);
  expect(auth).not.toBe(users);

  let closed = false;
  const closing = auth.close().then(() => {
    closed = true;
  });
  // Closing waits for the original submissions, after cancelling through the transport.
  await Promise.resolve();
  expect(created[0].close).toHaveBeenCalledOnce();
  expect(closed).toBe(false);
  expect(await auth.send(message)).toMatchObject({
    status: 'failed',
    disposition: 'never',
  });
  created[0].finish({
    status: 'submission_unknown',
    error: { category: 'network', message: 'Synthetic failure.' },
  });
  expect((await Promise.all(first)).map((result) => result.status)).toEqual([
    'submission_unknown',
    'submission_unknown',
  ]);
  await closing;
  await auth.close();
  expect(created[0].close).toHaveBeenCalledOnce();

  // Other consumers keep their transports and can still send.
  for (const entry of created.slice(1)) {
    expect(entry.close).not.toHaveBeenCalled();
    entry.finish({ status: 'accepted' });
  }
  expect((await Promise.all(others)).map((result) => result.status)).toEqual([
    'accepted',
    'accepted',
    'accepted',
  ]);
  void users.send(message);
  expect(created[1].send).toHaveBeenCalledTimes(2);
  await Promise.all([users.close(), inline.close(), otherApplication.close()]);
  // A sender that never sent closes without allocating a transport.
  await factory.create().close();
  expect(create).toHaveBeenCalledTimes(4);
});

it('snapshots nested legacy SMTP credentials before the first send', async () => {
  const { create, created } = fakeTransports();
  const inline = {
    ...smtp,
    auth: { user: 'synthetic', pass: 'original' },
  };
  const sender = new MailSenderFactory().createFromConfig(inline);
  inline.auth.pass = 'changed';

  const pending = sender.send(message);
  created[0].finish({ status: 'accepted' });
  try {
    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0]).toMatchObject({
      auth: { user: 'synthetic', pass: 'original' },
    });
    await expect(pending).resolves.toMatchObject({ status: 'accepted' });
  } finally {
    await sender.close();
  }
});

it('can close a sender after its first transport initialization fails', async () => {
  const failure = new Error('Synthetic transport failure containing a secret.');
  const create = vi
    .spyOn(transports, 'createMailTransport')
    .mockImplementationOnce(() => {
      throw failure;
    });
  const sender = new MailSenderFactory().createFromConfig(smtp);

  const result = await sender.send(message);
  expect(result).toEqual({
    status: 'failed',
    disposition: 'never',
    error: {
      category: 'configuration',
      message: 'Mail transport could not be initialized.',
    },
  });
  expect(JSON.stringify(result)).not.toContain('secret');
  await expect(sender.close()).resolves.toBeUndefined();
  await expect(sender.send(message)).resolves.toMatchObject({
    status: 'failed',
    disposition: 'never',
  });
  expect(create).toHaveBeenCalledOnce();
});

it('observes a synchronous transport close failure and still waits for active sends', async () => {
  const failure = new Error('Synthetic close failure.');
  const pending = Promise.withResolvers<transports.MailResult>();
  const create = vi.spyOn(transports, 'createMailTransport').mockReturnValue({
    send: vi.fn(() => pending.promise),
    close: () => {
      throw failure;
    },
  });
  const sender = new MailSenderFactory().createFromConfig(smtp);
  const sending = sender.send(message);
  let settled = false;
  const closing = sender.close();
  const sameClosing = sender.close();
  expect(sameClosing).toBe(closing);
  await expect(sender.send(message)).resolves.toMatchObject({
    status: 'failed',
    disposition: 'never',
  });
  const observed = closing.then(
    () => {
      settled = true;
      return undefined;
    },
    (error: unknown) => {
      settled = true;
      return error;
    },
  );
  await Promise.resolve();
  expect(create).toHaveBeenCalledOnce();
  expect(settled).toBe(false);
  pending.resolve({ status: 'accepted' });
  await expect(sending).resolves.toMatchObject({ status: 'accepted' });
  const error = await observed;
  expect(error).toBeInstanceOf(AggregateError);
  expect((error as AggregateError).errors).toContain(failure);
  expect(settled).toBe(true);
});

it('passes cancellation and idempotency keys through unchanged', async () => {
  const { created } = fakeTransports();
  const sender = new MailSenderFactory({
    default: 'main',
    main: smtp,
  }).create();
  const controller = new AbortController();
  const pending = sender.send(message, {
    signal: controller.signal,
    idempotencyKey: 'synthetic-key',
  });
  expect(created[0].send).toHaveBeenCalledWith(message, {
    signal: controller.signal,
    idempotencyKey: 'synthetic-key',
  });
  created[0].finish({ status: 'accepted' });
  await pending;
  await sender.close();
});

it('registers one factory from the startup snapshot; consumers own and close their senders', async () => {
  const events: string[] = [];
  vi.spyOn(transports, 'createMailTransport').mockImplementation(() => ({
    send: async () => ({ status: 'accepted' }),
    close: async () => {
      events.push('transport');
    },
  }));
  let source = { mailers: { default: 'main', main: smtp, other: smtp } };
  const config = new AppConfig().load({
    name: 'synthetic-reload',
    read: async () => ({ kind: 'map', value: source }),
  });
  await config.loadAll();
  config.mergeDefaults({
    app: {
      name: 'synthetic',
      publicBasePath: '/main',
      internalBasePath: '',
      publicApiUrl: '/main/api',
    },
    mailers: { default: 'main', main: smtp },
  });
  class Producer extends ServiceProvider<Application> {
    readonly name = 'synthetic-producer';
    private sender?: transports.MailTransport;
    override register(): void {
      this.sender = this.app.container.resolve(mailSenderFactoryToken).create();
    }
    override async start(): Promise<void> {
      await this.sender!.send(message);
    }
    override async shutdown(): Promise<void> {
      events.push('producer');
      expect(await this.sender!.send(message)).toEqual({ status: 'accepted' });
      await this.sender!.close();
    }
  }
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: import.meta.dirname }),
  });
  app.addServiceProvider(Producer);
  await app.start();
  const factory = app.container.resolve(mailSenderFactoryToken);
  source = { mailers: { ...source.mailers, default: 'other' } };
  await config.reload();
  expect(config.get('mailers.default')).toBe('other');
  expect(factory.defaultMailer).toBe('main');
  expect(app.container.resolve(mailSenderFactoryToken)).toBe(factory);
  await app.shutdown();
  expect(events).toEqual(['producer', 'transport']);
});

it('falls back to a factory built from configuration for hosts composed without the application factory', () => {
  const container = new ServiceContainer();
  const fallback = resolveMailSenderFactory(container, {
    default: 'main',
    main: smtp,
  });
  expect(fallback.defaultMailer).toBe('main');
  expect(container.has(mailSenderFactoryToken)).toBe(false);
  const registered = new MailSenderFactory();
  container.instance(mailSenderFactoryToken, registered);
  expect(
    resolveMailSenderFactory(container, { default: 'main', main: smtp }),
  ).toBe(registered);
  expect(resolveMailSenderFactory().defaultMailer).toBeUndefined();
});
