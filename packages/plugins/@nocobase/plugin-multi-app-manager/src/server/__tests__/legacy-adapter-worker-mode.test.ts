/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, describe, expect, it, vi, type SpyInstance } from 'vitest';
import { AppSupervisor } from '@nocobase/server';
import { LegacyAdapter } from '../adapters/legacy-adapter';
import { PluginMultiAppManagerServer } from '../server';

// Stub initApp to be a no-op (does not register any app, so hasApp returns false)
AppSupervisor.prototype.initApp = async () => {};

describe('LegacyAdapter _bootStrapApp should skip setAppStatus only for transient workers', () => {
  let appSupervisor: AppSupervisor;
  let adapter: LegacyAdapter;
  let originalWorkerMode: string | undefined;
  let setAppStatusSpy: SpyInstance;

  beforeEach(() => {
    originalWorkerMode = process.env.WORKER_MODE;
    PluginMultiAppManagerServer.staticImport();
    appSupervisor = AppSupervisor.getInstance();
    adapter = appSupervisor.getDiscoveryAdapter() as LegacyAdapter;
    setAppStatusSpy = vi.spyOn(adapter, 'setAppStatus');
  });

  afterEach(async () => {
    if (originalWorkerMode === undefined) {
      delete process.env.WORKER_MODE;
    } else {
      process.env.WORKER_MODE = originalWorkerMode;
    }
    await appSupervisor.destroy();
    vi.restoreAllMocks();
  });

  it('should call setAppStatus when serving (default mode)', async () => {
    delete process.env.WORKER_MODE;

    await (adapter as any)._bootStrapApp('test-app');

    expect(setAppStatusSpy).toHaveBeenCalledWith('test-app', 'initializing');
    expect(setAppStatusSpy).toHaveBeenCalledWith('test-app', 'not_found');
  });

  it('should call setAppStatus when serving as dispatcher (!)', async () => {
    process.env.WORKER_MODE = '!';

    await (adapter as any)._bootStrapApp('test-app');

    expect(setAppStatusSpy).toHaveBeenCalledWith('test-app', 'initializing');
    expect(setAppStatusSpy).toHaveBeenCalledWith('test-app', 'not_found');
  });

  it('should call setAppStatus when non-serving worker (topic)', async () => {
    process.env.WORKER_MODE = 'topic';

    await (adapter as any)._bootStrapApp('test-app');

    expect(setAppStatusSpy).toHaveBeenCalledWith('test-app', 'initializing');
    expect(setAppStatusSpy).toHaveBeenCalledWith('test-app', 'not_found');
  });

  it('should NOT persist app status when transient (WORKER_MODE is "-")', async () => {
    process.env.WORKER_MODE = '-';

    await (adapter as any)._bootStrapApp('test-app');

    const status = await adapter.getAppStatus('test-app');
    expect(status).toBeNull();
  });

  it('should call setAppStatus when non-serving worker (*)', async () => {
    process.env.WORKER_MODE = '*';

    await (adapter as any)._bootStrapApp('test-app');

    expect(setAppStatusSpy).toHaveBeenCalledWith('test-app', 'initializing');
    expect(setAppStatusSpy).toHaveBeenCalledWith('test-app', 'not_found');
  });
});
