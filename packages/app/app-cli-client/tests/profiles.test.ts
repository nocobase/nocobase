// Profiles: one per server, the current one, `--profile` and `<PREFIX>_PROFILE`, keys from the environment, and the
// `config.json` of a CLI from before profiles.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { appCliPaths } from '../src/config.ts';
import {
  listProfiles,
  peekUserConfig,
  readUserConfig,
  removeProfile,
  saveUserConfig,
  useProfile,
} from '../src/lib/credentials.ts';
import { removeDir, tempDir, TEST_CLI } from './helpers.ts';

const CLI = { ...TEST_CLI, envPrefix: 'ACME' };

describe('profiles', () => {
  let home: string;
  afterEach(() => removeDir(home));
  const options = (extra: Record<string, unknown> = {}) => ({
    paths: appCliPaths(home),
    config: CLI,
    store: undefined,
    env: {},
    ...extra,
  });

  it('keep one key per server and act as the current one unless told otherwise', async () => {
    home = tempDir();
    await saveUserConfig('https://a.example', 'key-a', options());
    await saveUserConfig(
      'https://b.example',
      'key-b',
      options({ profile: 'b', keyId: 'k2', keyName: 'acme CLI on host' }),
    );
    expect((await readUserConfig(options()))?.key).toBe('key-b');
    expect((await readUserConfig(options({ profile: 'default' })))?.key).toBe(
      'key-a',
    );
    expect(
      (await readUserConfig(options({ env: { ACME_PROFILE: 'default' } })))
        ?.server,
    ).toBe('https://a.example');
    expect(await listProfiles(options())).toEqual([
      {
        name: 'b',
        server: 'https://b.example',
        kind: 'apiKey',
        storage: 'file',
        keyName: 'acme CLI on host',
        current: true,
      },
      {
        name: 'default',
        server: 'https://a.example',
        kind: 'apiKey',
        storage: 'file',
        current: false,
      },
    ]);
    await useProfile('default', options());
    expect((await readUserConfig(options()))?.profile).toBe('default');
    await expect(useProfile('missing', options())).rejects.toThrow(
      'There is no profile missing',
    );
    expect(await removeProfile('default', options())).toEqual({
      server: 'https://a.example',
    });
    expect((await readUserConfig(options()))?.profile).toBe('b');
  });

  it('acts with ACME_API_KEY and ACME_SERVER without signing in', async () => {
    home = tempDir();
    const env = { ACME_API_KEY: 'ci-key', ACME_SERVER: 'ci.example:3000/' };
    expect(await readUserConfig(options({ env }))).toEqual({
      server: 'http://ci.example:3000',
      key: 'ci-key',
      kind: 'apiKey',
      storage: 'env',
    });
    expect(await peekUserConfig(options({ env }))).toEqual({
      server: 'http://ci.example:3000',
    });
    await expect(
      readUserConfig(options({ env: { ACME_API_KEY: 'k' } })),
    ).rejects.toThrow('set ACME_SERVER too');
  });

  it('read a config.json from before profiles as the default profile', async () => {
    home = tempDir();
    writeFileSync(
      path.join(home, 'config.json'),
      JSON.stringify({
        server: 'https://old.example',
        auth: { kind: 'apiKey', storage: 'file', key: 'old' },
      }),
    );
    expect(await readUserConfig(options())).toMatchObject({
      server: 'https://old.example',
      key: 'old',
      profile: 'default',
    });
    await saveUserConfig(
      'https://new.example',
      'new',
      options({ profile: 'new' }),
    );
    expect(
      JSON.parse(readFileSync(path.join(home, 'config.json'), 'utf8')),
    ).toMatchObject({
      current: 'new',
      profiles: {
        default: { server: 'https://old.example' },
        new: { server: 'https://new.example' },
      },
    });
  });
});
