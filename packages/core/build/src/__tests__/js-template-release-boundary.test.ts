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

type PackageExport =
  | string
  | {
      types?: string;
      import?: string;
      require?: string;
    };

type PackageManifest = {
  name?: string;
  version?: string;
  private?: boolean;
  files?: string[];
  exports?: Record<string, PackageExport>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  workspaces?: string[];
  builtIn?: string[];
  deprecated?: string[];
};

const repositoryRoot = path.resolve(__dirname, '../../../../..');
const canonicalPluginPath = 'packages/plugins/@nocobase/plugin-js-template';
const legacyPluginPath = 'packages/plugins/@nocobase/plugin-light-extension';
const releasePackagePaths = [
  'packages/core/client-v2',
  'packages/core/js-template-sdk',
  'packages/core/light-extension-sdk',
  'packages/core/runjs',
  'packages/core/runjs-workspace',
  'packages/plugins/@nocobase/plugin-flow-engine',
  'packages/presets/nocobase',
  canonicalPluginPath,
  legacyPluginPath,
] as const;

function readText(relativePath: string) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

function readPackage(relativePath: string) {
  return JSON.parse(readText(path.join(relativePath, 'package.json'))) as PackageManifest;
}

function getPackageIdentity(pkg: PackageManifest) {
  if (!pkg.name || !pkg.version) {
    throw new Error('Package name and version are required for release artifacts');
  }
  return { name: pkg.name, version: pkg.version };
}

function getExportedFiles(pkg: PackageManifest) {
  return Object.values(pkg.exports || {})
    .flatMap((value) => (typeof value === 'string' ? [value] : [value.types, value.import, value.require]))
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/^\.\//, ''));
}

