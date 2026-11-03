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
