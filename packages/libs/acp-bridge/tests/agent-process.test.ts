import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { AgentProcess } from '../src/agent-process.js';

it.each(['timeout', 'stop'])(
  'cancels background initialize on %s and reaps a process ignoring SIGTERM',
  async (mode) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'probe-cleanup-'));
    const pidFile = path.join(root, 'pid');
    const controller = new AbortController();
    const agent = {
      spec: { id: 'fake', name: 'Fake', launchers: [], signIn: 'fake login' },
      command: process.execPath,
      args: [path.join(import.meta.dirname, 'fixtures/fake-agent.mjs')],
    };
    try {
      const opening = AgentProcess.start(agent, {
        cwd: root,
        env: {
          ...process.env,
          FAKE_HANG_INITIALIZE: '1',
          FAKE_PID_FILE: pidFile,
        },
        client: { name: 'test', version: '0.0.0' },
        signal: controller.signal,
        initializeTimeoutMs: mode === 'timeout' ? 500 : 30_000,
        handlers: {
          update: () => {},
          permission: async () => ({ outcome: { outcome: 'cancelled' } }),
        },
      });
      const failed = opening.catch((error: unknown) => error);
      await expect
        .poll(async () => readFile(pidFile, 'utf8').catch(() => ''))
        .not.toBe('');
      const pid = Number(await readFile(pidFile, 'utf8'));
      if (mode === 'stop') controller.abort();
      expect(await failed).toBeInstanceOf(Error);
      expect(((await failed) as Error).message).toContain(
        mode === 'timeout' ? 'did not answer within' : 'cancelled',
      );
      expect(() => process.kill(pid, 0)).toThrow();
    } finally {
      controller.abort();
      await rm(root, { recursive: true, force: true });
    }
  },
  10_000,
);
