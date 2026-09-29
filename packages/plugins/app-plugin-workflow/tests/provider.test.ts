import { Hono } from 'hono';
import { createAppPaths } from '@nocobase/app-server/config';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import { createLogging, createSilentLoggingConfig } from '@nocobase/logging';
import { createQueueManager, createSyncQueueConfig } from '@nocobase/queue';
import { loggingToken } from '@nocobase/app-server/logging';
import { queueManagerToken } from '@nocobase/app-server/queue';
import type { AppConfigAccessor } from '@nocobase/app-server/config';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  schedulerServiceToken,
  type SchedulerService,
} from '@nocobase/app-plugin-scheduler/server/tokens';
import type {
  ScheduleTargetHandle,
  ScheduleTargetType,
} from '@nocobase/app-plugin-scheduler/server';
import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';

import { WorkflowProvider } from '../server/provider.js';
import {
  workflowServiceToken,
  type WorkflowServiceContract,
} from '../server/index.js';
import { createTestDatabase } from './helpers.js';
import { echoInstruction } from './fixtures/instructions.js';

const providers: WorkflowProvider[] = [];
const databases: DatabaseManager[] = [];
const queues: ReturnType<typeof createQueueManager>[] = [];

afterEach(async () => {
  await Promise.all(providers.splice(0).map((provider) => provider.shutdown()));
  await Promise.all(queues.splice(0).map((queue) => queue.close()));
  await Promise.all(databases.splice(0).map((database) => database.destroy()));
});

describe('WorkflowProvider', () => {
  it('does not register the workflow service without a database', () => {
    const container = new ServiceContainer();
    const provider = createProvider('without-database', container);

    provider.register();

    expect(container.has(workflowServiceToken)).toBe(false);
  });

  it('registers isolated workflow services for multiple applications', async () => {
    const first = await createProviderWithDependencies('first');
    const second = await createProviderWithDependencies('second');

    first.provider.register();
    second.provider.register();

    expect(first.container.resolve(workflowServiceToken)).toBeDefined();
    expect(second.container.resolve(workflowServiceToken)).toBeDefined();
    expect(first.container.resolve(workflowServiceToken)).not.toBe(
      second.container.resolve(workflowServiceToken),
    );
  });

  it('registers an application instruction through the public workflow API', async () => {
    const { container, provider } = await createProviderWithDependencies('app');
    provider.register();
    const workflow = container.resolve(workflowServiceToken);
    expectTypeOf(workflow).toEqualTypeOf<WorkflowServiceContract>();

    expect(() => workflow.registerInstruction(echoInstruction)).not.toThrow();
    expect(() => workflow.registerInstruction(echoInstruction)).toThrow(
      'Workflow instruction "echo" is already registered.',
    );
  });

  it('keeps Workflow available when Scheduler is not registered', async () => {
    const { container, provider } =
      await createProviderWithDependencies('without-scheduler');
    provider.register();

    await expect(provider.boot()).resolves.toBeUndefined();
    expect(container.resolve(workflowServiceToken)).toBeDefined();
  });

  it.each(['scheduler-first', 'workflow-first'] as const)(
    'registers the Schedule target independently of plugin declaration order: %s',
    async (order) => {
      const { container, provider } =
        await createProviderWithDependencies(order);
      const scheduler = recordingScheduler();
      if (order === 'scheduler-first')
        container.instance(schedulerServiceToken, scheduler.service);
      provider.register();
      if (order === 'workflow-first')
        container.instance(schedulerServiceToken, scheduler.service);

      await provider.boot();

      expect(scheduler.registered.map((target) => target.type)).toEqual([
        'workflow',
      ]);
    },
  );
});

function recordingScheduler(): {
  service: SchedulerService;
  registered: ScheduleTargetType[];
} {
  const registered: ScheduleTargetType[] = [];
  const service: SchedulerService = {
    registerTarget: (target): ScheduleTargetHandle => {
      registered.push(target as ScheduleTargetType);
      return { type: target.type, reportCompletion: async () => {} };
    },
  };
  return { service, registered };
}

async function createProviderWithDependencies(appName: string): Promise<{
  container: ServiceContainer;
  provider: WorkflowProvider;
}> {
  const container = new ServiceContainer();
  const database = await createTestDatabase();
  const queue = createQueueManager(createSyncQueueConfig());
  const logging = createLogging(createSilentLoggingConfig());
  databases.push(database);
  queues.push(queue);
  container.instance(databaseManagerToken, database);
  container.instance(queueManagerToken, queue);
  container.instance(loggingToken, logging);
  return { container, provider: createProvider(appName, container) };
}

function createProvider(
  appName: string,
  container: ServiceContainer,
): WorkflowProvider {
  const provider = new WorkflowProvider({
    appName,
    container,
    publicBasePath: '/',
    router: new Hono(),
    paths: createAppPaths({ rootDir: '/tmp/nocobase-workflow-provider-test' }),
    config: createTestConfig({
      drive: {
        default: 'local',
        disks: {
          local: {
            driver: 'fs',
            location: '/tmp/nocobase-workflow-provider-test',
            visibility: 'private',
          },
        },
      },
      workflow: {
        sourceRoot: '/tmp/nocobase-workflow-provider-test/source',
        distRoot: '/tmp/nocobase-workflow-provider-test/dist',
        artifactDisk: 'local',
        production: false,
      },
    }),
  });
  providers.push(provider);
  return provider;
}

function createTestConfig(
  values: Readonly<Record<string, unknown>>,
): AppConfigAccessor {
  return {
    get: <TValue>(definition: string): TValue => values[definition] as TValue,
    raw: () => values,
    reload: () => Promise.resolve({ changedNamespaces: [] }),
    subscribe: () => () => undefined,
  };
}
