// @vitest-environment node

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import runnerPackage from '@nocobase/agent-runner/package.json' with { type: 'json' };
import studioCliPackage from '@nocobase/studio-cli/package.json' with { type: 'json' };
import { RUNNER_PRODUCT } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import {
  installedServedVersions,
  packedVersionProblems,
  SERVED_NPM_PACKAGES,
  servedPackagesDir,
  servedVersions,
} from '../../server/agents/served-versions.js';
import agents from '../../server/config/agents.js';

const paths = {
  storage: (relative = '') => path.join('/app/storage', relative),
} as unknown as Parameters<typeof agents>[0]['paths'];

const configWith = (env: Record<string, string | undefined>) =>
  agents({ paths, env } as unknown as Parameters<typeof agents>[0]);

describe('agents.dist.dir', () => {
  const directories: string[] = [];
  afterEach(() => {
    for (const directory of directories.splice(0))
      rmSync(directory, { recursive: true, force: true });
  });

  const tempDir = (prefix: string): string => {
    const directory = mkdtempSync(path.join(tmpdir(), prefix));
    directories.push(directory);
    return directory;
  };

  it('serves the packages the build carries', () => {
    const built = tempDir('studio-built-');
    mkdirSync(path.join(built, 'stable'));
    expect(servedPackagesDir(undefined, pathToFileURL(`${built}/`))).toBe(
      built,
    );
  });

  it('prefers NB_STUDIO_RUNNERS_DIST over the packages the build carries', () => {
    const built = tempDir('studio-built-');
    mkdirSync(path.join(built, 'stable'));
    const variable = tempDir('studio-runners-');
    mkdirSync(path.join(variable, 'stable'));
    expect(servedPackagesDir(variable, pathToFileURL(`${built}/`))).toBe(
      variable,
    );
    const empty = tempDir('studio-runners-');
    expect(servedPackagesDir(empty, pathToFileURL(`${built}/`))).toBe(built);
  });

  it('keeps the plugin default when the build carries no packages', () => {
    const built = tempDir('studio-built-');
    expect(
      servedPackagesDir(undefined, pathToFileURL(`${built}/`)),
    ).toBeUndefined();
  });

  it('serves the tarballs the image baked in', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'studio-runners-'));
    directories.push(directory);
    mkdirSync(path.join(directory, 'stable'));
    expect(configWith({ NB_STUDIO_RUNNERS_DIST: directory }).dist).toEqual({
      dir: directory,
      npm: servedVersions(),
    });
  });

  it('keeps the plugin default without the variable or a baked channel', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'studio-runners-'));
    directories.push(directory);
    expect(configWith({}).dist?.dir).toBeUndefined();
    expect(
      configWith({ NB_STUDIO_RUNNERS_DIST: directory }).dist?.dir,
    ).toBeUndefined();
  });
});

describe('the packages a build carries', () => {
  const directories: string[] = [];
  afterEach(() => {
    for (const directory of directories.splice(0))
      rmSync(directory, { recursive: true, force: true });
  });

  const recorded = {
    [RUNNER_PRODUCT]: { package: '@nocobase/agent-runner', version: '1.2.3' },
    'nb-studio': { package: '@nocobase/studio-cli', version: '0.4.0' },
  };
  const pack = (
    dir: string,
    product: string,
    versions: Record<string, string[]>,
  ): void => {
    mkdirSync(path.join(dir, 'stable', product), { recursive: true });
    writeFileSync(
      path.join(dir, 'stable', product, 'manifest.json'),
      JSON.stringify({
        schema: 1,
        product,
        versions: Object.fromEntries(
          Object.entries(versions).map(([version, targets]) => [
            version,
            {
              targets: Object.fromEntries(
                targets.map((target) => [target, {}]),
              ),
            },
          ]),
        ),
      }),
    );
  };

  it('agree with the recorded versions when each lists exactly its own', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'studio-packed-'));
    directories.push(dir);
    pack(dir, RUNNER_PRODUCT, { '1.2.3': ['universal'] });
    pack(dir, 'nb-studio', { '0.4.0': ['universal'] });
    expect(packedVersionProblems(dir, recorded)).toEqual([]);
  });

  it('report a missing, different, extra or non-universal package', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'studio-packed-'));
    directories.push(dir);
    pack(dir, RUNNER_PRODUCT, { '1.2.4': ['universal'] });
    expect(packedVersionProblems(dir, recorded)).toEqual([
      `${RUNNER_PRODUCT}: packed 1.2.4, but @nocobase/agent-runner@1.2.3 is recorded.`,
      expect.stringMatching(/^nb-studio: .* is missing or not JSON\.$/u),
    ]);
    pack(dir, RUNNER_PRODUCT, {
      '1.2.3': ['universal'],
      '1.2.2': ['universal'],
    });
    pack(dir, 'nb-studio', { '0.4.0': ['linux-x64'] });
    expect(packedVersionProblems(dir, recorded)).toEqual([
      `${RUNNER_PRODUCT}: packed 1.2.3, 1.2.2, but @nocobase/agent-runner@1.2.3 is recorded.`,
      'nb-studio: 0.4.0 has no universal package.',
    ]);
  });
});

describe('agents.dist.npm', () => {
  const directories: string[] = [];
  afterEach(() => {
    for (const directory of directories.splice(0))
      rmSync(directory, { recursive: true, force: true });
  });

  it('pins the runner to the exact version this Studio is developed with', () => {
    expect(configWith({}).dist?.npm?.[RUNNER_PRODUCT]).toEqual({
      package: '@nocobase/agent-runner',
      version: runnerPackage.version,
    });
  });

  it('pins nb-studio to the exact @nocobase/studio-cli this Studio is developed with', () => {
    expect(configWith({}).dist?.npm?.['nb-studio']).toEqual({
      package: '@nocobase/studio-cli',
      version: studioCliPackage.version,
    });
  });

  it('pins every served package Studio has installed, and leaves out the others', () => {
    const require = createRequire(import.meta.url);
    const expected = Object.fromEntries(
      Object.entries(SERVED_NPM_PACKAGES).flatMap(([product, name]) => {
        try {
          const manifest = require(`${name}/package.json`) as {
            version: string;
          };
          return [[product, { package: name, version: manifest.version }]];
        } catch {
          return [];
        }
      }),
    );
    expect(installedServedVersions()).toEqual(expected);
    expect(configWith({}).dist?.npm).toEqual(expected);
  });

  it('reads the versions a build recorded before the installed packages', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'studio-served-'));
    directories.push(directory);
    const file = path.join(directory, 'served-versions.json');
    const recorded = {
      [RUNNER_PRODUCT]: { package: '@nocobase/agent-runner', version: '9.8.7' },
    };
    writeFileSync(file, JSON.stringify(recorded));
    expect(servedVersions(pathToFileURL(file))).toEqual(recorded);
  });
});
