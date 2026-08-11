/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
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

  it('fails when an internal dependency producer is missing', () => {
    expect(() =>
      resolveSelectedBuildPackageDependencies(['consumer'], [packageNode('consumer', ['missingProducer'])]),
    ).toThrow('Missing repository package producer: missingProducer required by consumer');
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
