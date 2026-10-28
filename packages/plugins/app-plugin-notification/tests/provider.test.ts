import {
  authorizationToken,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import type { JobExecutorService } from '@nocobase/jobs';
import { createLogger, type Logging } from '@nocobase/logging';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import type {
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendResult,
} from '../server/channel-type.js';
import { NotificationProvider } from '../server/providers/notification.js';
import { notificationRuntimeToken } from '../server/runtime.js';
import {
  notificationExtensionRegistryToken,
  notificationServiceToken,
} from '../server/tokens.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';

describe('@nocobase/app-plugin-notification provider', () => {
  it('registers, activates, and closes the core manager', async () => {
    const container = createContainer(true);
    const provider = new NotificationProvider({
      config: {
        get: () => ({
          channels: { email: { type: 'fake', enabled: true } },
        }),
      },
      container,
    });

    provider.register();
    expect(container.has(notificationServiceToken)).toBe(true);
    expect(container.has(notificationExtensionRegistryToken)).toBe(true);
    const registry = container.resolve(notificationExtensionRegistryToken);
    class FakeChannel implements ChannelInstance {
      static readonly type = 'fake';
      validateMessage(message: unknown) {
        return { message: message as object, recipients: [{}] };
      }
      async prepare({ message }: ChannelPreparationInput): Promise<object> {
        return message;
      }
      async send(): Promise<ChannelSendResult> {
        return { status: 'accepted' };
      }
    }
    registry.registerChannelType(FakeChannel);
    const notification = container.resolve(notificationRuntimeToken);
    expect(container.resolve(notificationServiceToken)).toBe(notification);
    const activate = vi.spyOn(notification, 'activate');
    const start = vi.spyOn(notification, 'start');
    const close = vi.spyOn(notification, 'close');
    const jobs = container.resolve(jobExecutorServiceToken);
    const executor = vi.mocked(jobs.getJobExecutor).mock.results[0]
      ?.value as InlineJobExecutor;
    const registerJob = vi.spyOn(executor, 'registerJob');
    const setup = vi.spyOn(executor, 'setup');
    const executorShutdown = vi.spyOn(executor, 'shutdown');

    await provider.boot();
    await provider.start();
    await provider.shutdown();

    expect(activate).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();
    expect(jobs.getJobExecutor).toHaveBeenCalledWith(
      '@nocobase/app-plugin-notification',
      undefined,
    );
    expect(registerJob).toHaveBeenCalledOnce();
    expect(setup).toHaveBeenCalledOnce();
    expect(registerJob.mock.invocationCallOrder[0]).toBeLessThan(
      setup.mock.invocationCallOrder[0]!,
    );
    expect(close).toHaveBeenCalledOnce();
    expect(executorShutdown).toHaveBeenCalledOnce();
    const authorization = container.resolve(authorizationToken);
    expect(authorization.resourceTypes.add).not.toHaveBeenCalled();
  });

  it('runs Deliveries on the jobs configuration notification.jobs names', () => {
    const container = createContainer(true);
    const provider = new NotificationProvider({
      config: configSections({
        notification: { channels: {}, jobs: 'deliveries' },
        jobs: { default: 'memory', deliveries: { adapter: 'memory' } },
      }),
      container,
    });

    provider.register();
    container.resolve(notificationRuntimeToken);

    expect(
      container.resolve(jobExecutorServiceToken).getJobExecutor,
    ).toHaveBeenCalledWith('@nocobase/app-plugin-notification', 'deliveries');
  });

  it.each(['typo', 'default'])(
    'refuses to register when notification.jobs names "%s"',
    (name) => {
      const container = createContainer(true);
      const provider = new NotificationProvider({
        config: configSections({
          notification: { channels: {}, jobs: name },
          jobs: { default: 'memory', memory: { adapter: 'memory' } },
        }),
        container,
      });

      expect(() => provider.register()).toThrow(
        `notification.jobs names "${name}", which is not a jobs configuration.`,
      );
    },
  );

  it('fails fast when the required database dependency is missing', () => {
    const container = createContainer(false);
    const provider = new NotificationProvider({
      config: { get: () => ({ channels: {} }) },
      container,
    });

    expect(() => provider.register()).toThrow(
      'Notification core requires the database manager dependency.',
    );
  });
});

function configSections(sections: Readonly<Record<string, unknown>>): {
  get<T>(key: string): T | undefined;
} {
  return { get: <T>(key: string) => sections[key] as T | undefined };
}

function createContainer(withDatabase: boolean): ServiceContainer {
  const container = new ServiceContainer();
  if (withDatabase) {
    container.instance(databaseManagerToken, {} as DatabaseManager);
  }
  container.instance(loggingToken, {
    getLogger: () => createLogger({ level: 'silent' }),
  } as Logging);
  container.instance(jobExecutorServiceToken, {
    getJobExecutor: vi.fn(() => new InlineJobExecutor()),
    getScheduleExecutor: vi.fn(),
  } as unknown as JobExecutorService);
  container.instance(authorizationToken, {
    resourceTypes: { add: vi.fn() },
  } as unknown as Authorization);
  return container;
}

it.each(['smtp', 'resend'] as const)(
  'supplies and closes the legacy %s mailer without manual host registration',
  async (providerType) => {
    const { createServer } = await import('node:net');
    const { AppConfig } = await import('@nocobase/app-server/config');
    const { mailerToken, legacyMailerName } =
      await import('@nocobase/app-server/mailer');
    const sockets = new Set<import('node:net').Socket>();
    let messages = 0;
    const smtp = createServer((socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
      socket.write('220 local.test ESMTP\r\n');
      let input = '';
      let data = false;
      socket.on('data', (chunk) => {
        input += chunk.toString();
        while (input.includes('\r\n')) {
          const end = input.indexOf('\r\n');
          const line = input.slice(0, end);
          input = input.slice(end + 2);
          if (data && line !== '.') continue;
          if (data) {
            data = false;
            messages++;
            socket.write('250 queued\r\n');
          } else if (line.startsWith('EHLO'))
            socket.write('250-local.test\r\n250 PIPELINING\r\n');
          else if (line === 'DATA') {
            data = true;
            socket.write('354 send data\r\n');
          } else socket.write('250 ok\r\n');
        }
      });
    });
    await new Promise<void>((resolve) => smtp.listen(0, '127.0.0.1', resolve));
    const port = (smtp.address() as import('node:net').AddressInfo).port;
    const config = new AppConfig().load({
      name: 'test',
      read: async () => ({
        kind: 'map',
        value: {
          notification: {
            channels: {
              legacy:
                providerType === 'smtp'
                  ? {
                      provider: 'smtp',
                      host: '127.0.0.1',
                      port,
                      from: 'sender@example.test',
                    }
                  : {
                      provider: 'resend',
                      apiKey: 'synthetic',
                      from: 'sender@example.test',
                    },
            },
          },
        },
      }),
    });
    await config.loadAll();
    const container = createContainer(true);
    const provider = new NotificationProvider({ config, container });
    const fetch = vi.fn(async () => Response.json({ id: 'synthetic' }));
    if (providerType === 'resend') vi.stubGlobal('fetch', fetch);
    try {
      expect(container.has(mailerToken)).toBe(false);
      provider.register();
      await provider.boot();
      const mailer = container.resolve(mailerToken);
      const mailerClose = vi.spyOn(mailer, 'close');
      const runtime = container.resolve(notificationRuntimeToken);
      const managerClose = vi.spyOn(runtime, 'close');
      const result = await mailer.send(legacyMailerName('legacy'), {
        to: 'recipient@example.test',
        subject: 'Synthetic',
        text: 'Synthetic',
      });
      expect(result.status).toBe('accepted');
      if (providerType === 'smtp') expect(messages).toBe(1);
      else expect(fetch).toHaveBeenCalledOnce();
      await provider.shutdown();
      expect(mailerClose).toHaveBeenCalledOnce();
      expect(managerClose.mock.invocationCallOrder[0]).toBeLessThan(
        mailerClose.mock.invocationCallOrder[0]!,
      );
      expect(mailer.available(legacyMailerName('legacy'))).toBe(false);
      await vi.waitFor(() => expect(sockets.size).toBe(0));
    } finally {
      await provider.shutdown();
      vi.unstubAllGlobals();
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => smtp.close(() => resolve()));
    }
  },
);

it('preserves an application mailer and leaves its shutdown to the application', async () => {
  const { mailerToken } = await import('@nocobase/app-server/mailer');
  const container = createContainer(true);
  const mailer = {
    available: () => true,
    send: vi.fn(async () => ({ status: 'accepted' as const })),
    close: vi.fn(async () => {}),
  };
  container.instance(mailerToken, mailer);
  const provider = new NotificationProvider({
    config: configSections({ notification: { channels: {} } }),
    container,
  });
  provider.register();
  await provider.boot();
  expect(container.resolve(mailerToken)).toBe(mailer);
  await provider.shutdown();
  expect(mailer.close).not.toHaveBeenCalled();
});
