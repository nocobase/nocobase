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
import {
  getInternalBuildDependencies,
  getPackages,
  resolveSelectedBuildPackageDependencies,
  type SelectedBuildPackageNode,
} from '../utils/getPackages';

function packageNode(name: string, dependencies: string[] = []): SelectedBuildPackageNode<string> {
  return { name, dependencies, value: name };
}

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
