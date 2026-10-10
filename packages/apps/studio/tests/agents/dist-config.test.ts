// @vitest-environment node

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import runnerPackage from '@nocobase/agent-runner/package.json' with { type: 'json' };
import { RUNNER_PRODUCT } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import {
  installedServedVersions,
  SERVED_NPM_PACKAGES,
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
