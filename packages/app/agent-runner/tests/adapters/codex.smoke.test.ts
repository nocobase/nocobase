/**
 * Real Codex smoke test. Skipped unless NOCOBASE_RUNNER_CODEX_SMOKE=1; needs a
 * logged-in `codex` (0.158.0 or newer) and spends a little quota. With
 * NOCOBASE_RUNNER_CODEX_RECORD=<dir> it also writes the raw app-server traffic of each
 * run there; sanitize paths, ids and account details before committing one
 * as a fixture.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { CodexAdapter } from '../../src/agent/adapters/codex.ts';
import { spawnCodexProcess } from '../../src/agent/adapters/codex/rpc.ts';
import type { SpawnCodex } from '../../src/agent/adapters/codex/rpc.ts';
import type {
  AdapterEvent,
  AdapterHandle,
  AdapterSession,
} from '../../src/agent/adapters/types.ts';
import type { TrafficLine } from './fake-codex.ts';

const enabled = process.env.NOCOBASE_RUNNER_CODEX_SMOKE === '1';
let traffic: TrafficLine[] = [];

const recordingSpawn: SpawnCodex = (options) => {
  const proc = spawnCodexProcess(options);
  const log = (from: TrafficLine['from'], line: string) => {
    try {
      traffic.push({
        from,
        message: JSON.parse(line) as TrafficLine['message'],
      });
    } catch {
      // not a message
    }
  };
  proc.onLine((line) => log('server', line));
  return {
    ...proc,
    send(line) {
      log('client', line);
      proc.send(line);
    },
  };
};

async function repo(): Promise<string> {
  const dir = await mkdtemp(
    path.join(tmpdir(), 'nocobase-runner-codex-smoke-'),
  );
  execFileSync('git', ['init', '-q'], { cwd: dir });
  return dir;
}

function whitelistedEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const name of (
    process.env.NOCOBASE_RUNNER_SMOKE_ENV ?? 'PATH,HOME,USER,LANG,TERM,TMPDIR'
  ).split(',')) {
    const value = process.env[name];
    if (value) env[name] = value;
  }
  return env;
}

function sessionFor(workDir: string, prompt: string): AdapterSession {
  return {
    workDir,
    prompt,
    systemPrompt: 'You are a Acme test agent. Keep answers to one sentence.',
    effort: 'low',
    env: whitelistedEnv(),
    permission: async (tool, input) => {
      const command = typeof input.command === 'string' ? input.command : '';
      if (tool === 'shell' && /^\s*rm\b/.test(command))
        return { deny: 'rm is not allowed in this run' };
      return 'allow';
    },
    abort: new AbortController().signal,
  };
}

async function drain(
  handle: AdapterHandle,
  onEvent?: (e: AdapterEvent) => void,
): Promise<AdapterEvent[]> {
  const events: AdapterEvent[] = [];
  for await (const event of handle.events) {
    events.push(event);
    onEvent?.(event);
  }
  return events;
}

async function save(name: string): Promise<void> {
  const dir = process.env.NOCOBASE_RUNNER_CODEX_RECORD;
  if (dir)
    await writeFile(
      path.join(dir, `${name}.raw.json`),
      JSON.stringify(traffic, null, 2),
    );
}

function print(events: AdapterEvent[]): void {
  console.log(
    events
      .map(
        (e) =>
          `${e.type}${e.tool ? `:${e.tool}` : ''}${e.content ? ` ${e.content.slice(0, 60)}` : ''}${e.meta?.decision ? ` ${String(e.meta.decision)}` : ''}`,
      )
      .join('\n'),
  );
}

describe.skipIf(!enabled)('codex adapter against a real Codex', () => {
  const adapter = new CodexAdapter({ spawn: recordingSpawn });

  it('detects the installed codex', async () => {
    const detection = await adapter.detect();
    console.log('detect', {
      ...detection,
      path: detection.path ? '<path>' : undefined,
    });
    expect(detection.installed).toBe(true);
    expect(detection.authenticated).toBe(true);
  });

  it('creates a file, is denied rm, and takes a steer', async () => {
    traffic = [];
    const workDir = await repo();
    const handle = adapter.start(
      sessionFor(
        workDir,
        [
          'Do these steps one at a time, one tool call per step:',
          '1. Create hello.txt containing exactly "hello".',
          '2. Run the shell command `rm -f nothing.tmp`.',
          '3. Run the shell command `ls`.',
          'Then reply "done".',
        ].join('\n'),
      ),
    );
    let steered: Promise<boolean> | undefined;
    const events = await drain(handle, (event) => {
      if (event.type === 'toolUse' && !steered) {
        steered = handle.steer(
          'Additional instruction: also create world.txt containing exactly "world".',
          'steer-1',
        );
      }
    });
    const result = await handle.result;
    await save('steer-deny');
    print(events);
    console.log('result', {
      ...result,
      sessionId: result.sessionId ? '<id>' : undefined,
    });

    expect(result.exit).toBe('completed');
    expect(await steered).toBe(true);
    expect(
      (await readFile(path.join(workDir, 'hello.txt'), 'utf8')).trim(),
    ).toBe('hello');
    expect(
      events.some(
        (e) => e.type === 'permission' && e.meta?.decision === 'deny',
      ),
    ).toBe(true);
    expect(
      events.some((e) => e.type === 'input' && e.meta?.inputId === 'steer-1'),
    ).toBe(true);
    expect(existsSync(path.join(workDir, 'world.txt'))).toBe(true);
    expect(result.usage.length).toBeGreaterThan(0);
  }, 300_000);

  it('stops within five seconds', async () => {
    traffic = [];
    const workDir = await repo();
    const handle = adapter.start(
      sessionFor(
        workDir,
        'Run the shell command `sleep 60` in the foreground, then reply "done".',
      ),
    );
    let stopAt = 0;
    const events = await drain(handle, (event) => {
      if (event.type === 'toolUse' && !stopAt) {
        stopAt = Date.now();
        void handle.stop();
      }
    });
    const result = await handle.result;
    const elapsed = Date.now() - stopAt;
    await save('stop');
    print(events);
    console.log('stop took', elapsed, 'ms');
    expect(result.exit).toBe('aborted');
    expect(elapsed).toBeLessThan(5000);
  }, 180_000);
});
