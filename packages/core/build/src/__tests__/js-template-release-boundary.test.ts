/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getPackagesSync } from '@lerna/project';
import fs from 'fs-extra';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { getPluginTarballPath } from '../tarPlugin';

type PackageExport = string | { types?: string; import?: string; require?: string };
type PackageManifest = {
  name?: string;
  version?: string;
  private?: boolean;
  files?: string[];
  exports?: Record<string, PackageExport>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const repositoryRoot = path.resolve(__dirname, '../../../../..');
const pluginPath = 'packages/plugins/@nocobase/plugin-js-template';
const runJSPath = 'packages/core/runjs';

function readText(relativePath: string) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

function readPackage(relativePath: string) {
  return JSON.parse(readText(path.join(relativePath, 'package.json'))) as PackageManifest;
}

function getExportedFiles(pkg: PackageManifest) {
  return Object.values(pkg.exports || {})
    .flatMap((value) => (typeof value === 'string' ? [value] : [value.types, value.import, value.require]))
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/^\.\//, ''));
}

function isPackaged(file: string, packagedFiles: Set<string>) {
  return [...packagedFiles].some((packagedFile) => file === packagedFile || file.startsWith(`${packagedFile}/`));
}

describe('JS Template release boundary', () => {
  it('publishes one canonical plugin and one canonical RunJS package on the release version', () => {
    const releaseVersion = (JSON.parse(readText('lerna.json')) as { version: string }).version;
    const plugin = readPackage(pluginPath);
    const runJS = readPackage(runJSPath);
    const workspacePackageNames = new Set(getPackagesSync(repositoryRoot).map((pkg) => pkg.name));

    expect(plugin).toMatchObject({
      name: '@nocobase/plugin-js-template',
      version: releaseVersion,
      dependencies: { '@nocobase/runjs': releaseVersion },
    });
    expect(plugin.dependencies).not.toHaveProperty('@nocobase/plugin-js-template');
    expect(runJS).toMatchObject({ name: '@nocobase/runjs', version: releaseVersion });
    expect(runJS.exports).toHaveProperty('./js-template/client');
    expect(runJS.exports).toHaveProperty('./workspace/server');
    expect(workspacePackageNames).toContain('@nocobase/plugin-js-template');
    expect(workspacePackageNames).toContain('@nocobase/runjs');
    expect([...workspacePackageNames].filter((name) => name === plugin.name)).toEqual([plugin.name]);
    expect([...workspacePackageNames].filter((name) => name === runJS.name)).toEqual([runJS.name]);
  });

  it('keeps the consolidated package after framework hosts in the build graph', () => {
    const clientV2 = readPackage('packages/core/client-v2');
    const server = readPackage('packages/core/server');
    const preset = readPackage('packages/presets/nocobase');
    const runJS = readPackage(runJSPath);
    const buildSource = readText('packages/core/build/src/build.ts');
    const buildConstants = readText('packages/core/build/src/constant.ts');

    expect(clientV2.dependencies).not.toHaveProperty('@nocobase/runjs');
    expect(server.dependencies).not.toHaveProperty('@nocobase/runjs');
    expect(preset.dependencies).not.toHaveProperty('@nocobase/runjs');
    expect(runJS.peerDependencies).toMatchObject({
      '@nocobase/client-v2': '2.x',
      '@nocobase/server': '2.x',
    });
    expect(buildSource).toContain('const runJSCore = packages.find((item) => item.location === CORE_RUNJS)');
    expect(buildConstants).toContain("CORE_RUNJS = path.join(PACKAGES_PATH, 'core/runjs')");
  });

  it('declares every public plugin entry within the packaged release boundary', () => {
    const plugin = readPackage(pluginPath);
    const packagedFiles = new Set(plugin.files || []);
    const exportedFiles = getExportedFiles(plugin).filter((file) => file !== 'package.json');
    const packageRoot = path.join(repositoryRoot, pluginPath);

    expect(exportedFiles).not.toHaveLength(0);
    for (const file of exportedFiles) {
      expect(isPackaged(file, packagedFiles)).toBe(true);
      const relativeTarget = path.relative(packageRoot, path.resolve(packageRoot, file));
      expect(path.isAbsolute(relativeTarget)).toBe(false);
      expect(relativeTarget === '..' || relativeTarget.startsWith(`..${path.sep}`)).toBe(false);
    }

    const releaseVersion = (JSON.parse(readText('lerna.json')) as { version: string }).version;
    if (!plugin.name || !plugin.version) {
      throw new Error('The JS Template plugin package identity is incomplete');
    }
    expect(
      getPluginTarballPath({ name: plugin.name, version: plugin.version }, path.join(repositoryRoot, 'storage/tar')),
    ).toBe(path.join(repositoryRoot, `storage/tar/@nocobase/plugin-js-template-${releaseVersion}.tgz`));
  });

  it('externalizes the canonical RunJS package once', () => {
    const buildPluginSource = readText('packages/core/build/src/buildPlugin.ts');
    const externalStart = buildPluginSource.indexOf('const external = [');
    const externalEnd = buildPluginSource.indexOf('];', externalStart);
    const externalSource = buildPluginSource.slice(externalStart, externalEnd);

    expect(externalSource.match(/'@nocobase\/runjs'/g)).toHaveLength(1);
  });
});
