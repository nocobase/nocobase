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

describe('environment heartbeat lifecycle', () => {
  let supervisor: AppSupervisor;
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

  it('tolerates missed heartbeats for six minutes', async () => {
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000 + 1);
    expect(await supervisor.getEnvironment('web')).toMatchObject({ available: true });
    await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
    expect(await supervisor.getEnvironment('web')).toMatchObject({ available: false });
  });

  it('stops the timer on unregister and allows registration to restart it', async () => {
    await supervisor.heartbeatEnvironment();
    await supervisor.heartbeatEnvironment();
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    expect(heartbeat).toHaveBeenCalledTimes(1);
    await supervisor.unregisterEnvironment();
    await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
    expect(heartbeat).toHaveBeenCalledTimes(1);
    expect(unregister).toHaveBeenCalledTimes(1);
    await supervisor.heartbeatEnvironment();
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    expect(heartbeat).toHaveBeenCalledTimes(2);
  });

  it('retries on the next tick after a failed heartbeat', async () => {
    const error = new Error('connection interrupted');
    const log = vi.spyOn(supervisor.logger, 'error').mockImplementation(() => supervisor.logger);
    heartbeat.mockRejectedValueOnce(error);
    await supervisor.heartbeatEnvironment();
    await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
    expect(heartbeat).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith(error.message, { method: 'heartbeatEnvironment' });
  });

  it.each(['reset', 'unregisterEnvironment'] as const)('waits for an in-flight heartbeat before %s', async (method) => {
    let finish: () => void = () => {};
    heartbeat.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await supervisor.heartbeatEnvironment();
    await vi.advanceTimersByTimeAsync(4 * 60 * 1000);
    expect(heartbeat).toHaveBeenCalledTimes(1);
    const stopping = supervisor[method]();
    await Promise.resolve();
    expect(dispose).not.toHaveBeenCalled();
    expect(unregister).not.toHaveBeenCalled();
    finish();
    await stopping;
    await vi.advanceTimersByTimeAsync(6 * 60 * 1000);
    expect(heartbeat).toHaveBeenCalledTimes(1);
    expect(method === 'reset' ? dispose : unregister).toHaveBeenCalledTimes(1);
  });
});
