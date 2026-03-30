/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppSupervisor } from '../../app-supervisor';
import Application from '../../application';

// Stub out Application.prototype.init to avoid real DB/logger initialization
vi.spyOn(Application.prototype as any, 'init').mockImplementation(function (this: any) {
  this.reInitEvents();
});

describe('AppSupervisor sync messages in worker mode', () => {
  let supervisor: AppSupervisor;
  let originalWorkerMode: string | undefined;
  let sendSyncMessageSpy: ReturnType<typeof vi.spyOn>;
  const createdApps: Application[] = [];

  beforeEach(() => {
    originalWorkerMode = process.env.WORKER_MODE;
    supervisor = AppSupervisor.getInstance();
    sendSyncMessageSpy = vi.spyOn(supervisor, 'sendSyncMessage').mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (originalWorkerMode === undefined) {
      delete process.env.WORKER_MODE;
    } else {
      process.env.WORKER_MODE = originalWorkerMode;
    }
    sendSyncMessageSpy.mockRestore();
    // Clean up registered apps from supervisor
    for (const app of createdApps) {
      delete (supervisor as any).processAdapter?.apps?.[app.name];
    }
    createdApps.length = 0;
  });

  function registerTestApp(name: string) {
    const app = supervisor.registerApp({
      appModel: {
        name,
        options: { name, skipSupervisor: true },
      },
    });
    createdApps.push(app);
    return app;
  }

  it('should publish sync messages on sub-app lifecycle events when serving', async () => {
    delete process.env.WORKER_MODE;

    const app = registerTestApp('test-serving-app');

    await app.emitAsync('afterStart');
    expect(sendSyncMessageSpy).toHaveBeenCalledWith(undefined, {
      type: 'app:started',
      appName: 'test-serving-app',
    });

    sendSyncMessageSpy.mockClear();
    await app.emitAsync('afterStop');
    expect(sendSyncMessageSpy).toHaveBeenCalledWith(undefined, {
      type: 'app:stopped',
      appName: 'test-serving-app',
    });

    sendSyncMessageSpy.mockClear();
    await app.emitAsync('afterDestroy');
    expect(sendSyncMessageSpy).toHaveBeenCalledWith(undefined, {
      type: 'app:removed',
      appName: 'test-serving-app',
    });
  });

  it('should NOT publish sync messages on sub-app lifecycle events when WORKER_MODE is "-"', async () => {
    process.env.WORKER_MODE = '-';

    const app = registerTestApp('test-worker-app');

    await app.emitAsync('afterStart');
    await app.emitAsync('afterStop');
    await app.emitAsync('afterDestroy');

    expect(sendSyncMessageSpy).not.toHaveBeenCalled();
  });

  it('should NOT clearAppStatus on destroy when WORKER_MODE is "-"', async () => {
    process.env.WORKER_MODE = '-';

    const clearAppStatusSpy = vi.spyOn(supervisor, 'clearAppStatus').mockResolvedValue(undefined);
    const app = registerTestApp('test-clear-worker');

    supervisor.addApp(app);
    await app.emitAsync('afterDestroy');

    expect(clearAppStatusSpy).not.toHaveBeenCalled();
    clearAppStatusSpy.mockRestore();
  });

  it('should clearAppStatus on destroy when serving', async () => {
    delete process.env.WORKER_MODE;

    const clearAppStatusSpy = vi.spyOn(supervisor, 'clearAppStatus').mockResolvedValue(undefined);
    const app = registerTestApp('test-clear-serving');

    supervisor.addApp(app);
    await app.emitAsync('afterDestroy');

    expect(clearAppStatusSpy).toHaveBeenCalledWith('test-clear-serving');
    clearAppStatusSpy.mockRestore();
  });
});
