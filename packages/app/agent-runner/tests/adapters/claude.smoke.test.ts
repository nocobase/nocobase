/**
 * Real Claude Code smoke test. Skipped unless NOCOBASE_RUNNER_CLAUDE_SMOKE=1; needs a
 * logged-in `claude` and spends a few cents. With NOCOBASE_RUNNER_CLAUDE_RECORD=<dir>
 * it also writes the raw SDK messages of each run there; sanitize paths,
 * ids, signatures and account details before committing one as a fixture.
 * The tool environment is the runner's whitelist; on macOS it must include
 * USER, or Claude Code cannot read its keychain login ("Not logged in").
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { describe, expect, it, vi } from 'vitest';

import { ClaudeAdapter } from '../../src/agent/adapters/claude.ts';
import type {
  AdapterEvent,
  AdapterHandle,
  AdapterSession,
} from '../../src/agent/adapters/types.ts';

const recorded: SDKMessage[][] = [];

vi.mock('@anthropic-ai/claude-agent-sdk', async (importOriginal) => {
  const real =
    await importOriginal<typeof import('@anthropic-ai/claude-agent-sdk')>();
  return {
    ...real,
    query: (args: Parameters<typeof real.query>[0]) => {
      const q = real.query(args);
      const log: SDKMessage[] = [];
      recorded.push(log);
      const wrapped = (async function* () {
        for await (const message of q) {
          log.push(message);
          yield message;
        }
      })();
      return Object.assign(wrapped, { close: () => q.close() });
    },
  };
});

const enabled = process.env.NOCOBASE_RUNNER_CLAUDE_SMOKE === '1';
const MODEL = process.env.NOCOBASE_RUNNER_CLAUDE_MODEL ?? 'haiku';

async function repo(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-smoke-'));
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

function sessionFor(
  workDir: string,
  prompt: string,
  overrides: Partial<AdapterSession> = {},
): AdapterSession {
  return {
    workDir,
    prompt,
    systemPrompt: 'You are a Acme test agent. Keep answers to one sentence.',
    model: MODEL,
    env: whitelistedEnv(),
    permission: async (tool, input) => {
      const command = typeof input.command === 'string' ? input.command : '';
      if (tool === 'Bash' && /^\s*rm\b/.test(command))
        return { deny: 'rm is not allowed in this run' };
      return 'allow';
    },
    abort: new AbortController().signal,
    maxTurns: 20,
    ...overrides,
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
  const dir = process.env.NOCOBASE_RUNNER_CLAUDE_RECORD;
  if (dir)
    await writeFile(
      path.join(dir, `${name}.raw.json`),
      JSON.stringify(recorded.at(-1), null, 2),
    );
}

describe.skipIf(!enabled)('claude adapter against a real Claude Code', () => {
  const adapter = new ClaudeAdapter();

  it('detects the installed claude', async () => {
    const detection = await adapter.detect();
    console.log('detect', {
      ...detection,
      path: detection.path ? '<path>' : undefined,
    });
    console.log('executable', await adapter.resolveExecutable());
    expect(detection.authenticated).toBe(true);
  });

  it('creates a file, is denied rm, and takes a steer between tool calls', async () => {
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
    await save('create-file');
    console.log(
      events
        .map(
          (e) =>
            `${e.type}${e.tool ? `:${e.tool}` : ''}${e.content ? ` ${e.content.slice(0, 60)}` : ''}`,
        )
        .join('\n'),
    );
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
  }, 240_000);

  it('stops within five seconds', async () => {
    const workDir = await repo();
    const handle = adapter.start(
      sessionFor(
        workDir,
        'Run the shell command `node -e "setTimeout(() => {}, 60000)"` in the foreground, then reply "done".',
      ),
    );
    let stopAt = 0;
    const drained = drain(handle, (event) => {
      if (event.type === 'toolUse' && !stopAt) {
        stopAt = Date.now();
        void handle.stop();
      }
    });
    await drained;
    const result = await handle.result;
    const elapsed = Date.now() - stopAt;
    await save('stop');
    console.log('stop took', elapsed, 'ms');
    expect(result.exit).toBe('aborted');
    expect(elapsed).toBeLessThan(5000);
  }, 120_000);
});
