import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';
import { afterEach, expect, it, vi } from 'vitest';
import { AppHostSupervisor } from '../src/supervisor.js';

const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:child_process')>()),
  spawn,
}));

let supervisor: AppHostSupervisor | undefined;
const children: ChildProcess[] = [];
function childProcess(): ChildProcess {
  const child = Object.assign(new EventEmitter(), {
    pid: 100 + children.length,
    stdout: null,
    stderr: null,
    exitCode: null,
    signalCode: null,
    connected: false,
    kill: vi.fn(() => true),
  }) as unknown as ChildProcess;
  children.push(child);
  return child;
}
afterEach(async () => {
  for (const child of children) {
    child.kill = vi.fn((signal) => {
      child.emit('exit', null, signal);
      return true;
    });
  }
  await supervisor?.shutdown();
  supervisor = undefined;
  children.length = 0;
  vi.restoreAllMocks();
  spawn.mockReset();
});

it('waits for a killed child to exit before restarting or serving a concurrent acquire', async () => {
  spawn.mockImplementation(childProcess);
  supervisor = AppHostSupervisor.initialize({
    driver: 'node',
    mode: 'managed',
    entrypoint: import.meta.filename,
    shutdownTimeoutMs: 100,
  });
  // Health transport is independent of the process-exit ordering under test.
  vi.spyOn(
    supervisor as unknown as { waitForReady(url: URL): Promise<void> },
    'waitForReady',
  ).mockResolvedValue();
  await supervisor.ensureStarted();
  const old = children[0]!;
  const restart = supervisor.restart();
  const acquire = supervisor.acquire();
  await vi.waitFor(() => expect(old.kill).toHaveBeenCalledWith('SIGKILL'), {
    interval: 5,
  });
  expect(spawn).toHaveBeenCalledTimes(1);
  expect(supervisor.getInfo().status).toBe('stopping');

  old.emit('exit', null, 'SIGKILL');
  const [url, lease] = await Promise.all([restart, acquire]);
  expect(spawn).toHaveBeenCalledTimes(2);
  expect(lease.targetUrl).toEqual(url);
  expect(supervisor.getInfo()).toMatchObject({
    status: 'ready',
    pid: children[1]!.pid,
  });
  lease.release();
});
