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
  builtIn?: string[];
  deprecated?: string[];
};

const repositoryRoot = path.resolve(__dirname, '../../../../..');
const pluginPath = 'packages/plugins/@nocobase/plugin-js-template';
const sdkPath = 'packages/core/js-template-sdk';
const checkedInPluginFacades = [
  'client.js',
  'client.d.ts',
  'client-v2.js',
  'client-v2.d.ts',
  'server.js',
  'server.d.ts',
] as const;
const pluginSourceEntries = [
  'src/client/index.ts',
  'src/client-v2/index.tsx',
  'src/server/index.ts',
  'src/swagger/index.ts',
] as const;

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
  it('publishes one canonical plugin and one canonical SDK on the release version', () => {
    const releaseVersion = (JSON.parse(readText('lerna.json')) as { version: string }).version;
    const plugin = readPackage(pluginPath);
    const sdk = readPackage(sdkPath);
    const workspacePackageNames = new Set(getPackagesSync(repositoryRoot).map((pkg) => pkg.name));

    expect(plugin).toMatchObject({
      name: '@nocobase/plugin-js-template',
      version: releaseVersion,
      dependencies: {
        '@nocobase/js-template-sdk': releaseVersion,
        '@nocobase/runjs-workspace': releaseVersion,
      },
      peerDependencies: { '@nocobase/runjs': releaseVersion },
    });
    expect(plugin.dependencies).not.toHaveProperty('@nocobase/plugin-js-template');
    expect(sdk).toMatchObject({ name: '@nocobase/js-template-sdk', version: releaseVersion, files: ['lib'] });
    expect(workspacePackageNames).toContain('@nocobase/plugin-js-template');
    expect(workspacePackageNames).toContain('@nocobase/js-template-sdk');
    expect([...workspacePackageNames].filter((name) => name === plugin.name)).toEqual([plugin.name]);
    expect([...workspacePackageNames].filter((name) => name === sdk.name)).toEqual([sdk.name]);
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

    for (const file of [...checkedInPluginFacades, ...pluginSourceEntries]) {
      expect(fs.pathExistsSync(path.join(packageRoot, file))).toBe(true);
    }

    const releaseVersion = (JSON.parse(readText('lerna.json')) as { version: string }).version;
    if (!plugin.name || !plugin.version) {
      throw new Error('The JS Template plugin package identity is incomplete');
    }
    expect(
      getPluginTarballPath({ name: plugin.name, version: plugin.version }, path.join(repositoryRoot, 'storage/tar')),
    ).toBe(path.join(repositoryRoot, `storage/tar/@nocobase/plugin-js-template-${releaseVersion}.tgz`));
  });

  it('externalizes only the canonical SDK and installs only the canonical plugin from the preset', () => {
    const buildPluginSource = readText('packages/core/build/src/buildPlugin.ts');
    const preset = readPackage('packages/presets/nocobase');

    expect(buildPluginSource.match(/'@nocobase\/js-template-sdk'/g)).toHaveLength(1);
    expect(preset.dependencies).toHaveProperty('@nocobase/plugin-js-template');
    expect(preset.builtIn).toContain('@nocobase/plugin-js-template');
    expect(preset.deprecated || []).not.toContain('@nocobase/plugin-js-template');
  });
});
