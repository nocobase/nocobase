// @vitest-environment node

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { findConfigurationSource } from '../../src/tools/scripts/utils/config-presence.mjs';

const directories: string[] = [];

afterEach(async () => {
  while (directories.length > 0) {
    await rm(directories.pop()!, { recursive: true, force: true });
  }
});

async function createRoot(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'nocobase-config-presence-'));
  directories.push(root);
  return root;
}

describe('findConfigurationSource', () => {
  it.each(['yml', 'yaml', 'toml', 'json'])(
    'finds config.%s beside the application',
    async (extension) => {
      const root = await createRoot();
      await writeFile(path.join(root, `config.${extension}`), '');

      expect(findConfigurationSource(root, {})).toMatchObject({
        kind: 'file',
        file: path.join(root, `config.${extension}`),
        exists: true,
      });
    },
  );

  /**
   * An application whose secrets come from the environment needs no file at all, and the deployment documentation
   * describes exactly that. A check that insisted on a file would refuse to start a perfectly valid deployment.
   */
  it('accepts configuration supplied entirely through the environment', async () => {
    const root = await createRoot();

    expect(
      findConfigurationSource(root, { AUTH_SECRET: 'from-env' }),
    ).toMatchObject({ kind: 'environment', exists: true });
  });

  it('accepts SECRETS_KEYS from the environment', async () => {
    const root = await createRoot();

    expect(
      findConfigurationSource(root, { SECRETS_KEYS: '1:from-env' }),
    ).toMatchObject({ kind: 'environment', exists: true });
  });

  it('ignores a blank AUTH_SECRET', async () => {
    const root = await createRoot();

    expect(
      findConfigurationSource(root, { AUTH_SECRET: '  ' }),
    ).toBeUndefined();
  });

  it('reports nothing when the application has no configuration at all', async () => {
    const root = await createRoot();

    expect(findConfigurationSource(root, {})).toBeUndefined();
  });

  /** A path named in APP_CONFIG_FILE is loaded non-optionally, so pointing at a missing file is itself the error. */
  it('answers APP_CONFIG_FILE even when the file is absent', async () => {
    const root = await createRoot();

    expect(
      findConfigurationSource(root, { APP_CONFIG_FILE: 'etc/app.yml' }),
    ).toMatchObject({
      kind: 'file',
      file: path.join(root, 'etc', 'app.yml'),
      configured: true,
      exists: false,
    });
  });

  it('prefers APP_CONFIG_FILE over a file beside the application', async () => {
    const root = await createRoot();
    await writeFile(path.join(root, 'config.yml'), '');
    const elsewhere = path.join(root, 'other.yml');
    await writeFile(elsewhere, '');

    expect(
      findConfigurationSource(root, { APP_CONFIG_FILE: elsewhere }),
    ).toMatchObject({ file: elsewhere, configured: true, exists: true });
  });

  it('probes the extensions in the order the runtime does', async () => {
    const root = await createRoot();
    await writeFile(path.join(root, 'config.toml'), '');
    await writeFile(path.join(root, 'config.yml'), '');

    expect(findConfigurationSource(root, {})).toMatchObject({
      file: path.join(root, 'config.yml'),
    });
  });
});
