import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { IPC_CHANNEL } from '../src/ipc-channel.ts';
import { waitForHostListening } from '../src/startup-handshake.ts';

const listening = {
  channel: IPC_CHANNEL,
  session: 'current',
  kind: 'listening',
  port: 23456,
};
function child(): ChildProcess {
  return new EventEmitter() as ChildProcess;
}

it('accepts only the current child session and removes listeners after readiness', async () => {
  const process = child();
  const ready = vi.fn();
  const pending = waitForHostListening(process, 'current', 1000).then(ready);
  process.emit('message', { ...listening, session: 'previous' });
  process.emit('message', { ...listening, channel: 'other' });
  process.emit('message', { ...listening, kind: 'response' });
  await Promise.resolve();
  expect(ready).not.toHaveBeenCalled();
  process.emit('message', listening);
  await pending;
  expect(ready).toHaveBeenCalledWith(23456);
  expect(process.eventNames()).toEqual([]);
});

it.each([0, -1, 65536, 2.5, '23456', undefined])(
  'rejects invalid port %s',
  async (port) => {
    const process = child();
    const pending = waitForHostListening(process, 'current', 1000);
    process.emit('message', { ...listening, port });
    await expect(pending).rejects.toThrow('invalid listening port');
    expect(process.eventNames()).toEqual([]);
  },
);

it.each(['exit', 'disconnect', 'error'])(
  'rejects promptly on child %s',
  async (event) => {
    const process = child();
    const pending = waitForHostListening(process, 'current', 1000);
    process.emit(event, new Error('spawn failed'));
    await expect(pending).rejects.toThrow();
    expect(process.eventNames()).toEqual([]);
  },
);

it('preserves a startup error code', async () => {
  const process = child();
  const pending = waitForHostListening(process, 'current', 1000);
  process.emit('message', {
    ...listening,
    kind: 'startup-error',
    code: 'EADDRINUSE',
  });
  await expect(pending).rejects.toMatchObject({ code: 'EADDRINUSE' });
  expect(process.eventNames()).toEqual([]);
});

it('bounds the handshake and removes listeners on timeout', async () => {
  vi.useFakeTimers();
  try {
    const process = child();
    const pending = waitForHostListening(process, 'current', 1000).catch(
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toMatchObject({
      message: expect.stringContaining('within 1000ms'),
    });
    expect(process.eventNames()).toEqual([]);
  } finally {
    vi.useRealTimers();
  }
});
