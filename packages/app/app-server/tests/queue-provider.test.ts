import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Logging } from '@nocobase/logging';
import { ServiceContainer } from '@nocobase/service-provider';

import { AppConfig, createAppPaths } from '../src/config/index.js';
import { loggingToken } from '../src/logging/index.js';
import type { AppPluginApplication } from '../src/plugins/index.js';
import {
  QueueServiceProvider,
  queueServiceToken,
  type AppQueueConfig,
} from '../src/queue/index.js';

function stateFile(namespace: string, queue: string): string {
  const identity = Buffer.from(JSON.stringify([namespace, queue])).toString(
    'base64url',
  );
  return `queue.${identity}.state.json`;
}

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-queue-app-'));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

async function application(queue?: AppQueueConfig) {
  const config = new AppConfig();
  await config.loadAll();
  if (queue) config.mergeDefaults({ queue });
  const container = new ServiceContainer();
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
  logger.child.mockReturnValue(logger);
  const getLogger = vi.fn(() => logger);
  container.instance(loggingToken, { getLogger } as unknown as Logging);
  const app: AppPluginApplication = {
    appName: 'crm',
    publicBasePath: '',
    config,
    paths: createAppPaths({ rootDir }),
    router: new Hono(),
    container,
  };
  return { app, container, logger, getLogger };
}

describe('QueueServiceProvider', () => {
  it('registers the service lazily, sets it up on start and releases it on shutdown', async () => {
    const { app, container } = await application();
    const provider = new QueueServiceProvider(app);

    expect(provider.name).toBe('@nocobase/app-server/queue');
    provider.register();
    expect(container.resolveIfCreated(queueServiceToken)).toBeUndefined();

    const queue = container.resolve(queueServiceToken);
    expect(container.resolve(queueServiceToken)).toBe(queue);
    const received = vi.fn();
    const unregister = queue.consumer('email').consume(async (_c, message) => {
      received(message);
    });

    await provider.start();
    await queue.producer('email').publish('send', { to: 'user' });
    await vi.waitFor(() => {
      expect(received).toHaveBeenCalledExactlyOnceWith({ to: 'user' });
    });
    await unregister();
    await queue.producer('email').publish('send', { to: 'pending' });
    await provider.shutdown();
    await provider.shutdown();

    expect(await readdir(path.join(rootDir, 'storage', 'queue'))).toEqual([
      stateFile('crm', 'email'),
    ]);
  });

  it('writes the fallback warning to the queue logger outside development', async () => {
    const { app, container, logger, getLogger } = await application();
    const provider = new QueueServiceProvider(app, { nodeEnv: 'production' });
    provider.register();

    const queue = container.resolve(queueServiceToken);
    queue.producer('a');
    queue.producer('b');

    expect(getLogger).toHaveBeenCalledWith('queue');
    expect(logger.child).toHaveBeenCalledWith({ module: 'queue' });
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      {},
      expect.stringMatching(/built-in memory configuration/u),
    );
    await provider.shutdown();
  });

  it.each(['develop', 'development'])(
    'does not warn about the fallback when NODE_ENV is %s',
    async (nodeEnv) => {
      const { app, container, logger } = await application();
      const provider = new QueueServiceProvider(app, { nodeEnv });
      provider.register();

      container.resolve(queueServiceToken).producer('a');

      expect(logger.warn).not.toHaveBeenCalled();
      await provider.shutdown();
    },
  );

  it('uses the configured default and namespace without warning', async () => {
    const { app, container, logger } = await application({
      default: 'memory',
      memory: {
        adapter: 'inMemory',
        namespace: 'crm-queue',
        persistence: { path: path.join(rootDir, 'custom') },
      },
    });
    const provider = new QueueServiceProvider(app, { nodeEnv: 'production' });
    provider.register();
    const queue = container.resolve(queueServiceToken);
    queue.producer('reports');

    await provider.start();
    await queue.producer('reports').publish('build', {});
    await provider.shutdown();

    expect(await readdir(path.join(rootDir, 'custom'))).toEqual([
      stateFile('crm-queue', 'reports'),
    ]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('ignores the former queue configuration with one warning', async () => {
    const { app, container, logger } = await application({
      default: 'sync',
      connections: { sync: { driver: 'sync' } },
      worker: { concurrency: 1 },
    } as unknown as AppQueueConfig);
    const provider = new QueueServiceProvider(app, { nodeEnv: 'development' });
    provider.register();
    const queue = container.resolve(queueServiceToken);
    queue.producer('legacy');

    await provider.start();
    await queue.producer('legacy').publish('x', {});
    await provider.shutdown();

    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      {},
      expect.stringMatching(/removed connections\/worker\/jobs format/u),
    );
  });

  it('shuts down safely when the service was never created', async () => {
    const { app } = await application();
    const provider = new QueueServiceProvider(app);
    provider.register();

    await provider.shutdown();
    await expect(readdir(path.join(rootDir, 'storage'))).rejects.toThrow();
  });
});
