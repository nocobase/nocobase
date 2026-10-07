/**
 * Real Pi smoke test. PENDING: Pi is not installed on the machine this adapter
 * was written on, so it has never run; the adapter is tested against the
 * documented protocol only (see pi-fake.ts). Skipped unless NOCOBASE_RUNNER_PI_SMOKE=1;
 * needs `pi` (@earendil-works/pi-coding-agent >= 0.80.4) on PATH with a model
 * that has credentials, and spends a few cents. NOCOBASE_RUNNER_PI_MODEL picks the model.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { PiAdapter } from '../../src/agent/adapters/pi.ts';
import type { AdapterEvent } from '../../src/agent/adapters/types.ts';

const enabled = process.env.NOCOBASE_RUNNER_PI_SMOKE === '1';

function whitelistedEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const name of (
    process.env.NOCOBASE_RUNNER_SMOKE_ENV ??
    'PATH,HOME,USER,LANG,TERM,TMPDIR,ANTHROPIC_API_KEY,OPENAI_API_KEY'
  ).split(',')) {
    const value = process.env[name];
    if (value !== undefined) env[name] = value;
  }
  return env;
}

describe.skipIf(!enabled)('pi smoke (pending)', () => {
  it('writes a file, has rm denied and takes a steer', async () => {
    const adapter = new PiAdapter();
    const detection = await adapter.detect();
    expect(detection.installed).toBe(true);

    const workDir = await mkdtemp(
      path.join(tmpdir(), 'nocobase-runner-pi-smoke-'),
    );
    execFileSync('git', ['init', '-q'], { cwd: workDir });
    const handle = adapter.start({
      workDir,
      prompt:
        'Create hello.txt containing "hello" with the write tool, then run `rm hello.txt` with bash, then stop.',
      systemPrompt: 'Be brief.',
      ...(process.env.NOCOBASE_RUNNER_PI_MODEL
        ? { model: process.env.NOCOBASE_RUNNER_PI_MODEL }
        : {}),
      env: whitelistedEnv(),
      permission: (tool, input) =>
        Promise.resolve(
          tool === 'bash' && String(input.command).includes('rm')
            ? { deny: 'rm is not allowed' }
            : 'allow',
        ),
      abort: new AbortController().signal,
    });
    const events: AdapterEvent[] = [];
    for await (const event of handle.events) {
      events.push(event);
      if (event.type === 'toolUse' && event.tool === 'write')
        await handle.steer('Also create world.txt containing "world".', 'in-1');
    }
    const result = await handle.result;
    expect(result.exit).toBe('completed');
    expect(existsSync(path.join(workDir, 'hello.txt'))).toBe(true);
    expect(
      events.some(
        (e) => e.type === 'permission' && e.meta?.decision === 'deny',
      ),
    ).toBe(true);
    expect(events.some((e) => e.type === 'input')).toBe(true);
  }, 300_000);
});
