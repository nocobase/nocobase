import { watch } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  setTimeout as realTimeout,
  clearTimeout as clearRealTimeout,
} from 'node:timers';
import * as acp from '@agentclientprotocol/sdk';
import { expect, it, vi } from 'vitest';
import { AgentProcess } from '../src/agent-process.js';

/** The marker is written only after the fixture has installed its SIGTERM handler. */
function ready(file: string): { value: Promise<number>; close: () => void } {
  let inspect = () => {};
  const watcher = watch(path.dirname(file), () => inspect());
  let timer: NodeJS.Timeout;
  const value = new Promise<number>((resolve, reject) => {
    timer = realTimeout(
      () => reject(new Error('Fixture did not become ready')),
      5_000,
    );
    watcher.on('error', reject);
    inspect = () => {
      void readFile(file, 'utf8').then(
        (text) => {
          if (Number(text)) resolve(Number(text));
        },
        () => {},
      );
    };
    inspect();
  });
  return {
    value,
    close: () => {
      clearRealTimeout(timer);
      watcher.close();
    },
  };
}

it.each(['timeout', 'stop', 'probe-timeout'])(
  'cancels background initialize on %s after a slow fixture is ready and reaps it',
  async (mode) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'probe-cleanup-'));
    const pidFile = path.join(root, 'pid');
    const controller = new AbortController();
    const handshake = ready(pidFile);
    // Pause only the parent's deadlines. The subprocess starts on its real clock.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const opening = AgentProcess.start(
      {
        spec: { id: 'fake', name: 'Fake', launchers: [], signIn: 'fake login' },
        command: process.execPath,
        args: [path.join(import.meta.dirname, 'fixtures/fake-agent.mjs')],
      },
      {
        cwd: root,
        env: {
          ...process.env,
          FAKE_HANG_INITIALIZE: '1',
          FAKE_PID_FILE: pidFile,
          FAKE_START_DELAY_MS: '700',
        },
        client: { name: 'test', version: '0.0.0' },
        signal: controller.signal,
        initializeTimeoutMs: mode === 'probe-timeout' ? 300_000 : 500,
        handlers: {
          update: () => {},
          permission: async () => ({ outcome: { outcome: 'cancelled' } }),
        },
      },
    );
    const failed = opening.catch((error: unknown) => error);
    try {
      const pid = await handshake.value;
      handshake.close();
      expect(() => process.kill(pid, 0)).not.toThrow();
      if (mode === 'probe-timeout') {
        await vi.advanceTimersByTimeAsync(35_000);
        expect(() => process.kill(pid, 0)).not.toThrow();
        await vi.advanceTimersByTimeAsync(265_000);
      } else if (mode === 'stop') controller.abort();
      else await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(3_000);
      const error = await failed;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(
        mode === 'stop' ? 'cancelled' : 'did not answer within',
      );
      expect(() => process.kill(pid, 0)).toThrow();
    } finally {
      controller.abort();
      handshake.close();
      await vi.runAllTimersAsync();
      const result = await failed;
      if (result instanceof AgentProcess) {
        const stopping = result.stop();
        await vi.runAllTimersAsync();
        await stopping;
      }
      vi.useRealTimers();
      await rm(root, { recursive: true, force: true });
    }
  },
  10_000,
);

async function running(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0);
    // Linux can retain a killed orphan as a zombie until the host reaper collects it.
    if (process.platform === 'linux') {
      const stat = await readFile(`/proc/${pid}/stat`, 'utf8');
      return stat.slice(stat.lastIndexOf(')') + 2).split(' ')[0] !== 'Z';
    }
    return true;
  } catch {
    return false;
  }
}

it.skipIf(process.platform === 'win32').each(['on-stop', 'before-stop'])(
  'kills descendants when the launcher exits %s without touching another session group',
  async (mode) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'probe-tree-'));
    let probe: AgentProcess | undefined;
    let active: AgentProcess | undefined;
    let descendant: number | undefined;
    const options = {
      cwd: root,
      env: process.env,
      client: { name: 'test', version: '0.0.0' },
      initializeTimeoutMs: 30_000,
      handlers: {
        update: () => {},
        permission: async () => ({
          outcome: { outcome: 'cancelled' as const },
        }),
      },
    };
    const spec = {
      id: 'fake',
      name: 'Fake',
      launchers: [],
      signIn: 'fake login',
    };
    try {
      active = await AgentProcess.start(
        {
          spec,
          command: process.execPath,
          args: [path.join(import.meta.dirname, 'fixtures/fake-agent.mjs')],
        },
        options,
      );
      const marker = path.join(root, 'descendant-pid');
      probe = await AgentProcess.start(
        {
          spec,
          command: process.execPath,
          args: [path.join(import.meta.dirname, 'fixtures/probe-tree.mjs')],
        },
        {
          ...options,
          env: {
            ...process.env,
            PROBE_CHILD_PID: marker,
            ...(mode === 'before-stop' ? { PROBE_PARENT_EARLY_EXIT: '1' } : {}),
          },
        },
      );
      descendant = Number(await readFile(marker, 'utf8'));
      expect(await running(descendant)).toBe(true);
      if (mode === 'before-stop')
        await expect.poll(() => probe!.alive).toBe(false);
      const started = performance.now();
      await probe.stop();
      expect(performance.now() - started).toBeLessThan(4_000);
      await expect.poll(() => running(descendant!)).toBe(false);
      expect(active.alive).toBe(true);
      // Another isolated process remains able to answer ACP, not merely present in the process table.
      const response = await active.agent.request('session/new', {
        cwd: root,
        mcpServers: [],
      });
      expect(response.sessionId).toBe('s-1');
    } finally {
      await Promise.all([probe?.stop(), active?.stop()]);
      if (descendant && (await running(descendant)))
        process.kill(descendant, 'SIGKILL');
      await rm(root, { recursive: true, force: true });
    }
  },
  15_000,
);

it('runs the agent with the environment its launcher adds, over the agent’s own', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'launcher-env-'));
  const log = path.join(root, 'trace');
  try {
    const agent = await AgentProcess.start(
      {
        spec: {
          id: 'fake',
          name: 'Fake',
          launchers: [],
          signIn: 'fake login',
          env: { FAKE_LOG: path.join(root, 'ignored') },
        },
        command: process.execPath,
        args: [path.join(import.meta.dirname, 'fixtures/fake-agent.mjs')],
        env: { FAKE_LOG: log },
      },
      {
        cwd: root,
        env: process.env,
        client: { name: 'test', version: '0.0.0' },
        handlers: {
          update: () => {},
          permission: async () => ({ outcome: { outcome: 'cancelled' } }),
        },
      },
    );
    await agent.agent.request(acp.methods.agent.session.new, {
      cwd: root,
      mcpServers: [],
    });
    await agent.stop();
    expect(await readFile(log, 'utf8')).toContain('"method":"new"');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
