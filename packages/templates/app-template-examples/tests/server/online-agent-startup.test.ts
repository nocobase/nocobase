import { randomBytes } from 'node:crypto';
import { fork } from 'node:child_process';
import path from 'node:path';
import { createTestAppConfig } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';
import type { AppUIMessage } from '@nocobase/app-plugin-agents/shared/online-agent';
import { validateAppUIMessages } from '@nocobase/app-plugin-agents/shared/online-agent';

type Snapshot = {
  conversations: {
    id: string;
    lastSeq: number;
    metadata: {
      onlineAgent: { call: Record<string, unknown> };
      runnerOnlineAgent?: unknown;
    };
  }[];
  messages: { content: { original: AppUIMessage } }[];
};
type Report = { phase: string; pid: number; first: Snapshot; second: Snapshot };

it('recovers native UI messages through two non-overlapping complete application processes', async () => {
  const config = await createTestAppConfig({
    connections: ['main', 'analytics'],
    config: {
      app: { publicOrigin: 'http://localhost' },
      auth: { secret: randomBytes(32).toString('hex') },
      secrets: { keys: [{ version: 1, key: randomBytes(32).toString('hex') }] },
      agents: { vectors: { store: false } },
    },
  });
  const worker = path.resolve(
    import.meta.dirname,
    '../fixtures/online-agent-startup-process.ts',
  );
  const processes: ReturnType<typeof fork>[] = [];
  const launch = (phase: string) => {
    const child = fork(worker, [], {
      execArgv: ['--experimental-import-meta-resolve', '--import', 'tsx'],
      env: {
        ...process.env,
        PM481_STARTUP_PHASE: phase,
        PM481_STARTUP_CONFIG: config.path,
        PM481_STARTUP_STORAGE: path.join(config.directory, 'storage'),
      },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });
    processes.push(child);
    let errors = '';
    child.stderr?.on('data', (chunk) => {
      errors += String(chunk);
    });
    child.stdout?.resume();
    const exited = new Promise<void>((resolve, reject) =>
      child.once('exit', (code, signal) =>
        code === 0 || signal === 'SIGKILL'
          ? resolve()
          : reject(new Error(errors || `Worker exited: ${code}`)),
      ),
    );
    const message = new Promise<Report>((resolve, reject) => {
      child.once('message', (value) => resolve(value as Report));
      child.once('error', reject);
      void exited.then(
        () => reject(new Error(errors || 'Worker exited before reporting')),
        reject,
      );
    });
    return { child, exited, message };
  };
  try {
    const old = launch('prepare');
    const prepared = await old.message;
    expect(prepared.phase).toBe('prepared');
    old.child.kill('SIGKILL');
    await old.exited;
    expect(old.child.exitCode !== null || old.child.signalCode).toBeTruthy();
    const next = launch('recover');
    const recovered = await next.message;
    await next.exited;
    expect(recovered.pid).not.toBe(prepared.pid);
    expect(recovered.first).toEqual(recovered.second);
    const rows = recovered.first.conversations;
    const call = (id: string) =>
      rows.find((row) => row.id === id).metadata.onlineAgent.call;
    expect(call('unfinished')).toMatchObject({
      state: 'idle',
      outcome: 'failed',
      revision: 1,
    });
    expect(call('saved')).toMatchObject({
      state: 'idle',
      outcome: 'completed',
    });
    expect(call('saved').closing).toBeUndefined();
    expect(call('background')).toMatchObject({
      state: 'idle',
      outcome: 'completed',
      result: { count: 7 },
    });
    expect(call('approval')).toMatchObject({
      state: 'waitingApproval',
      messageId: 'approval-answer',
    });
    expect(rows.find((row) => row.id === 'runner').metadata).toEqual({
      runnerOnlineAgent: { version: 1, closingRunId: 'fixture-run' },
    });
    const saved = recovered.first.messages;
    expect(saved).toHaveLength(8);
    expect(rows.find((row) => row.id === 'unfinished').lastSeq).toBe(2);
    expect(rows.find((row) => row.id === 'saved').lastSeq).toBe(2);
    expect(rows.find((row) => row.id === 'approval').lastSeq).toBe(2);
    expect(rows.find((row) => row.id === 'background').lastSeq).toBe(2);
    const ui = await validateAppUIMessages(
      saved.map((row) => row.content.original),
    );
    expect(
      ui.find((message) => message.id === 'unfinished-answer')?.parts,
    ).toEqual([
      expect.objectContaining({
        type: 'data-notice',
        data: expect.objectContaining({ type: 'failed' }),
      }),
    ]);
    expect(ui.find((message) => message.id === 'saved-answer')?.parts).toEqual([
      { type: 'text', text: 'Saved answer', state: 'done' },
    ]);
    expect(
      ui.find((message) => message.id === 'approval-answer')?.metadata
        ?.revision,
    ).toBe(1);
  } finally {
    for (const child of processes)
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
        await new Promise((resolve) => child.once('exit', resolve));
      }
    await config.dispose();
  }
}, 120_000);
