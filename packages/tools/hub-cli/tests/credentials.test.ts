// @vitest-environment node
import { mkdtemp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  credentialsPath,
  loadKey,
  removeKey,
  saveKey,
} from '../src/credentials.ts';

let home: string;
let env: NodeJS.ProcessEnv;
beforeEach(async () => {
  home = await mkdtemp(path.join(os.tmpdir(), 'hub-credentials-'));
  env = { XDG_CONFIG_HOME: home, APPDATA: home };
});
afterEach(async () => {
  await rm(home, { recursive: true, force: true });
});

const url = 'https://hub.example/main/apps/crm';

describe('the credentials file', () => {
  it('lives in the configuration directory under nocobase/', () => {
    expect(credentialsPath(env)).toBe(
      path.join(home, 'nocobase', 'hub-credentials.json'),
    );
  });

  it.skipIf(process.platform === 'win32')(
    'is readable by its owner only',
    async () => {
      await saveKey(url, 'test-only-key', env);
      expect((await stat(credentialsPath(env))).mode & 0o777).toBe(0o600);
    },
  );

  it('keeps one key per remote URL and removes it again', async () => {
    expect(await loadKey(url, env)).toBeUndefined();
    await saveKey(url, 'first', env);
    await saveKey(`${url}-staging`, 'other', env);
    await saveKey(url, 'second', env);
    expect(await loadKey(url, env)).toMatchObject({ apiKey: 'second' });
    expect(await loadKey(`${url}-staging`, env)).toMatchObject({
      apiKey: 'other',
    });
    expect(await removeKey(url, env)).toBe(true);
    expect(await removeKey(url, env)).toBe(false);
    expect(await loadKey(url, env)).toBeUndefined();
    expect(await loadKey(`${url}-staging`, env)).toBeDefined();
  });

  it('rejects a file it did not write, without printing its content', async () => {
    await mkdir(path.join(home, 'nocobase'));
    await writeFile(credentialsPath(env), '{"keys": "test-only-secret"}');
    await expect(loadKey(url, env)).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS_FILE',
      message: expect.not.stringContaining('test-only-secret'),
    });
  });
});
