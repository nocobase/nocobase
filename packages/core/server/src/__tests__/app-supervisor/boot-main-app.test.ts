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

describe('AppSupervisor bootMainApp behavior in worker mode', () => {
  let supervisor: AppSupervisor;
  let originalWorkerMode: string | undefined;
  let registerEnvironmentSpy: any;
  let unregisterEnvironmentSpy: any;

  beforeEach(() => {
    originalWorkerMode = process.env.WORKER_MODE;
    supervisor = AppSupervisor.getInstance();

    // Use original code but stub out DB/Logger initialization to avoid environment issues (like missing sqlite3)
    vi.spyOn(Application.prototype as any, 'init').mockImplementation(function (this: any) {
      this.syncMessageManager = {
        subscribe: vi.fn().mockResolvedValue(undefined),
        publish: vi.fn().mockResolvedValue(undefined),
      };
    });
    vi.spyOn(Application.prototype, 'log', 'get').mockReturnValue({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    } as any);
    // Stub out createCLI as it might be called during app construction/init
    vi.spyOn(Application.prototype as any, 'createCLI').mockReturnValue({});

    registerEnvironmentSpy = vi.spyOn(supervisor, 'registerEnvironment').mockResolvedValue(undefined);
    unregisterEnvironmentSpy = vi.spyOn(supervisor, 'unregisterEnvironment').mockResolvedValue(undefined);
  });

  afterEach(async () => {
    if (originalWorkerMode === undefined) {
      delete process.env.WORKER_MODE;
    } else {
      process.env.WORKER_MODE = originalWorkerMode;
    }
    (AppSupervisor as any).instance = null;
    vi.restoreAllMocks();
  });

  it('should skip everything when transient (WORKER_MODE is "-")', async () => {
    process.env.WORKER_MODE = '-';

    const mainApp = supervisor.bootMainApp({});
    const subscribeSpy = mainApp.syncMessageManager.subscribe;

    await mainApp.emitAsync('afterStart', mainApp);

    expect(subscribeSpy).not.toHaveBeenCalled();
    expect(registerEnvironmentSpy).not.toHaveBeenCalled();

    await mainApp.emitAsync('afterDestroy', mainApp);
    expect(unregisterEnvironmentSpy).not.toHaveBeenCalled();
  });

  it('should subscribe and register environment when non-serving worker (e.g., topic)', async () => {
    process.env.WORKER_MODE = 'topic';

    const mainApp = supervisor.bootMainApp({});
    const subscribeSpy = mainApp.syncMessageManager.subscribe;

    await mainApp.emitAsync('afterStart', mainApp);

    expect(subscribeSpy).toHaveBeenCalledWith('app_supervisor:sync', expect.any(Function));
    expect(registerEnvironmentSpy).toHaveBeenCalled();

    await mainApp.emitAsync('afterDestroy', mainApp);
    expect(unregisterEnvironmentSpy).toHaveBeenCalled();
  });

  it('should subscribe and register environment when serving (e.g., dispatcher)', async () => {
    process.env.WORKER_MODE = '!';

    const mainApp = supervisor.bootMainApp({});
    const subscribeSpy = mainApp.syncMessageManager.subscribe;

    await mainApp.emitAsync('afterStart', mainApp);

    expect(subscribeSpy).toHaveBeenCalledWith('app_supervisor:sync', expect.any(Function));
    expect(registerEnvironmentSpy).toHaveBeenCalled();

    await mainApp.emitAsync('afterDestroy', mainApp);
    expect(unregisterEnvironmentSpy).toHaveBeenCalled();
  });
});
