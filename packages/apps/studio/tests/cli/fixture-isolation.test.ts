// @vitest-environment node
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { runStudioCli } from '../fixtures/nb-studio-cli.js';

let directory: string | undefined;
afterEach(() => {
  vi.unstubAllEnvs();
  if (directory) rmSync(directory, { recursive: true, force: true });
});

describe('Studio CLI fixture isolation', () => {
  it('ignores surrounding runner discovery and inherited CLI identity', async () => {
    directory = mkdtempSync(path.join(tmpdir(), 'studio-cli-isolation-'));
    const cwd = path.join(directory, 'child');
    mkdirSync(cwd);
    mkdirSync(path.join(directory, '.nb-studio'));
    // A non-secret, invalid marker: accidentally discovering it must fail instead of authenticating anywhere.
    const marker = path.join(directory, '.nb-studio', 'run.json');
    writeFileSync(
      marker,
      'Not a credential; this marker must never be loaded.',
    );
    vi.stubEnv('AGENT_RUN_CREDENTIALS', marker);
    vi.stubEnv('NB_STUDIO_SERVER', 'https://fixture-must-not-contact.invalid');
    vi.stubEnv('NB_STUDIO_API_KEY', 'synthetic-test-only');
    const result = await runStudioCli(['whoami', '--json'], {
      cwd,
      env: { NB_STUDIO_HOME: path.join(cwd, '.home') },
    });
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout).error).toMatchObject({
      code: 'INVALID_USAGE',
      message: expect.stringContaining('Not signed in'),
    });
    expect(result.stderr).not.toContain('SyntaxError');
  });
});
