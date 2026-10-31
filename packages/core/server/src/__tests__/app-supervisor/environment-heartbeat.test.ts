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

describe('environment heartbeat lifecycle', () => {
  let supervisor: AppSupervisor;
  const mainApp = { getPackageVersion: () => '2.0.0' } as Application;
  const heartbeat = vi.fn<[], Promise<void>>();
  const unregister = vi.fn();
  const dispose = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    supervisor = AppSupervisor.getInstance();
    heartbeat.mockReset().mockResolvedValue(undefined);
    unregister.mockReset();
    dispose.mockReset();
    Object.assign(supervisor.getDiscoveryAdapter(), {
      environmentName: 'web',
      heartbeatEnvironment: heartbeat,
      unregisterEnvironment: unregister,
      dispose,
      getEnvironment: vi.fn().mockResolvedValue({ name: 'web', lastHeartbeatAt: Date.now() }),
    });
  });

  afterEach(async () => {
    await supervisor.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('marks retained environments offline after five minutes without a heartbeat', async () => {
    await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
    expect(await supervisor.getEnvironment('web')).toMatchObject({ available: true });
    await vi.advanceTimersByTimeAsync(60 * 1000);
    expect(await supervisor.getEnvironment('web')).toMatchObject({ available: true });
    await vi.advanceTimersByTimeAsync(1);
    expect(await supervisor.getEnvironment('web')).toMatchObject({ name: 'web', available: false });
  });

  it('passes fresh complete environment information for registration and heartbeat', async () => {
    const adapter = supervisor.getDiscoveryAdapter();
    const register = vi.fn().mockResolvedValue(true);
    Object.assign(adapter, { registerEnvironment: register, environmentUrl: 'https://old.example' });
    await supervisor.registerEnvironment(mainApp);
    expect(register).toHaveBeenCalledWith({
      name: 'web',
      url: 'https://old.example',
      proxyUrl: 'https://old.example',
      appVersion: '2.0.0',
      lastHeartbeatAt: Date.now(),
    });
    Object.assign(adapter, { environmentUrl: 'https://new.example' });
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    expect(heartbeat).toHaveBeenCalledWith({
      name: 'web',
      url: 'https://new.example',
      proxyUrl: 'https://new.example',
      appVersion: '2.0.0',
      lastHeartbeatAt: Date.now(),
    });
  });

  it('stops the timer on unregister and allows registration to restart it', async () => {
    await supervisor.heartbeatEnvironment(mainApp);
    await supervisor.heartbeatEnvironment(mainApp);
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    expect(heartbeat).toHaveBeenCalledTimes(1);
    await supervisor.unregisterEnvironment();
    await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
    expect(heartbeat).toHaveBeenCalledTimes(1);
    expect(unregister).toHaveBeenCalledTimes(1);
    await supervisor.heartbeatEnvironment(mainApp);
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    expect(heartbeat).toHaveBeenCalledTimes(2);
  });

  it('retries on the next tick after a failed heartbeat', async () => {
    const error = new Error('connection interrupted');
    const log = vi.spyOn(supervisor.logger, 'error').mockImplementation(() => supervisor.logger);
    heartbeat.mockRejectedValueOnce(error);
    await supervisor.heartbeatEnvironment(mainApp);
    await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
    expect(heartbeat).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith(error.message, { method: 'heartbeatEnvironment' });
  });

  it.each(['reset', 'unregisterEnvironment'] as const)(
    'stops future heartbeats without waiting during %s',
    async (method) => {
      let finish: () => void = () => {};
      heartbeat.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      );
      await supervisor.heartbeatEnvironment(mainApp);
      await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
      expect(heartbeat).toHaveBeenCalledTimes(1);
      await supervisor[method]();
      await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
      expect(heartbeat).toHaveBeenCalledTimes(1);
      expect(method === 'reset' ? dispose : unregister).toHaveBeenCalledTimes(1);
      finish();
    },
  );
});
