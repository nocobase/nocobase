// @vitest-environment node

import { fileURLToPath } from 'node:url';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { AuthorizationConfig } from '@nocobase/app-plugin-authorization/server';
import { type AppIdentityConfig } from '@nocobase/app-server/config';
import {
  planAppDatabaseTasks,
  resolveAppMetadataStore,
  type AppDatabaseConfig,
} from '@nocobase/app-server/database';
import { createAppDatabaseTaskContributions } from '@nocobase/app-server/plugins';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import type { AppJobsConfig } from '@nocobase/app-server/jobs';
import {
  type CachingConfig,
  type AppDriveConfig,
  type AppLoggingConfig,
  type AppQueueConfig,
  type AppSessionConfigInput,
} from '@nocobase/app-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createNotificationRegistry,
  type NotificationConfig,
} from '@nocobase/app-plugin-notification/server';
import {
  createInAppChannelDefinition,
  createDatabaseProviderDefinition,
  MemoryInAppStore,
} from '@nocobase/app-plugin-notification-in-app/server';

import appRuntime from '../../server/runtime.ts';

const templateRootDir = fileURLToPath(new URL('../..', import.meta.url));

describe('application config', () => {
  let configRoot: string;
  let configPath: string;
  beforeAll(async () => {
    configRoot = await mkdtemp(path.join(tmpdir(), 'app-config-test-'));
    configPath = path.join(configRoot, 'config.yml');
    await writeFile(configPath, '{}');
  });
  afterAll(async () => {
    await rm(configRoot, { recursive: true, force: true });
  });

  it('offers in-app test sending by default and honors an explicit disabled configuration', async () => {
    const directory = mkdtempSync(
      path.join(tmpdir(), 'examples-notification-config-'),
    );
    const configPath = path.join(directory, 'config.yml');
    try {
      writeFileSync(configPath, '{}');
      const resolve = () =>
        resolveStandaloneAppRuntime(appRuntime, {
          rootDir: templateRootDir,
          configPath,
          env: { AUTH_SECRET: 'test-auth-secret-at-least-32-characters' },
        });
      const runtime = await resolve();
      const definition = createInAppChannelDefinition();
      const registry = createNotificationRegistry()
        .registerChannel(definition)
        .registerProvider(
          createDatabaseProviderDefinition({
            store: new MemoryInAppStore(),
            recipientExists: async () => true,
          }),
        );
      const config = runtime.config.get<NotificationConfig>('notification')!;
      expect(registry.testTargets(config)).toEqual([
        expect.objectContaining({
          channel: expect.objectContaining({ type: 'in-app' }),
          provider: expect.objectContaining({
            type: 'in-app',
          }),
        }),
      ]);
      const channelConfig = config.channels.inbox!;
      for (const recipient of ['current-user', 'another-user']) {
        expect(
          definition.test?.toSendInput({
            actor: { userId: 'current-user' },
            values: { recipient, title: 'Test', body: 'Hello' },
            channelConfig,
          }),
        ).toMatchObject({
          to: recipient,
        });
      }
      writeFileSync(
        configPath,
        'notification:\n  channels:\n    inbox:\n      provider: in-app\n      enabled: false\n',
      );
      const disabled = await resolve();
      expect(
        registry.testTargets(
          disabled.config.get<NotificationConfig>('notification')!,
        ),
      ).toEqual([]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('supplies analytics for main-only configs and honors file overrides', async () => {
    const directory = mkdtempSync(
      path.join(tmpdir(), 'examples-analytics-config-'),
    );
    const configPath = path.join(directory, 'config.yml');
    try {
      writeFileSync(
        configPath,
        'database:\n  default: main\n  connections:\n    main:\n      dialect: sqlite\n      database: main.sqlite\n',
      );
      const runtime = await resolveStandaloneAppRuntime(appRuntime, {
        rootDir: templateRootDir,
        configPath,
        env: { AUTH_SECRET: 'test-auth-secret-at-least-32-characters' },
      });
      const database = runtime.config.get<AppDatabaseConfig>('database')!;
      expect(database.default).toBe('main');
      expect(database.connections.analytics).toMatchObject({
        dialect: 'sqlite',
        filename: path.join(templateRootDir, 'storage/analytics.sqlite'),
        schemaManagement: 'managed',
        migrations: { autoRun: true },
        seeds: { autoRun: true },
      });
      expect(database.connections.externalCrm).toMatchObject({
        dialect: 'sqlite',
        filename: path.join(templateRootDir, 'storage/external-crm.sqlite'),
        schemaManagement: 'external',
        naming: { underscored: true, tablePrefix: 'crm_' },
      });
      // No store is configured: an external connection reads
      // database/externalCrm/metadata/<name>.json by default.
      expect(database.connections.externalCrm.metadataStore).toBeUndefined();
      expect(
        resolveAppMetadataStore(undefined, {
          name: 'externalCrm',
          external: true,
          paths: runtime.paths,
        }),
      ).toEqual({
        type: 'directory',
        directory: path.join(templateRootDir, 'database/externalCrm/metadata'),
      });
      const analytics = planAppDatabaseTasks(
        database,
        ['migrations', 'seeds'],
        {
          paths: runtime.paths,
          contributions: createAppDatabaseTaskContributions(runtime.plugins),
          autoRun: true,
        },
      ).filter((task) => task.connection === 'analytics');
      expect(analytics.map((task) => task.skipReason)).toEqual([
        undefined,
        undefined,
      ]);
      expect(
        analytics.map((task) =>
          task.config.sources?.map((source) => source.directory),
        ),
      ).toEqual([
        [path.join(templateRootDir, 'database/analytics/migrations')],
        [path.join(templateRootDir, 'database/analytics/seeds')],
      ]);
      writeFileSync(
        configPath,
        'database:\n  connections:\n    analytics:\n      database: custom-analytics.sqlite\n      migrations:\n        autoRun: false\n      seeds:\n        autoRun: false\n',
      );
      await runtime.config.reload();
      expect(
        runtime.config.get<AppDatabaseConfig>('database')!.connections
          .analytics,
      ).toMatchObject({
        dialect: 'sqlite',
        database: 'custom-analytics.sqlite',
        migrations: { autoRun: false },
        seeds: { autoRun: false },
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
  it('assembles module defaults in the runtime', async () => {
    const runtime = await resolveStandaloneAppRuntime(appRuntime, {
      rootDir: templateRootDir,
      configPath,
      env: { AUTH_SECRET: 'test-auth-secret-at-least-32-characters' },
    });

    expect(runtime.config.get<AppIdentityConfig>('app')!.name).toBe('main');
    const authorization =
      runtime.config.get<AuthorizationConfig>('authorization')!;
    expect(authorization.permissionSets).toEqual({
      rootSet: 'root',
      defaultSet: 'member',
    });
    expect(authorization.plugins?.map((plugin) => plugin.id)).toEqual([
      'default-access',
      'sharing-rules',
      'restriction-rules',
    ]);
    expect(runtime.config.get<CachingConfig>('caching')!.default).toBe(
      'memory',
    );
    expect(runtime.config.get<AppDatabaseConfig>('database')!.default).toBe(
      'main',
    );
    const drive = runtime.config.get<AppDriveConfig>('drive')!;
    expect(drive.default).toBe('local');
    expect(drive.disks.local).toEqual({
      driver: 'fs',
      location: fileURLToPath(new URL('../../storage', import.meta.url)),
      visibility: 'private',
    });
    expect(drive.disks.public).toBeUndefined();
    expect(
      runtime.config.get<AppLoggingConfig>('logging')!.default,
    ).toBeUndefined();
    expect(runtime.config.get('logging.file.name')).toBe('app');
    // No default: queues run on the built-in memory configuration until one is named.
    expect(runtime.config.get<AppQueueConfig>('queue')).toEqual({
      memory: {
        adapter: 'inMemory',
        persistence: { path: runtime.paths.storage('queue') },
      },
      redis: {
        adapter: 'redis',
        connection: { host: '127.0.0.1', port: 6379, db: 0 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { age: 604_800 },
      },
    });
    expect(runtime.config.get<AppJobsConfig>('jobs')).toEqual({
      memory: {
        adapter: 'memory',
        persistence: { path: runtime.paths.storage('jobs') },
      },
      redis: {
        adapter: 'redis',
        connection: { host: '127.0.0.1', port: 6379, db: 0 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { age: 604_800 },
      },
    });
    expect(runtime.config.get<AppSessionConfigInput>('session')!.default).toBe(
      'memory',
    );
  });

  it('reloads a file-backed configuration explicitly', async () => {
    const runtime = await resolveStandaloneAppRuntime(appRuntime, {
      rootDir: templateRootDir,
      configPath,
      env: { AUTH_SECRET: 'test-auth-secret-at-least-32-characters' },
    });

    const result = await runtime.config.reload();

    expect(result.changedNamespaces).toEqual([]);
  });
  it('lets the environment select the jobs configuration Scheduler runs on', async () => {
    const defaults = await resolveStandaloneAppRuntime(appRuntime, {
      rootDir: templateRootDir,
      configPath,
    });
    expect(defaults.config.get('scheduler')).toEqual({});

    const runtime = await resolveStandaloneAppRuntime(appRuntime, {
      rootDir: templateRootDir,
      configPath,
      env: { SCHEDULER_JOBS: 'redis' },
    });

    expect(runtime.config.get('scheduler.jobs')).toBe('redis');
  });

  it('loads only explicit env overrides and restores defaults on reload', async () => {
    const runtime = await resolveStandaloneAppRuntime(appRuntime, {
      rootDir: templateRootDir,
      configPath,
      env: {
        APP_SERVER_PORT: '14001',
        APP_SERVER_START_LOG: 'false',
        REDIS_HOST: 'ignored',
        NODE_ENV: 'production',
      },
    });
    expect(runtime.config.get('server.port')).toBe(14001);
    expect(runtime.config.get('server.startLog')).toBe(false);
    expect(runtime.config.get('queue.redis.connection.host')).toBe('127.0.0.1');
    expect(runtime.config.get('session.stores.redis.host')).toBe('127.0.0.1');
    expect(runtime.config.get('logging.console.pretty')).toBe(false);
    expect(runtime.config.get('session.cookie.secure')).toBe(true);
    expect(runtime.config.get('workflow.production')).toBe(true);
    delete runtime.env.APP_SERVER_PORT;
    delete runtime.env.APP_SERVER_START_LOG;
    await runtime.config.reload();
    expect(runtime.config.get('server.port')).toBe(13000);
    expect(runtime.config.get('server.startLog')).toBe(true);
  });
});
