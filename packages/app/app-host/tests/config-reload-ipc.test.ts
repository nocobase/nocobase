import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';
import { expect, it, vi } from 'vitest';
import {
  IpcHostManagementClient,
  IpcHostManagementServer,
  type HostManagementService,
} from '../dist/management/index.js';

it('keeps listening for completion after a deployment is accepted', async () => {
  const child = new EventEmitter() as ChildProcess;
  Object.defineProperty(child, 'connected', { value: true });
  let complete: (() => void) | undefined;
  child.send = ((
    message: Record<string, unknown>,
    callback: (error: Error | null) => void,
  ) => {
    callback(null);
    child.emit('message', { ...message, kind: 'response', accepted: true });
    complete = () =>
      child.emit('message', {
        ...message,
        kind: 'response',
        result: { deployments: [] },
      });
    return true;
  }) as ChildProcess['send'];
  const client = new IpcHostManagementClient(child, {
    session: 'test',
    timeoutMs: 5,
  });
  const pending = client.applyDeployment({ id: 'app', appId: 'app' } as never);
  await new Promise((resolve) => setTimeout(resolve, 20));
  complete?.();
  await expect(pending).resolves.toEqual({ deployments: [] });
  expect(child.listenerCount('message')).toBe(0);
});

it('routes configuration reload through IPC and propagates results and errors', async () => {
  const child = new EventEmitter() as ChildProcess;
  Object.defineProperty(child, 'connected', { value: true });
  child.send = ((message: unknown, callback: (error: Error | null) => void) => {
    process.emit('message', message as never, undefined);
    callback(null);
    return true;
  }) as ChildProcess['send'];
  const originalSend = Object.getOwnPropertyDescriptor(process, 'send');
  Object.defineProperty(process, 'send', {
    configurable: true,
    value: (message: unknown) => child.emit('message', message),
  });
  const reloadAppConfig = vi
    .fn<HostManagementService['reloadAppConfig']>()
    .mockResolvedValueOnce({ changedNamespaces: ['feature'] })
    .mockResolvedValueOnce(null)
    .mockRejectedValueOnce(new Error('Configuration validation failed'));
  const server = new IpcHostManagementServer(
    { reloadAppConfig } as HostManagementService,
    'test',
  );
  const client = new IpcHostManagementClient(child, { session: 'test' });
  try {
    server.attach();
    await expect(client.reloadAppConfig('customer')).resolves.toEqual({
      changedNamespaces: ['feature'],
    });
    await expect(client.reloadAppConfig('customer')).resolves.toBeNull();
    await expect(client.reloadAppConfig('customer')).rejects.toThrow(
      'Configuration validation failed',
    );
    expect(reloadAppConfig).toHaveBeenNthCalledWith(1, 'customer');
    expect(child.listenerCount('message')).toBe(0);
  } finally {
    server.close();
    if (originalSend) Object.defineProperty(process, 'send', originalSend);
    else Reflect.deleteProperty(process, 'send');
  }
});

it('delivers ordered log events before completion and detaches on host exit', async () => {
  const child = new EventEmitter() as ChildProcess;
  Object.defineProperty(child, 'connected', { value: true });
  child.send = ((
    message: Record<string, unknown>,
    callback: (error: Error | null) => void,
  ) => {
    callback(null);
    child.emit('message', { ...message, kind: 'response', accepted: true });
    child.emit('message', {
      ...message,
      kind: 'response',
      log: {
        time: '2026-09-17',
        level: 'info',
        msg: 'Extracting',
        sequence: 1,
      },
    });
    child.emit('message', {
      ...message,
      kind: 'response',
      log: {
        time: '2026-09-17',
        level: 'error',
        msg: 'Failed',
        sequence: 2,
        err: { stack: 'original stack' },
      },
    });
    child.emit('exit', 1);
    return true;
  }) as ChildProcess['send'];
  const client = new IpcHostManagementClient(child, { session: 'test' });
  const entries: unknown[] = [];
  await expect(
    client.applyDeployment({ id: 'app', appId: 'app' } as never, (entry) =>
      entries.push(entry),
    ),
  ).rejects.toThrow('exited');
  expect(entries).toHaveLength(2);
  expect(entries[1]).toMatchObject({ err: { stack: 'original stack' } });
  expect(child.listenerCount('message')).toBe(0);
});

it('allows the complete request drain before the preparation RPC can time out', async () => {
  vi.useFakeTimers();
  const child = new EventEmitter() as ChildProcess;
  Object.defineProperty(child, 'connected', { value: true });
  let complete!: () => void;
  child.send = ((
    message: Record<string, unknown>,
    callback: (error: Error | null) => void,
  ) => {
    callback(null);
    complete = () =>
      child.emit('message', { ...message, kind: 'response', result: true });
    return true;
  }) as ChildProcess['send'];
  const client = new IpcHostManagementClient(child, {
    session: 'test',
    timeoutMs: 10,
  });
  try {
    const pending = client
      .prepareRotation({ ignoreConnections: true, drainTimeoutMs: 20 })
      .catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(20);
    complete();
    expect(await pending).toBe(true);
    expect(child.listenerCount('message')).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