describe('JS Templates release boundary', () => {
  it('keeps the canonical, legacy, SDK, and RunJS publication chain on the repository release version', () => {
    const releaseVersion = (JSON.parse(readText('lerna.json')) as { version: string }).version;
    const packages = new Map(releasePackagePaths.map((packagePath) => [packagePath, readPackage(packagePath)]));

    for (const pkg of packages.values()) {
      expect(pkg.version).toBe(releaseVersion);
      expect(pkg.private).not.toBe(true);
    }

    expect(packages.get(canonicalPluginPath)?.dependencies).toEqual({
      '@nocobase/plugin-light-extension': releaseVersion,
    });
    expect(packages.get(legacyPluginPath)?.dependencies).toMatchObject({
      '@nocobase/js-template-sdk': releaseVersion,
      '@nocobase/runjs-workspace': releaseVersion,
    });
    expect(packages.get(legacyPluginPath)?.peerDependencies).toMatchObject({
      '@nocobase/runjs': releaseVersion,
    });
    expect(packages.get('packages/core/light-extension-sdk')?.dependencies).toEqual({
      '@nocobase/js-template-sdk': releaseVersion,
    });
    expect(packages.get('packages/core/runjs-workspace')?.dependencies).toMatchObject({
      '@nocobase/js-template-sdk': releaseVersion,
    });
    expect(packages.get('packages/core/runjs-workspace')?.peerDependencies).toMatchObject({
      '@nocobase/runjs': releaseVersion,
    });
    expect(packages.get('packages/core/client-v2')?.dependencies).toMatchObject({
      '@nocobase/js-template-sdk': releaseVersion,
      '@nocobase/runjs': releaseVersion,
    });
    expect(packages.get('packages/plugins/@nocobase/plugin-flow-engine')?.dependencies).toMatchObject({
      '@nocobase/runjs-workspace': releaseVersion,
    });
  });

  it('discovers both plugin identities as public workspaces in the unfiltered Lerna release', () => {
    const rootPackage = JSON.parse(readText('package.json')) as PackageManifest;
    const workspacePackageNames = new Set(getPackagesSync(repositoryRoot).map((pkg) => pkg.name));

    expect(rootPackage.workspaces).toEqual(expect.arrayContaining(['packages/*/*', 'packages/*/*/*']));
    expect(workspacePackageNames.has('@nocobase/plugin-js-template')).toBe(true);
    expect(workspacePackageNames.has('@nocobase/plugin-light-extension')).toBe(true);
    expect(workspacePackageNames.has('@nocobase/js-template-sdk')).toBe(true);
    expect(workspacePackageNames.has('@nocobase/light-extension-sdk')).toBe(true);
    expect(rootPackage.scripts?.release).toBe('lerna publish');
    expect(rootPackage.scripts?.['release:force']).toContain('lerna publish from-package');
    expect(readText('release.sh')).toContain('--force-publish=*');
  });

  it('packages canonical facade entries and retains legacy artifact names', () => {
    const canonicalPlugin = readPackage(canonicalPluginPath);
    const legacyPlugin = readPackage(legacyPluginPath);
    const canonicalFiles = new Set(canonicalPlugin.files || []);
    const canonicalExportFiles = getExportedFiles(canonicalPlugin).filter((file) => file !== 'package.json');

    expect(canonicalExportFiles).not.toHaveLength(0);
    for (const file of canonicalExportFiles) {
      expect(canonicalFiles.has(file)).toBe(true);
      expect(fs.pathExistsSync(path.join(repositoryRoot, canonicalPluginPath, file))).toBe(true);
    }
    expect(readPackage('packages/core/js-template-sdk').files).toEqual(['lib']);
    expect(readPackage('packages/core/light-extension-sdk').files).toEqual(['lib']);
    expect(readText(`${legacyPluginPath}/.npmignore`)).not.toMatch(/^\/(client|client-v2|server)(\.js|\.d\.ts)$/m);

    const releaseVersion = (JSON.parse(readText('lerna.json')) as { version: string }).version;
    const outputDir = path.join(repositoryRoot, 'storage', 'tar');
    expect(getPluginTarballPath(getPackageIdentity(canonicalPlugin), outputDir)).toBe(
      path.join(outputDir, `@nocobase/plugin-js-template-${releaseVersion}.tgz`),
    );
    expect(getPluginTarballPath(getPackageIdentity(legacyPlugin), outputDir)).toBe(
      path.join(outputDir, `@nocobase/plugin-light-extension-${releaseVersion}.tgz`),
    );
    expect(legacyPlugin.dependencies).not.toHaveProperty('@nocobase/plugin-js-template');
  });

  it('keeps both SDKs external to plugin bundles', () => {
    const buildPluginSource = readText('packages/core/build/src/buildPlugin.ts');

    expect(buildPluginSource).toContain("'@nocobase/js-template-sdk'");
    expect(buildPluginSource).toContain("'@nocobase/light-extension-sdk'");
  });

  it('installs the canonical package through the app preset in every Docker image path', () => {
    const releaseVersion = (JSON.parse(readText('lerna.json')) as { version: string }).version;
    const appPackage = readPackage('packages/core/app');
    const presetPackage = readPackage('packages/presets/nocobase');

    expect(appPackage.dependencies).toMatchObject({ '@nocobase/preset-nocobase': releaseVersion });
    expect(presetPackage.dependencies).toMatchObject({
      '@nocobase/plugin-js-template': releaseVersion,
      '@nocobase/plugin-light-extension': releaseVersion,
    });
    expect(presetPackage.builtIn).toContain('@nocobase/plugin-js-template');
    expect(presetPackage.builtIn).not.toContain('@nocobase/plugin-light-extension');
    expect(presetPackage.deprecated).toContain('@nocobase/plugin-light-extension');

    for (const dockerfile of ['Dockerfile', 'docker/nocobase/Dockerfile', 'docker/nocobase/Dockerfile-full']) {
      const source = readText(dockerfile);
      expect(source).toMatch(/create(?:-|\s+)nocobase-app/);
      expect(source).toContain('yarn install --production');
    }
  });
});
