/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

type PackedPackageReport = {
  name: string;
  version: string;
  tarball: string;
  fileCount: number;
  files: string[];
  exportTargets: string[];
};

type BoundaryReport = {
  packages: {
    runjs: PackedPackageReport;
    plugin: PackedPackageReport;
  };
  requiredEntries: Array<{ specifier: string; resolvedPath: string; exportCount: number }>;
  typescript: { importedEntries: string[]; resolutionModes: string[]; passed: boolean };
  browserRoot: { blockedModules: string[]; inputs: string[]; prohibitedInputs: string[] };
  installations: {
    runjs: Array<{ path: string; version: string }>;
    lezerCommon: Array<{ path: string; version: string }>;
  };
  codeMirror: { mixedParserPassed: boolean; resolvedLezerRoots: string[] };
};

type ReleaseManifest = { version: string };

const checkoutRoot = path.resolve(__dirname, '../../../../..');
const artifactRoot = path.resolve(process.env.NOCOBASE_PACKAGE_BOUNDARY_ROOT || checkoutRoot);
const verifierPath = path.join(checkoutRoot, 'packages/core/runjs/scripts/verify-package-boundary.mjs');
const requiredEntries = [
  '@nocobase/runjs',
  '@nocobase/runjs/compiler',
  '@nocobase/runjs/js-template/client',
  '@nocobase/runjs/workspace/client-v2',
  '@nocobase/runjs/workspace/server',
];

describe('JS Template release boundary', () => {
  let report: BoundaryReport;

  beforeAll(() => {
    const output = execFileSync(process.execPath, [verifierPath, '--json', '--repository-root', artifactRoot], {
      cwd: checkoutRoot,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    report = JSON.parse(output) as BoundaryReport;
  }, 240_000);

  it('packs the canonical packages on the repository release version', () => {
    const releaseManifest = JSON.parse(
      fs.readFileSync(path.join(artifactRoot, 'lerna.json'), 'utf8'),
    ) as ReleaseManifest;
    const releaseVersion = releaseManifest.version;

    expect(report.packages.runjs).toMatchObject({
      name: '@nocobase/runjs',
      version: releaseVersion,
      tarball: expect.stringMatching(/\.tgz$/u),
    });
    expect(report.packages.plugin).toMatchObject({
      name: '@nocobase/plugin-js-template',
      version: releaseVersion,
      tarball: expect.stringMatching(/\.tgz$/u),
    });
  });

  it.each(['runjs', 'plugin'] as const)(
    'contains every %s public export target in the actual pack file list',
    (key) => {
      const packageReport = report.packages[key];

      expect(packageReport.exportTargets.length).toBeGreaterThan(0);
      expect(packageReport.fileCount).toBe(packageReport.files.length);
      expect(packageReport.files).toEqual(expect.arrayContaining(packageReport.exportTargets));
    },
  );

  it('imports the required runtime and declaration entries from the installed tarballs', () => {
    expect(report.requiredEntries.map((entry) => entry.specifier)).toEqual(requiredEntries);
    expect(report.requiredEntries.every((entry) => entry.exportCount > 0)).toBe(true);
    expect(
      report.requiredEntries.every((entry) => entry.resolvedPath.startsWith('node_modules/@nocobase/runjs/')),
    ).toBe(true);
    expect(report.typescript).toEqual({
      importedEntries: requiredEntries,
      resolutionModes: ['NodeNext', 'Node'],
      passed: true,
    });
  });

  it('bundles the browser root without server or Node-only modules', () => {
    expect(report.browserRoot.blockedModules).toEqual([]);
    expect(report.browserRoot.prohibitedInputs).toEqual([]);
    expect(report.browserRoot.inputs.some((input) => /@nocobase\/runjs\/lib\/index\.js$/u.test(input))).toBe(true);
  });

  it('uses one installed RunJS package and compatible CodeMirror parser identities', () => {
    expect(report.installations.runjs).toHaveLength(1);
    expect(report.installations.runjs[0]).toMatchObject({ version: report.packages.runjs.version });
    expect(report.installations.lezerCommon.length).toBeGreaterThan(0);
    expect(report.codeMirror).toMatchObject({ mixedParserPassed: true });
    expect(report.codeMirror.resolvedLezerRoots).toHaveLength(1);
  });
});
