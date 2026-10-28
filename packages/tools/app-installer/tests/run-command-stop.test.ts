import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installInterruptHandlers } from '../src/lib/interrupt.ts';
import { CommandFailedError, runCommand } from '../src/lib/run-command.ts';

const mocks = vi.hoisted(() => ({ spawn: vi.fn(), execFile: vi.fn() }));
vi.mock('node:child_process', () => mocks);

let child: EventEmitter & {
  pid: number | undefined;
  stdout: PassThrough;
  stderr: PassThrough;
  unref: ReturnType<typeof vi.fn>;
};
let states: string;
let checkError: Error | null;
let signalError: Error | null;
let gone: boolean;
let killStops: boolean;

beforeEach(() => {
  vi.useFakeTimers();
  child = Object.assign(new EventEmitter(), {
    pid: 123456,
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    unref: vi.fn(),
  });
  states = '123456 S\n';
  checkError = null;
  signalError = null;
  gone = false;
  killStops = true;
  mocks.spawn.mockReturnValue(child);
  mocks.execFile.mockImplementation(
    (
      _command,
      _args,
      _options,
      callback: (error: Error | null, stdout: string) => void,
    ) => {
      callback(checkError, states);
    },
  );
  vi.spyOn(process, 'kill').mockImplementation((_pid, signal) => {
    if (gone)
      throw Object.assign(new Error('No such process'), { code: 'ESRCH' });
    if (signal !== 0 && signalError) throw signalError;
    if (signal === 'SIGKILL' && killStops) states = '123456 Z\n';
    return true;
  });
});

afterEach(() => {
  child.stdout.destroy();
  child.stderr.destroy();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.useRealTimers();
});

function start() {
  let settled = false;
  const result = runCommand('build', [], { timeoutMs: 100 }).catch(
    (error: unknown) => {
      settled = true;
      return error;
    },
  );
  return { result, settled: () => settled };
}

describe('runCommand stop races and bounds', () => {
  it('returns normal output immediately without process checks or a grace wait', async () => {
    const pending = runCommand('build', []);
    child.stdout.write('output');
    child.stderr.write('warning');
    child.emit('close', 0);
    await expect(pending).resolves.toEqual({
      stdout: 'output',
      stderr: 'warning',
    });
    expect(mocks.execFile).not.toHaveBeenCalled();
    expect(process.kill).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves spawn errors and nonzero exit output', async () => {
    const missing = runCommand('missing', []).catch((error: unknown) => error);
    child.pid = undefined;
    const error = Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' });
    child.emit('error', error);
    child.emit('close', -2);
    expect(await missing).toBe(error);
    const failed = runCommand('build', []).catch((error: unknown) => error);
    child.stdout.write('out');
    child.stderr.write('err');
    child.emit('close', 7);
    expect(await failed).toMatchObject({
      exitCode: 7,
      stdout: 'out',
      stderr: 'err',
    });
  });

  it('accepts ESRCH when the group disappears before TERM or a check', async () => {
    const pending = start();
    gone = true;
    await vi.advanceTimersByTimeAsync(100);
    child.emit('close', null);
    await vi.advanceTimersByTimeAsync(50);
    expect(await pending.result).toBeInstanceOf(CommandFailedError);
    expect(mocks.execFile).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('accepts unreaped zombies while ignoring live processes in other groups', async () => {
    const pending = start();
    states = ' 123456 Z+\n 123456 Zs\n 987654 R+\n';
    await vi.advanceTimersByTimeAsync(100);
    child.emit('close', null);
    await vi.advanceTimersByTimeAsync(50);
    expect(await pending.result).toMatchObject({
      message: expect.stringContaining('timed out'),
    });
    expect(process.kill).not.toHaveBeenCalledWith(-123456, 'SIGKILL');
  });

  it('accepts a group disappearing immediately before the KILL escalation', async () => {
    const pending = start();
    await vi.advanceTimersByTimeAsync(100);
    child.emit('close', null);
    await vi.advanceTimersByTimeAsync(9999);
    gone = true;
    await vi.advanceTimersByTimeAsync(51);
    expect(await pending.result).toMatchObject({
      message: expect.not.stringContaining('Could not confirm'),
    });
    expect(process.kill).toHaveBeenCalledWith(-123456, 'SIGKILL');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not restart checks when an in-flight observation finishes after the deadline', async () => {
    mocks.execFile.mockImplementation(() => {});
    const pending = start();
    await vi.advanceTimersByTimeAsync(100);
    child.emit('close', null);
    await vi.advanceTimersByTimeAsync(12_000);
    expect(await pending.result).toMatchObject({
      message: expect.stringContaining('Could not confirm'),
    });
    const callback = mocks.execFile.mock.lastCall![3] as (
      error: null,
      stdout: string,
    ) => void;
    callback(null, '123456 S\n');
    await vi.advanceTimersByTimeAsync(50);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['R', 'S', 'T', 'D'])(
    'keeps KILL armed after direct close while a descendant is %s',
    async (state) => {
      const pending = start();
      states = `123456 ${state}\n`;
      await vi.advanceTimersByTimeAsync(100);
      child.emit('close', null);
      await vi.advanceTimersByTimeAsync(9999);
      expect(pending.settled()).toBe(false);
      await vi.advanceTimersByTimeAsync(51);
      expect(await pending.result).toMatchObject({
        message: expect.stringContaining('timed out'),
      });
      expect(process.kill).toHaveBeenCalledWith(-123456, 'SIGKILL');
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it('tolerates a TERM error if KILL subsequently proves the group stopped', async () => {
    const pending = start();
    signalError = Object.assign(new Error('Operation not permitted'), {
      code: 'EPERM',
    });
    await vi.advanceTimersByTimeAsync(100);
    signalError = null;
    child.emit('close', null);
    await vi.advanceTimersByTimeAsync(10_050);
    expect(await pending.result).toMatchObject({
      message: expect.not.stringContaining('Could not confirm'),
    });
  });

  it.each(['signal', 'check', 'live', 'pipes'])(
    'reports an unconfirmed stop within the deadline: %s',
    async (failure) => {
      const pending = start();
      if (failure === 'signal')
        signalError = Object.assign(new Error('Operation not permitted'), {
          code: 'EPERM',
        });
      if (failure === 'check') checkError = new Error('ps unavailable');
      if (failure === 'live') killStops = false;
      await vi.advanceTimersByTimeAsync(100);
      if (failure !== 'pipes') child.emit('close', null);
      await vi.advanceTimersByTimeAsync(12_000);
      expect(await pending.result).toMatchObject({
        message: expect.stringContaining('Could not confirm'),
      });
      expect(child.unref).toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it('keeps interrupt semantics when stopping cannot be confirmed', async () => {
    const remove = installInterruptHandlers({
      write: () => true,
    } as unknown as NodeJS.WritableStream);
    try {
      const pending = start();
      signalError = new Error('Operation not permitted');
      process.emit('SIGINT', 'SIGINT');
      child.emit('close', null);
      await vi.advanceTimersByTimeAsync(12_000);
      expect(await pending.result).toMatchObject({
        code: 'INTERRUPTED',
        message: expect.stringContaining('Could not confirm'),
      });
      const recovery = runCommand('recovery', []);
      child.emit('close', 0);
      await expect(recovery).resolves.toBeDefined();
    } finally {
      remove();
    }
  });
});
