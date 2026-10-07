import { Hono } from 'hono';
import { createAppPaths } from '@nocobase/app-server/config';
import { databaseManagerToken } from '@nocobase/db';
import { type TestDatabase } from '@nocobase/app-testing/server';
import { createLogging, createSilentLoggingConfig } from '@nocobase/logging';
import {
  createJobExecutorService,
  type ManagedJobExecutorService,
} from '@nocobase/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { SnowflakeIdGenerator } from '@nocobase/snowflake';
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
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { WorkflowProvider } from '../server/provider.js';
import {
  workflowServiceToken,
  type WorkflowServiceContract,
} from '../server/index.js';
import { createWorkflowTestDatabase } from './helpers.js';
import { echoInstruction } from './fixtures/instructions.js';

const providers: WorkflowProvider[] = [];
const databases: TestDatabase[] = [];
const jobServices: ManagedJobExecutorService[] = [];

afterEach(async () => {
  await Promise.all(providers.splice(0).map((provider) => provider.shutdown()));
  await Promise.all(jobServices.splice(0).map((jobs) => jobs.shutdown()));
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
    expect(workflow.getInstructionApi('wait')).toMatchObject({
      getPending: expect.any(Function),
      resume: expect.any(Function),
    });

    expect(() => workflow.registerInstruction(echoInstruction)).not.toThrow();
    expect(() => workflow.registerInstruction(echoInstruction)).toThrow(
      'Workflow instruction "echo" is already registered.',
    );
  });

  it('refuses to allocate ids without the application generator in production', async () => {
    const { container, provider } = await createProviderWithDependencies(
      'production-without-ids',
      { production: true },
    );
    provider.register();
    expect(() => container.resolve(workflowServiceToken)).toThrow(
      'requires the application id generator in production',
    );

    const registered = await createProviderWithDependencies(
      'production-with-ids',
      { production: true },
    );
    registered.container.instance(
      idGeneratorToken,
      new SnowflakeIdGenerator({ workerId: 3 }),
    );
    registered.provider.register();
    expect(registered.container.resolve(workflowServiceToken)).toBeDefined();
  });

  it('keeps Workflow available when Scheduler is not registered', async () => {
    const { container, provider } =
      await createProviderWithDependencies('without-scheduler');
    provider.register();

    await expect(provider.boot()).resolves.toBeUndefined();
    expect(container.resolve(workflowServiceToken)).toBeDefined();
  });

  it('runs workflow tasks on the jobs configuration workflow.jobs names', async () => {
    const { container, provider } = await createProviderWithDependencies(
      'selected-jobs',
      { workflowJobs: 'workflows' },
    );
    const jobs = container.resolve(jobExecutorServiceToken);
    const getJobExecutor = vi.spyOn(jobs, 'getJobExecutor');
    provider.register();

    container.resolve(workflowServiceToken);

    expect(getJobExecutor).toHaveBeenCalledWith(
      '@nocobase/app-plugin-workflow',
      'workflows',
    );
  });

  it.each(['typo', 'default'])(
    'refuses to register when workflow.jobs names "%s"',
    async (name) => {
      const { provider } = await createProviderWithDependencies('bad-jobs', {
        workflowJobs: name,
      });

      expect(() => provider.register()).toThrow(
        `workflow.jobs names "${name}", which is not a jobs configuration.`,
      );
    },
  );

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

interface ProviderOptions {
  readonly workflowJobs?: string;
  readonly production?: boolean;
}

async function createProviderWithDependencies(
  appName: string,
  options: ProviderOptions = {},
): Promise<{
  container: ServiceContainer;
  provider: WorkflowProvider;
}> {
  const container = new ServiceContainer();
  const testDatabase = await createWorkflowTestDatabase();
  const { database } = testDatabase;
  const jobs = createJobExecutorService(undefined, {
    appName,
    storagePath: path.join(
      os.tmpdir(),
      `nocobase-workflow-provider-${appName}`,
    ),
  });
  const logging = createLogging(createSilentLoggingConfig());
  databases.push(testDatabase);
  jobServices.push(jobs);
  container.instance(databaseManagerToken, database);
  container.instance(jobExecutorServiceToken, jobs);
  container.instance(loggingToken, logging);
  return { container, provider: createProvider(appName, container, options) };
}

function createProvider(
  appName: string,
  container: ServiceContainer,
  options: ProviderOptions = {},
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
        production: options.production ?? false,
        ...(options.workflowJobs === undefined
          ? {}
          : { jobs: options.workflowJobs }),
      },
      jobs: {
        default: 'memory',
        memory: { adapter: 'memory' },
        workflows: { adapter: 'memory' },
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
