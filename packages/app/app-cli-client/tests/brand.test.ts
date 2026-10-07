// A packaged CLI (`nocobase cli build`, `cli link`): the `nocobase.cli` in its own package.json becomes the
// configuration it runs with.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { appCliConfigOf, readAppCliPackage } from '../src/brand.ts';
import { removeDir, tempDir } from './helpers.ts';

describe('a packaged CLI', () => {
  let dir: string | undefined;
  afterEach(() => {
    if (dir) removeDir(dir);
    dir = undefined;
  });

  it('runs with what its nocobase.cli says, and the defaults for the rest', () => {
    expect(
      appCliConfigOf(
        { bin: 'demo' },
        { packageRoot: '/opt/demo/versions/1.0.0', version: '1.0.0' },
      ),
    ).toEqual({
      bin: 'demo',
      displayName: 'demo',
      stateDir: '.demo',
      runCredentialsFile: '.demo/run.json',
      version: '1.0.0',
      selfUpdate: { packageRoot: '/opt/demo/versions/1.0.0', product: 'demo' },
    });
    expect(
      appCliConfigOf(
        {
          bin: 'acme',
          displayName: 'Acme',
          stateDir: '.acme',
          homeEnv: 'ACME_HOME',
          envPrefix: 'ACME',
          keychainEnv: 'ACME_KEYCHAIN',
          auth: { clientId: 'acme' },
          skills: ['ai/skills/acme-cli'],
        },
        { packageRoot: '/p', version: '2.0.0', description: 'From package' },
      ),
    ).toMatchObject({
      displayName: 'Acme',
      runCredentialsFile: '.acme/run.json',
      homeEnv: 'ACME_HOME',
      envPrefix: 'ACME',
      keychainEnv: 'ACME_KEYCHAIN',
      auth: { clientId: 'acme' },
      description: 'From package',
    });
  });

  it('reads its package.json, and refuses one that names no CLI', () => {
    dir = tempDir();
    writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ version: '3.1.0', nocobase: { cli: { bin: 'demo' } } }),
    );
    expect(readAppCliPackage(dir)).toEqual({
      brand: { bin: 'demo' },
      info: { packageRoot: dir, version: '3.1.0' },
    });
    writeFileSync(path.join(dir, 'package.json'), '{"version":"1.0.0"}');
    expect(() => readAppCliPackage(dir as string)).toThrow(
      'names no CLI under nocobase.cli',
    );
  });
});
