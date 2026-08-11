/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { selectRetryPackages } from '../build';
import {
  getInternalBuildDependencies,
  getPackages,
  resolveSelectedBuildPackageDependencies,
  type SelectedBuildPackageNode,
} from '../utils/getPackages';

function packageNode(name: string, dependencies: string[] = []): SelectedBuildPackageNode<string> {
  return { name, dependencies, value: name };
}

function retryPackage(name: string) {
  return { name };
}

describe('retry package selection', () => {
  it('continues from a cached package that belongs to the current selection', () => {
    const selection = selectRetryPackages([retryPackage('A'), retryPackage('B'), retryPackage('C')], 'B');

    expect(selection.cacheMatched).toBe(true);
    expect(selection.packages.map((pkg) => pkg.name)).toEqual(['B', 'C']);
  });

  it('preserves the complete selection when the cached package is stale', () => {
    const selection = selectRetryPackages([retryPackage('A'), retryPackage('B')], 'stale-package');

    expect(selection.cacheMatched).toBe(false);
    expect(selection.packages.map((pkg) => pkg.name)).toEqual(['A', 'B']);
  });

  it('preserves the complete with-deps closure when a cache from another selection does not match', () => {
    const dependencyClosure = resolveSelectedBuildPackageDependencies(
      ['plugin'],
      [packageNode('plugin', ['runjs']), packageNode('runjs', ['client']), packageNode('client')],
    ).map(retryPackage);
    const selection = selectRetryPackages(dependencyClosure, 'previous-selection-package');

    expect(selection.cacheMatched).toBe(false);
    expect(selection.packages.map((pkg) => pkg.name)).toEqual(['client', 'runjs', 'plugin']);
  });

  it('warns and clears stale cache before continuing the complete with-deps selection', async () => {
    const originalArgv = process.argv;
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const runScript = vi.fn().mockRejectedValue(new Error('stop after retry selection'));
    const writeToCache = vi.fn();
    const directlySelectedPackages = [retryPackage('plugin')];
    const dependencyClosure = [
      { name: '@nocobase/cli', location: '/repository/packages/core/cli' },
      { name: 'plugin', location: '/repository/packages/plugins/plugin' },
    ];

    try {
      process.argv = [...originalArgv, '--retry', '--with-deps'];
      vi.resetModules();
      vi.doMock('../utils/getPackages', async () => ({
        ...(await vi.importActual<typeof import('../utils/getPackages')>('../utils/getPackages')),
        getPackages: vi.fn((_pkgs: string[], options?: { withDependencies?: boolean }) =>
          options?.withDependencies ? dependencyClosure : directlySelectedPackages,
        ),
      }));
      vi.doMock('../utils', async () => ({
        ...(await vi.importActual<typeof import('../utils')>('../utils')),
        readFromCache: vi.fn(() => ({ pkg: 'stale-package' })),
        runScript,
        writeToCache,
      }));
      const { build: buildWithStaleCache } = await import('../build');

      await expect(buildWithStaleCache(['plugin'])).rejects.toThrow('stop after retry selection');
      expect(runScript).toHaveBeenCalledWith(['build'], '/repository/packages/core/cli');
      expect(writeToCache).toHaveBeenCalledWith('build-error', {});
      expect(warning).toHaveBeenCalledWith(expect.stringContaining("cached retry package 'stale-package'"));
    } finally {
      process.argv = originalArgv;
      warning.mockRestore();
      vi.doUnmock('../utils/getPackages');
      vi.doUnmock('../utils');
      vi.resetModules();
    }
  });
});

