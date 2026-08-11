/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Topo from '@hapi/topo';
import { Package } from '@lerna/package';
import { getPackagesSync } from '@lerna/project';
import fg from 'fast-glob';
import path from 'path';
import { PACKAGES_PATH, ROOT_PATH } from '../constant';
import { toUnixPath } from './utils';

/**
 * 获取构建包的绝对路径，支持项目路径和 npm 两种形式
 * @example
 * yarn build packages/core/client @nocobase/acl => ['/home/xx/packages/core/client', '/home/xx/packages/core/acl']
 * yarn build packages/plugins/* => ['/home/xx/packages/plugins/a', '/home/xx/packages/plugins/b']
 * yarn build => all packages
 */
function getPackagesPath(pkgs: string[]) {
  const allPackageJson = fg.sync(['*/*/package.json', '*/*/*/package.json'], {
    cwd: PACKAGES_PATH,
    absolute: true,
    ignore: ['**/node_modules/**'],
    onlyFiles: true,
  });

  if (pkgs.length === 0) {
    return allPackageJson.map(toUnixPath).map((item) => path.dirname(item));
  }
  const allPackageInfo = allPackageJson
    .map((packageJsonPath) => ({
      name: require(packageJsonPath).name,
      path: path.dirname(toUnixPath(packageJsonPath)),
    }))
    .reduce((acc, cur) => {
      acc[cur.name] = cur.path;
      return acc;
    }, {});
  const allPackagePaths: string[] = Object.values(allPackageInfo);

  const pkgNames = pkgs.filter((item) => allPackageInfo[item]);
  const relativePaths = pkgNames.length ? pkgs.filter((item) => !pkgNames.includes(item)) : pkgs;
  const pkgPaths = pkgs.map((item) => allPackageInfo[item]);
  const absPaths = allPackagePaths.filter((absPath) =>
    relativePaths.some((relativePath) => absPath.endsWith(relativePath)),
  );
  const dirPaths = fg.sync(pkgs, { onlyDirectories: true, absolute: true, cwd: ROOT_PATH });
  const dirMatchPaths = allPackagePaths.filter((pkgPath) => dirPaths.some((dirPath) => pkgPath.startsWith(dirPath)));
  return [...new Set([...pkgPaths, ...absPaths, ...dirMatchPaths])];
}

export interface GetPackagesOptions {
  withDependencies?: boolean;
}

export interface SelectedBuildPackageNode<T> {
  name: string;
  dependencies: readonly string[];
  value: T;
}

export function getPackages(pkgs: string[], options: GetPackagesOptions = {}) {
  const packagePaths = getPackagesPath(pkgs);
  const allPackages = getPackagesSync(ROOT_PATH).filter(
    (pkg) => pkg.name !== '@nocobase/docs' && !toUnixPath(pkg.location).includes('/node_modules/'),
  );
  const packages = allPackages.filter((pkg) => packagePaths.includes(toUnixPath(pkg.location)));

  if (!options.withDependencies) {
    return sortPackages(packages);
  }

  const repositoryPackageNames = new Set(allPackages.map((pkg) => pkg.name));
  const repositoryPackageVersions = new Set(
    allPackages.filter((pkg) => pkg.name.startsWith('@nocobase/')).map((pkg) => pkg.version),
  );
  const nodes = allPackages.map((pkg) => {
    const manifest = require(`${pkg.location}/package.json`);
    return {
      name: pkg.name,
      dependencies: getInternalBuildDependencies(manifest, repositoryPackageNames, repositoryPackageVersions),
      value: pkg,
    };
  });

  return resolveSelectedBuildPackageDependencies(
    packages.map((pkg) => pkg.name),
    nodes,
  );
}

export function getInternalBuildDependencies(
  manifest: {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  },
  repositoryPackageNames: ReadonlySet<string>,
  repositoryPackageVersions: ReadonlySet<string> = new Set(),
): string[] {
  const dependencies = Object.entries(manifest.dependencies || {}).filter(
    ([dependencyName, dependencyVersion]) =>
      repositoryPackageNames.has(dependencyName) ||
      (dependencyName.startsWith('@nocobase/') && repositoryPackageVersions.has(dependencyVersion)),
  );
  const peerDependencies = Object.entries(manifest.peerDependencies || {}).filter(([dependencyName]) =>
    repositoryPackageNames.has(dependencyName),
  );

  return [...new Set([...dependencies, ...peerDependencies].map(([dependencyName]) => dependencyName))];
}

