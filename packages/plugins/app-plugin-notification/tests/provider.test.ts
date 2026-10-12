import {
  SendingProvider,
  sendingServiceToken,
  sendingExtensionRegistryToken,
} from '@nocobase/app-server/sending';
import { createEmailChannelDefinition } from '@nocobase/sending/email';
import { createNotificationManager } from '../server/manager.js';
import { FakeNotificationStore } from './helpers/fake-notification-store.js';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import {
  authorizationToken,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import { loggingToken } from '@nocobase/app-server/logging';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { createLogger, type Logging } from '@nocobase/logging';
import type { JobExecutorService } from '@nocobase/jobs';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import { NotificationProvider } from '../server/providers/notification.js';
import { InlineJobExecutor } from './helpers/inline-job-executor.js';
import { notificationRuntimeToken } from '../server/runtime.js';
import {
  notificationExtensionRegistryToken,
  notificationServiceToken,
} from '../server/tokens.js';

describe('@nocobase/app-plugin-notification provider', () => {
  it('registers, activates, and closes the core manager', async () => {
    const container = createContainer(true);
    const provider = new NotificationProvider({
      config: {
        get: () => ({
          channels: { email: { provider: 'fake', enabled: true } },
        }),
      },
      container,
    });

    provider.register();
    expect(container.has(notificationServiceToken)).toBe(true);
    expect(container.has(notificationExtensionRegistryToken)).toBe(true);
    const registry = container.resolve(notificationExtensionRegistryToken);
    registry
      .registerChannel({
        type: 'email',
        async createChannel() {
          return {
            type: 'email',
            validateMessage: (message: object) => ({
              message,
              recipients: [{}],
            }),
            async prepare(input): Promise<object> {
              return input.message;
            },
          };
        },
      })
      .registerProvider({
        messageType: 'email',
        type: 'fake',
        async createProvider(_context, config) {
          return {
            type: config.provider,
            async send() {
              return { status: 'accepted' } as const;
            },
          };
        },
      });
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
    expect(authorization.resourceTypes.add).toHaveBeenCalledOnce();
    const add = authorization.resourceTypes.add as unknown as ReturnType<
      typeof vi.fn
    >;
    const handler = add.mock.calls[0]?.[0] as {
      type: string;
      actions: readonly string[];
      authorize(
        request: object,
        context: object,
      ): Promise<{ readonly effect: string }>;
    };
    expect(handler).toMatchObject({ type: 'notification', actions: ['send'] });
    const context = {
      grants: {
        resolve: () =>
          Promise.resolve([
            {
              source: { plugin: 'permission-sets', id: 'operators' },
              resource: { type: 'notification', id: '*' },
              action: 'send',
            },
          ]),
      },
    };
    const request = (id: string) => ({
      principal: { type: 'user', id: 'user-1' },
      resource: { type: 'notification', id },
      action: 'send',
    });
    await expect(
      handler.authorize(request('test'), context),
    ).resolves.toMatchObject({ effect: 'permit' });
    await expect(
      handler.authorize(request('other'), context),
    ).resolves.toMatchObject({ effect: 'deny' });
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

  it.each(['notification', 'sending'] as const)(
    'starts mixed legacy %s and sending-only extensions and exposes both management targets',
    async (layer) => {
      const container = createContainer(true);
      const sections = {
        notification: {
          channels: {
            text: { provider: 'local-sms' },
            oldMail: { provider: 'custom-mail' },
          },
        },
        sending: { channels: { newMail: { provider: 'custom-mail' } } },
      };
      const app = { config: configSections(sections), container };
      const sendingProvider = new SendingProvider(app);
      sendingProvider.register();
      const provider = new NotificationProvider(app);
      provider.register();
      const sendingRegistry = container.resolve(sendingExtensionRegistryToken);
      const sent = vi.fn(async () => ({ status: 'accepted' as const }));
      sendingRegistry.registerProvider({
        type: 'custom-mail',
        messageType: 'email',
        async createProvider() {
          return { type: 'custom-mail', send: sent };
        },
      });
      const registry = container.resolve(notificationExtensionRegistryToken);
      registry
        .registerChannel({
          type: 'sms',
          ...(layer === 'sending' ? { deliveryLayer: 'sending' as const } : {}),
          test: { label: 'SMS', fields: [], toSendInput: () => ({}) },
          async createChannel() {
            return {
              type: 'sms',
              validateMessage: (message) => ({
                message: message as object,
                recipients: [{}],
              }),
              async prepare() {
                return {};
              },
            };
          },
        })
        .registerProvider({
          type: 'local-sms',
          messageType: 'sms',
          ...(layer === 'sending' ? { deliveryLayer: 'sending' as const } : {}),
          async createProvider() {
            return { type: 'local-sms', send: sent };
          },
        });
      // Notification contributes the email test form; delivery definitions are only registered through sending.
      registry.registerChannel({
        ...createEmailChannelDefinition(),
        test: { label: 'Email', fields: [], toSendInput: () => ({}) },
      });
      await sendingProvider.boot();
      await provider.boot();
      await sendingProvider.start();
      await provider.start();
      const sending = container.resolve(sendingServiceToken);
      expect(Object.keys(sending.config().channels).sort()).toEqual(
        layer === 'sending'
          ? ['newMail', 'oldMail', 'text']
          : ['newMail', 'oldMail'],
      );
      const manager = container.resolve(notificationRuntimeToken);
      expect(
        manager
          .listTestTargets()
          .map((target) => target.channel.name)
          .sort(),
      ).toEqual(['newMail', 'oldMail', 'text']);
      const runtime = createNotificationManager({
        database: container.resolve(databaseManagerToken),
        executor: new InlineJobExecutor(),
        logger: createLogger({ level: 'silent' }),
        registry,
        sending,
        store: new FakeNotificationStore(),
        config: {
          channels: {
            ...sections.notification.channels,
            ...sending.config().channels,
          },
        },
      });
      try {
        await runtime.sendTransient({ channel: 'text', message: {} });
        await runtime.sendTransient({
          channel: 'newMail',
          message: {
            to: 'recipient@example.test',
            subject: 'Test',
            text: 'Test',
          },
        });
        expect(sent).toHaveBeenCalledTimes(2);
      } finally {
        await runtime.close();
        await provider.shutdown();
        await sendingProvider.shutdown();
      }
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