describe('selected build dependency closure', () => {
  it('includes transitive internal dependencies in topological order', () => {
    const packages = resolveSelectedBuildPackageDependencies(
      ['plugin'],
      [packageNode('plugin', ['runjs']), packageNode('runjs', ['client']), packageNode('client')],
    );

    expect(packages).toEqual(['client', 'runjs', 'plugin']);
  });

  it('includes peer-only producers but excludes dev dependencies', () => {
    const dependencies = getInternalBuildDependencies(
      {
        dependencies: { external: '1.0.0' },
        peerDependencies: { peerProducer: '2.x' },
      },
      new Set(['consumer', 'peerProducer']),
    );

    expect(dependencies).toEqual(['peerProducer']);
    expect(
      getInternalBuildDependencies(
        {
          dependencies: {},
          peerDependencies: {},
          devDependencies: { testOnlyProducer: '1.0.0' },
        },
        new Set(['testOnlyProducer']),
      ),
    ).toEqual([]);
  });

  it('does not treat an absent NocoBase peer as a deleted repository producer', () => {
    const dependencies = getInternalBuildDependencies(
      {
        peerDependencies: { '@nocobase/plugin-app-supervisor': '2.x' },
      },
      new Set(['@nocobase/plugin-testing-platform']),
      new Set(['3.0.0-alpha.8']),
    );

    expect(dependencies).toEqual([]);
  });

  it('fails when an internal dependency producer is missing', () => {
    expect(() =>
      resolveSelectedBuildPackageDependencies(['consumer'], [packageNode('consumer', ['missingProducer'])]),
    ).toThrow('Missing repository package producer: missingProducer required by consumer');
  });

  it('retains a missing same-release producer so repository resolution fails', () => {
    const dependencies = getInternalBuildDependencies(
      {
        dependencies: { '@nocobase/runjs': '3.0.0-alpha.8' },
      },
      new Set(['@nocobase/plugin-js-template']),
      new Set(['3.0.0-alpha.8']),
    );

    expect(dependencies).toEqual(['@nocobase/runjs']);
    expect(() =>
      resolveSelectedBuildPackageDependencies(
        ['@nocobase/plugin-js-template'],
        [packageNode('@nocobase/plugin-js-template', dependencies)],
      ),
    ).toThrow('Missing repository package producer: @nocobase/runjs required by @nocobase/plugin-js-template');
  });

  it('fails through repository discovery when a same-release producer directory is missing', async () => {
    const repositoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-missing-build-producer-'));
    const packagesRoot = path.join(repositoryRoot, 'packages');
    const consumerRoot = path.join(packagesRoot, 'plugins/@nocobase/plugin-js-template');

    try {
      fs.mkdirSync(consumerRoot, { recursive: true });
      fs.writeFileSync(
        path.join(repositoryRoot, 'package.json'),
        JSON.stringify({ private: true, workspaces: ['packages/*/*/*'] }),
      );
      fs.writeFileSync(
        path.join(repositoryRoot, 'lerna.json'),
        JSON.stringify({ version: 'independent', packages: ['packages/*/*/*'] }),
      );
      fs.writeFileSync(
        path.join(consumerRoot, 'package.json'),
        JSON.stringify({
          name: '@nocobase/plugin-js-template',
          version: '3.0.0-alpha.8',
          dependencies: { '@nocobase/runjs': '3.0.0-alpha.8' },
        }),
      );

      vi.resetModules();
      vi.doMock('../constant', async () => ({
        ...(await vi.importActual<typeof import('../constant')>('../constant')),
        PACKAGES_PATH: packagesRoot,
        ROOT_PATH: repositoryRoot,
      }));
      const { getPackages: getFixturePackages } = await import('../utils/getPackages');

      expect(() => getFixturePackages(['@nocobase/plugin-js-template'], { withDependencies: true })).toThrow(
        'Missing repository package producer: @nocobase/runjs required by @nocobase/plugin-js-template',
      );
    } finally {
      vi.doUnmock('../constant');
      vi.resetModules();
      fs.rmSync(repositoryRoot, { force: true, recursive: true });
    }
  });

  it('deduplicates shared and repeatedly selected dependencies', () => {
    const packages = resolveSelectedBuildPackageDependencies(
      ['first', 'second', 'first'],
      [packageNode('first', ['shared']), packageNode('second', ['shared']), packageNode('shared')],
    );

    expect(packages).toEqual(['shared', 'first', 'second']);
  });

  it('does not include packages that only depend on the selection', () => {
    const packages = resolveSelectedBuildPackageDependencies(
      ['producer'],
      [packageNode('producer'), packageNode('dependent', ['producer'])],
    );

    expect(packages).toEqual(['producer']);
  });

  it('reports the dependency path for cycles', () => {
    expect(() =>
      resolveSelectedBuildPackageDependencies(
        ['first'],
        [packageNode('first', ['second']), packageNode('second', ['third']), packageNode('third', ['first'])],
      ),
    ).toThrow('Circular repository package dependency: first -> second -> third -> first');
  });

  it('supports the repository option for a package unrelated to JS Template', () => {
    const packages = getPackages(['@nocobase/evaluators'], { withDependencies: true });

    expect(packages.map((pkg) => pkg.name)).toEqual(['@nocobase/utils', '@nocobase/evaluators']);
  });
});
