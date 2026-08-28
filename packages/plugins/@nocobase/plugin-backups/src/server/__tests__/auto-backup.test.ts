/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import { PluginBackupsServer } from '../plugin';

type AppEventCallback = () => void | Promise<void>;

function createPlugin() {
  const callbacks = new Map<string, AppEventCallback>();
  const repository = {
    findOne: vi.fn().mockResolvedValue({ scheduled: true, cron: '0 0 * * *' }),
  };
  const app = {
    context: {
      reqId: undefined,
    },
    log: {
      child: vi.fn().mockReturnValue({ info: vi.fn() }),
    },
    cacheManager: {
      createCache: vi.fn().mockResolvedValue(undefined),
    },
    acl: {
      addFixedParams: vi.fn(),
    },
    resourceManager: {
      define: vi.fn(),
    },
    on: vi.fn((event: string, callback: AppEventCallback) => {
      callbacks.set(event, callback);
    }),
    db: {
      getRepository: vi.fn().mockReturnValue(repository),
    },
  } as unknown as Application;

  return {
    callbacks,
    plugin: new PluginBackupsServer(app, { name: 'backups' }),
    repository,
  };
}

describe('automatic backup scheduling', () => {
  let originalWorkerMode: string | undefined;

  beforeEach(() => {
    originalWorkerMode = process.env.WORKER_MODE;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    if (originalWorkerMode === undefined) {
      delete process.env.WORKER_MODE;
    } else {
      process.env.WORKER_MODE = originalWorkerMode;
    }
    vi.restoreAllMocks();
  });

  it('should not schedule automatic backups in transient command workers', async () => {
    process.env.WORKER_MODE = '-';
    const { callbacks, plugin, repository } = createPlugin();

    await plugin.load();
    const beforeStart = callbacks.get('beforeStart');
    expect(beforeStart).toBeDefined();
    await beforeStart?.();

    expect(vi.getTimerCount()).toBe(0);
    expect(repository.findOne).toHaveBeenCalledOnce();
  });

  it('should continue scheduling automatic backups in regular app processes', async () => {
    delete process.env.WORKER_MODE;
    const { callbacks, plugin, repository } = createPlugin();

    await plugin.load();
    const beforeStart = callbacks.get('beforeStart');
    expect(beforeStart).toBeDefined();
    await beforeStart?.();

    expect(vi.getTimerCount()).toBe(1);
    expect(repository.findOne).toHaveBeenCalledTimes(2);
  });
});