export function resolveSelectedBuildPackageDependencies<T>(
  selectedPackageNames: readonly string[],
  nodes: readonly SelectedBuildPackageNode<T>[],
): T[] {
  const nodeMap = new Map<string, SelectedBuildPackageNode<T>>();
  for (const node of nodes) {
    if (nodeMap.has(node.name)) {
      throw new Error(`Duplicate repository package producer: ${node.name}`);
    }
    nodeMap.set(node.name, node);
  }

  const state = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];
  const orderedPackages: T[] = [];

  const visit = (packageName: string, requiredBy?: string) => {
    const node = nodeMap.get(packageName);
    if (!node) {
      const requiredByMessage = requiredBy ? ` required by ${requiredBy}` : '';
      throw new Error(`Missing repository package producer: ${packageName}${requiredByMessage}`);
    }

    const packageState = state.get(packageName);
    if (packageState === 'visited') {
      return;
    }
    if (packageState === 'visiting') {
      const cycleStart = stack.indexOf(packageName);
      const cycle = [...stack.slice(cycleStart), packageName];
      throw new Error(`Circular repository package dependency: ${cycle.join(' -> ')}`);
    }

    state.set(packageName, 'visiting');
    stack.push(packageName);
    for (const dependencyName of node.dependencies) {
      visit(dependencyName, packageName);
    }
    stack.pop();
    state.set(packageName, 'visited');
    orderedPackages.push(node.value);
  };

  for (const packageName of selectedPackageNames) {
    visit(packageName);
  }

  return orderedPackages;
}

// make sure the order of packages is correct
export function sortPackages(packages: Package[]): Package[] {
  const sorter = new Topo.Sorter<Package>();
  for (const pkg of packages) {
    if (pkg.name === '@nocobase/docs') {
      continue;
    }
    const pkgJson = require(`${pkg.location}/package.json`);
    const after = Object.keys({ ...pkgJson.dependencies, ...pkgJson.devDependencies, ...pkgJson.peerDependencies });
    sorter.add(pkg, { after, group: pkg.name });
  }

  return sorter.nodes;
}

export function groupPackagesByTopoLevel(
  packages: Package[],
  options: {
    includeDevDependencies?: boolean;
  } = {},
): Package[][] {
  const { includeDevDependencies = true } = options;
  const filteredPackages = packages.filter((pkg) => pkg.name !== '@nocobase/docs');
  const packageMap = new Map(filteredPackages.map((pkg) => [pkg.name, pkg]));
  const dependencyMap = new Map<string, Set<string>>();
  const reverseDependencyMap = new Map<string, Set<string>>();

  for (const pkg of filteredPackages) {
    const pkgJson = require(`${pkg.location}/package.json`);
    const internalDeps = Object.keys({
      ...pkgJson.dependencies,
      ...(includeDevDependencies ? pkgJson.devDependencies : undefined),
      ...pkgJson.peerDependencies,
    }).filter((dep) => packageMap.has(dep));

    dependencyMap.set(pkg.name, new Set(internalDeps));

    for (const dep of internalDeps) {
      if (!reverseDependencyMap.has(dep)) {
        reverseDependencyMap.set(dep, new Set());
      }
      reverseDependencyMap.get(dep)?.add(pkg.name);
    }
  }

  const remainingDeps = new Map(Array.from(dependencyMap.entries()).map(([name, deps]) => [name, new Set(deps)]));
  const pending = new Set(filteredPackages.map((pkg) => pkg.name));
  const layers: Package[][] = [];

  while (pending.size > 0) {
    const layer = Array.from(pending)
      .filter((name) => (remainingDeps.get(name)?.size ?? 0) === 0)
      .map((name) => packageMap.get(name))
      .filter((pkg): pkg is Package => Boolean(pkg));

    if (layer.length === 0) {
      throw new Error(
        `Unable to group packages by topo level, possible circular dependency among: ${Array.from(pending).join(', ')}`,
      );
    }

    layers.push(layer);

    for (const pkg of layer) {
      pending.delete(pkg.name);
      const dependents = reverseDependencyMap.get(pkg.name);
      if (!dependents) {
        continue;
      }
      for (const dependent of dependents) {
        remainingDeps.get(dependent)?.delete(pkg.name);
      }
    }
  }

  return layers;
}
