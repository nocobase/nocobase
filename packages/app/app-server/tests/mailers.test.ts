import { afterEach, expect, it, vi } from 'vitest';
import * as transports from '@nocobase/mailer';
import {
  ApplicationMailer,
  applicationMailerToken,
  defineMailersConfig,
  mailerEnvironment,
} from '../src/mailers/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import { Application } from '../src/application/index.js';
import { ServiceProvider } from '@nocobase/service-provider';

afterEach(() => vi.restoreAllMocks());
const smtp = { provider: 'smtp', host: 'localhost', port: 25 } as const;
const message = {
  to: 'synthetic@example.test',
  subject: 'Test',
  text: 'Synthetic',
};

it('does not choose the first entry, validates defaults and keeps diagnostics private', async () => {
  const mailer = new ApplicationMailer({ first: smtp });
  expect(await mailer.send(message)).toMatchObject({
    status: 'failed',
    error: { category: 'configuration' },
  });
  for (const config of [
    { default: 'absent', first: smtp },
    { default: 'first', first: { ...smtp, enabled: false } },
    { first: { ...smtp, apiKey: 'synthetic-secret' } },
    { first: { provider: 'synthetic-secret' } },
    { first: { ...smtp, secure: 'synthetic-secret' } },
  ]) {
    expect(() => new ApplicationMailer(config as never)).toThrow(/mailers/u);
    try {
      new ApplicationMailer(config as never);
    } catch (error) {
      expect(String(error)).not.toContain('synthetic-secret');
    }
  }
  expect(() =>
    defineMailersConfig({ defaults: {}, public: ['first.auth.pass'] }),
  ).toThrow(/private/u);
  await mailer.close();
});

it('declares discoverable typed environment values and never publishes credentials', async () => {
  const config = new AppConfig();
  await config.loadAll();
  const factory = defineMailersConfig({
    defaults: {},
    env: mailerEnvironment('transactional', 'MAILERS_TRANSACTIONAL'),
  });
  config.mergeDefaults({ mailers: factory({} as never) });
  config.defineSections(new Map([['mailers', factory.rules!]]));
  await config.loadSectionEnvironment({
    MAILERS_TRANSACTIONAL_PROVIDER: 'smtp',
    MAILERS_TRANSACTIONAL_HOST: 'localhost',
    MAILERS_TRANSACTIONAL_PORT: '2525',
    MAILERS_TRANSACTIONAL_SECURE: 'false',
    MAILERS_TRANSACTIONAL_USER: 'synthetic',
    MAILERS_TRANSACTIONAL_PASSWORD: 'synthetic-secret',
  });
  expect(await config.validate()).toEqual([]);
  expect(config.get('mailers.transactional')).toMatchObject({
    port: 2525,
    secure: false,
    auth: { pass: 'synthetic-secret' },
  });
  expect(config.publicValues()).toEqual({});
  expect(factory.rules?.env?.MAILERS_TRANSACTIONAL_PASSWORD.secret).toBe(true);
  expect(factory.rules?.env?.MAILERS_TRANSACTIONAL_API_KEY.secret).toBe(true);
});

it('shares concurrent first creation, isolates applications and sources, and drains original submissions', async () => {
  let finish!: (value: transports.MailResult) => void;
  const completion = new Promise<transports.MailResult>((resolve) => {
    finish = resolve;
  });
  const close = vi.fn(async () => {});
  const send = vi.fn(() => completion);
  const create = vi
    .spyOn(transports, 'createMailTransport')
    .mockImplementation(() => ({ send, close }));
  const configured = {
    default: 'main',
    main: { ...smtp, auth: { user: 'synthetic', pass: 'original' } },
  };
  const mailer = new ApplicationMailer(configured);
  configured.main.auth.pass = 'changed';
  const sends = [mailer.send(message), mailer.send(message)];
  expect(create).toHaveBeenCalledOnce();
  expect(create.mock.calls[0][0]).toMatchObject({ auth: { pass: 'original' } });
  const source = {};
  const inline = mailer.bindInline(source, smtp);
  expect(Object.keys(inline)).toEqual(['send']);
  expect(mailer.bindInline(source, smtp)).toBe(inline);
  sends.push(inline.send(message), mailer.bindInline({}, smtp).send(message));
  const other = new ApplicationMailer({ default: 'main', main: smtp });
  sends.push(other.send(message));
  expect(create).toHaveBeenCalledTimes(4);
  let closed = false;
  const shutdown = mailer.close().then(() => {
    closed = true;
  });
  expect(await mailer.send(message)).toMatchObject({ status: 'failed' });
  expect(await inline.send(message)).toMatchObject({ status: 'failed' });
  await Promise.resolve();
  expect(closed).toBe(false);
  finish({
    status: 'submission_unknown',
    error: { category: 'network', message: 'Synthetic failure.' },
  });
  expect(
    (await Promise.all(sends)).every(
      (result) => result.status === 'submission_unknown',
    ),
  ).toBe(true);
  await shutdown;
  await other.close();
  expect(close).toHaveBeenCalledTimes(4);
});

it('registers once before consumers, fixes startup snapshots and closes after business producers', async () => {
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
    override async start(): Promise<void> {
      await this.app.container.resolve(applicationMailerToken).send(message);
    }
    override async shutdown(): Promise<void> {
      events.push('producer');
      expect(
        await this.app.container.resolve(applicationMailerToken).send(message),
      ).toEqual({ status: 'accepted' });
    }
  }
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: import.meta.dirname }),
  });
  app.addServiceProvider(Producer);
  await app.start();
  const mailer = app.container.resolve(applicationMailerToken);
  source = { mailers: { ...source.mailers, default: 'other' } };
  await config.reload();
  expect(config.get('mailers.default')).toBe('other');
  expect(mailer.defaultMailer).toBe('main');
  expect(app.container.resolve(applicationMailerToken)).toBe(mailer);
  await app.shutdown();
  expect(events).toEqual(['producer', 'transport']);
  expect(await mailer.send(message)).toMatchObject({ status: 'failed' });
});

it('assembles legacy container scopes once and releases them only after the last consumer', async () => {
  const { ServiceContainer } = await import('@nocobase/service-provider');
  const { acquireApplicationMailer } = await import('../src/mailers/index.js');
  const container = new ServiceContainer();
  const first = acquireApplicationMailer(container, {
    default: 'main',
    main: smtp,
  });
  const second = acquireApplicationMailer(container);
  expect(second.mailer).toBe(first.mailer);
  expect(container.resolve(applicationMailerToken)).toBe(first.mailer);
  const close = vi.spyOn(first.mailer, 'close');
  await first.release();
  expect(close).not.toHaveBeenCalled();
  await second.release();
  expect(close).toHaveBeenCalledOnce();
  await second.release();
  expect(close).toHaveBeenCalledOnce();
  const isolated = acquireApplicationMailer(new ServiceContainer());
  expect(isolated.mailer).not.toBe(first.mailer);
  await isolated.release();
});
