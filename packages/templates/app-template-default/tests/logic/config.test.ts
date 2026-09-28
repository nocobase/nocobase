// @vitest-environment node

import { fileURLToPath } from 'node:url';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { AuthorizationConfig } from '@nocobase/app-plugin-authorization/server';
import { type AppIdentityConfig } from '@nocobase/app-server/config';
import { type AppDatabaseConfig } from '@nocobase/app-server/database';
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

import appRuntime from '../../server/runtime.ts';

const templateRootDir = fileURLToPath(new URL('../..', import.meta.url));

describe('application config', () => {
  let configRoot: string;
  let configPath: string;
  beforeAll(async () => {
    configRoot = await mkdtemp(path.join(os.tmpdir(), 'app-config-test-'));
    configPath = path.join(configRoot, 'config.yml');
    await writeFile(configPath, '{}');
  });
  afterAll(async () => {
    await rm(configRoot, { recursive: true, force: true });
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
    expect(runtime.config.get<AppQueueConfig>('queue')!.default).toBe('sync');
    // Scheduler runs on the schedule service, not on a queue of its own.
    expect(runtime.config.get<AppQueueConfig>('queue')!.queues).toBeUndefined();
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
    expect(
      runtime.config.get<AppQueueConfig>('queue')!.jobs?.locations,
    ).toContain(
      path.join(templateRootDir, 'server', 'jobs', '**', '*.{ts,js}'),
    );
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
    expect(runtime.config.get('queue.connections.redis.host')).toBe(
      '127.0.0.1',
    );
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
