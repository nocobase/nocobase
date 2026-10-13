import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PiAdapter } from '../src/agent/adapters/pi.ts';
import { removeDir, tempDir } from './helpers.ts';

const homes: string[] = [];
afterEach(() => {
  for (const home of homes.splice(0)) removeDir(home);
});

describe('Pi authenticated listing contract in an isolated subprocess', () => {
  it.each([
    [{}, []],
    [{ FIXTURE_API_KEY: 'synthetic-key' }, ['openai/key-demo']],
    [{ FIXTURE_OAUTH_CONFIGURED: '1' }, ['openai-codex/oauth-demo']],
    [{ LOCAL_PROVIDER_KEY: 'synthetic-key' }, ['custom/demo']],
  ])(
    'reports only the fixture providers with configured auth: %j',
    async (configured, expected) => {
      const home = tempDir('pi-auth-fixture-');
      homes.push(home);
      writeFileSync(
        path.join(home, 'pi'),
        `#!${process.execPath}\n${readFileSync(new URL('./fixtures/provider-pi.mjs', import.meta.url), 'utf8')}`,
        { mode: 0o755 },
      );
      const adapter = new PiAdapter({
        searchPath: home,
        env: { HOME: home, PATH: process.env.PATH ?? '', ...configured },
      });
      expect((await adapter.detect()).authenticated).toBe(expected.length > 0);
      expect(await adapter.detectModels()).toEqual({
        modelsDetectionStatus: 'detected',
        models: expected.map((id) => ({ id })),
      });
    },
  );
});
