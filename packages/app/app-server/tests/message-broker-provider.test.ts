import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Logging } from '@nocobase/logging';
import { ServiceContainer } from '@nocobase/service-provider';

import { AppConfig, createAppPaths } from '../src/config/index.js';
import { loggingToken } from '../src/logging/index.js';
import {
  MessageBrokerServiceProvider,
  messageBrokerServiceToken,
  validateAppMessageBrokerConfig,
  type AppMessageBrokerConfig,
} from '../src/message-broker/index.js';
import type { AppPluginApplication } from '../src/plugins/index.js';

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-message-broker-app-'));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

async function application(messageBroker?: AppMessageBrokerConfig) {
  const config = new AppConfig();
  await config.loadAll();
  if (messageBroker) config.mergeDefaults({ messageBroker });
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
  return { app, container, getLogger };
}

describe('MessageBrokerServiceProvider', () => {
  it('registers the service lazily, sets it up on start and releases it on shutdown', async () => {
    const { app, container, getLogger } = await application({
      default: 'memory',
      backends: { memory: { adapter: 'inMemory' } },
    });
    const provider = new MessageBrokerServiceProvider(app);
    expect(provider.name).toBe('@nocobase/app-server/message-broker');
    provider.register();
    expect(container.resolveIfCreated(messageBrokerServiceToken)).toBeUndefined();

    const broker = container.resolve(messageBrokerServiceToken);
    expect(getLogger).toHaveBeenCalledWith('message-broker');
    const received: unknown[] = [];
    broker.subscription('orders').consume((message) => {
      received.push(message.body);
    });
    await provider.start();
    await broker.publisher('orders').publish({ body: { id: 1 } });
    await vi.waitFor(() => expect(received).toEqual([{ id: 1 }]));
    expect(broker.describe().backends[0]).toMatchObject({
      name: 'memory',
      sharing: 'local',
    });

    await provider.shutdown();
    await expect(broker.publisher('orders').publish({ body: {} })).rejects.toThrow(
      'shut down',
    );
  });

  it('does not create the service at shutdown when nothing used it', async () => {
    const { app, container } = await application();
    const provider = new MessageBrokerServiceProvider(app);
    provider.register();
    await provider.shutdown();
    expect(container.resolveIfCreated(messageBrokerServiceToken)).toBeUndefined();
  });

  it('reports an invalid section through the configuration validator', () => {
    const errors: string[] = [];
    validateAppMessageBrokerConfig({ default: 'missing', backends: {} }, {
      error: (_path: string, message: string) => errors.push(message),
    } as never);
    expect(errors[0]).toContain('not in messageBroker.backends');
  });
});
