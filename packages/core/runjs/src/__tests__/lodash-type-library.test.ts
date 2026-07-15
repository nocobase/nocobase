/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import lodashPackage from 'lodash/package.json';
import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';

import {
  RUNJS_LODASH_LIBRARY_LEVEL_LOADING_REASON,
  RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION,
  RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_LODASH_BRIDGE_PATH,
} from '../lodash-type-library';
import { collectRunJSTypeLibraryUsage } from '../typescript-library-usage';
import { collectRunJSTypeDeclarationGraphSync, generateRunJSTypeLibraryPacks } from '../type-packs/generator';

const temporaryDirectories: string[] = [];
const lodashTypesPackage = readPackageJson('@types/lodash/package.json');

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe('RunJS official lodash type library', () => {
  it('exports an independent library-level definition and default-or-namespace bridge', () => {
    expect(RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION).toMatchObject({
      id: 'lodash',
      libraryName: 'lodash',
      entry: 'lodash',
      triggers: ['lodash'],
      metadata: { loadGranularity: 'library', runtimeShape: 'default-or-namespace' },
    });
    expect(RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION.rootFiles).toEqual([
      { path: RUNJS_TYPESCRIPT_LODASH_BRIDGE_PATH, content: RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION },
    ]);
    expect(RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION).toContain("typeof import('lodash')");
    expect(RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION).toContain(
      'interface RunJSLodashLibrary extends RunJSOfficialLodashModule',
    );
  });

  it('recognizes direct, destructured, and aliased usage as one library-level request', () => {
    const requests = collectRunJSTypeLibraryUsage(ts, {
      files: [
        {
          path: 'src/main.ts',
          content: `
ctx.libs.lodash.get({}, 'id');
const { debounce } = ctx.libs.lodash;
const lodashAlias = ctx.libs.lodash;
lodashAlias.cloneDeep({ value: 1 });
debounce(() => {}, 10);
`,
        },
      ],
    });

    expect(requests).toEqual([{ kind: 'library', libraryName: 'lodash', packId: 'lodash' }]);
    expect(
      collectRunJSTypeLibraryUsage(ts, {
        files: [{ path: 'src/main.ts', content: "const libraryName = 'lodash';" }],
      }),
    ).toEqual([]);
  });

  it('generates the official closure with runtime and type package versions locked by content', async () => {
    const directory = await createTemporaryDirectory();
    const result = await generateRunJSTypeLibraryPacks({
      projectRoot: process.cwd(),
      outputDirectory: directory,
      definitions: [RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION],
    });
    const pack = result.packs.get('lodash');
    const manifest = result.manifest.find((entry) => entry.id === 'lodash');
    const dependencyPaths = pack?.dependencyFiles.map((file) => file.path) || [];
    const runtimePackageFile = pack?.dependencyFiles.find((file) => file.path === '/node_modules/lodash/package.json');
    const typesPackageFile = pack?.dependencyFiles.find(
      (file) => file.path === '/node_modules/@types/lodash/package.json',
    );

    expect(manifest).toMatchObject({
      id: 'lodash',
      sourcePackage: '@types/lodash',
      version: lodashTypesPackage.version,
      rootFileCount: 1,
    });
    expect(dependencyPaths).toContain('/node_modules/@types/lodash/index.d.ts');
    expect(dependencyPaths).toContain('/node_modules/@types/lodash/common/object.d.ts');
    expect(JSON.parse(runtimePackageFile?.content || '{}').version).toBe(lodashPackage.version);
    expect(JSON.parse(typesPackageFile?.content || '{}').version).toBe(lodashTypesPackage.version);
    expect(pack?.metadata).toMatchObject({
      loadGranularity: 'library',
      loadingReason: RUNJS_LODASH_LIBRARY_LEVEL_LOADING_REASON,
      runtimeShape: 'default-or-namespace',
    });
  });

  it('records why lodash/get cannot materially reduce the declaration closure', () => {
    const libraryGraph = collectRunJSTypeDeclarationGraphSync(process.cwd(), 'lodash');
    const getGraph = collectRunJSTypeDeclarationGraphSync(process.cwd(), 'lodash/get');

    expect(RUNJS_LODASH_LIBRARY_LEVEL_LOADING_REASON).toContain('same shared common declaration graph');
    expect(totalDeclarationBytes(getGraph.dependencyFiles)).toBeGreaterThanOrEqual(
      totalDeclarationBytes(libraryGraph.dependencyFiles) * 0.95,
    );
    expect(getGraph.dependencyFiles.some((file) => file.path.endsWith('/@types/lodash/common/object.d.ts'))).toBe(true);
  });

  it('matches the runtime loader default-or-namespace shape', async () => {
    const namespaceModule = await import('lodash');
    const resolved = namespaceModule.default || namespaceModule;

    expect(typeof namespaceModule.default).toBe('function');
    expect(typeof resolved.get).toBe('function');
    expect(typeof resolved.debounce).toBe('function');
    expect(resolved.get({ nested: { value: 7 } }, 'nested.value')).toBe(7);
  });
});

async function createTemporaryDirectory(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-runjs-lodash-pack-'));
  temporaryDirectories.push(directory);
  return directory;
}

function totalDeclarationBytes(files: readonly { path: string; content: string }[]): number {
  return files
    .filter((file) => /\.d\.(?:cts|mts|ts)$/u.test(file.path))
    .reduce((total, file) => total + Buffer.byteLength(file.content, 'utf8'), 0);
}

function readPackageJson(specifier: string): { version: string } {
  const value: unknown = JSON.parse(readFileSync(require.resolve(specifier), 'utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Invalid package metadata: ${specifier}`);
  const version = (value as Record<string, unknown>).version;
  if (typeof version !== 'string') throw new Error(`Missing package version: ${specifier}`);
  return { version };
}
