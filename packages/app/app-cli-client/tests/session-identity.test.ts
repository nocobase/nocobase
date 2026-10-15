import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';

import { appCliPaths } from '../src/config.ts';
import { currentSession } from '../src/dynamic/session.ts';
import { saveUserConfig } from '../src/lib/credentials.ts';
import { extractGlobalFlags, setGlobalFlags } from '../src/lib/globals.ts';
import { removeDir, tempDir, TEST_CLI } from './helpers.ts';

const config = { ...TEST_CLI, envPrefix: 'ACME' };
let home: string | undefined;
afterEach(() => {
  vi.unstubAllEnvs();
  setGlobalFlags(extractGlobalFlags([]).flags);
  if (home) removeDir(home);
});

it('uses the selected profile before inspecting a run file and sends the session context', async () => {
  home = tempDir();
  const paths = appCliPaths(home);
  await saveUserConfig('https://owner.example', 'test-owner-key', {
    paths,
    config,
    profile: 'owner',
    store: undefined,
    env: {},
  });
  const runFile = path.join(home, 'unread-run.json');
  writeFileSync(runFile, 'This is deliberately not a credentials document.');
  vi.stubEnv('AGENT_RUN_CREDENTIALS', runFile);
  vi.stubEnv('ACME_API_KEY', 'test-unrelated-key');
  vi.stubEnv('ACME_SERVER', 'https://unrelated.example');
  vi.stubEnv('ACME_PROFILE', 'owner');
  vi.stubEnv('ACME_AGENT_SESSION', 'session-1');
  const session = await currentSession(home, paths, config);
  expect(session).toMatchObject({
    kind: 'user',
    profile: 'owner',
    server: 'https://owner.example',
    headers: {
      'x-api-key': 'test-owner-key',
      'x-nb-agent-session': 'session-1',
    },
  });
  setGlobalFlags(extractGlobalFlags(['--profile', 'other']).flags);
  await expect(currentSession(home, paths, config)).rejects.toThrow(
    'bridge-selected profile',
  );
  setGlobalFlags(extractGlobalFlags([]).flags);
  vi.stubEnv('ACME_PROFILE', 'missing');
  await expect(currentSession(home, paths, config)).rejects.toThrow(
    'There is no profile missing',
  );
});
