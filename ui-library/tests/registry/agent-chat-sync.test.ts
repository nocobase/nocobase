// @vitest-environment node
// The agent-chat block is generated from the agents plugin's panel; a stale copy fails here.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

const libraryRoot = fileURLToPath(new URL('../..', import.meta.url));

it('keeps registry/agents/agent-chat generated from the agents plugin', () => {
  let output = '';
  try {
    output = execFileSync(
      process.execPath,
      [path.join(libraryRoot, 'scripts/sync-agent-chat.mjs'), '--check'],
      { cwd: libraryRoot, encoding: 'utf8', stdio: 'pipe' },
    );
  } catch (error) {
    const { stderr, stdout } = error as {
      readonly stderr?: string;
      readonly stdout?: string;
    };
    expect.fail(`${stdout ?? ''}${stderr ?? ''}`);
  }
  expect(output).toContain('matches the agents plugin');
}, 60_000);
