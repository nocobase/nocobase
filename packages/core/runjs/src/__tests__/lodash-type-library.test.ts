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
  clearNodeRunJSLodashTypeLibraryCacheForTests,
  getNodeRunJSLodashTypeLibraryDebugState,
  loadNodeRunJSLodashTypeLibraryFiles,
} from '../compiler/node-lodash-type-library';
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
  clearNodeRunJSLodashTypeLibraryCacheForTests();
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
      metadata: {
        loadGranularity: 'library',
        runtimeShape: 'default-or-namespace',
      },
    });
    expect(RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION.rootFiles).toEqual([
      {
        path: RUNJS_TYPESCRIPT_LODASH_BRIDGE_PATH,
        content: RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION,
      },
    ]);
    expect(RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION).toContain("typeof import('lodash')");
    expect(RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION).toContain(
      'interface RunJSLodashLibrary extends RunJSOfficialLodashModule',
    );
  });

  it('uses official lodash overloads, generics, deep cloning, mutation helpers, and debounce controls', () => {
    const diagnostics = getLodashDiagnostics(`
const record = { name: 'Ada', nested: { count: 1 } };
const directName: string = ctx.libs.lodash.get(record, 'name');
const nestedCount: number = ctx.libs.lodash.get(record, ['nested', 'count']);
const fallback: string = ctx.libs.lodash.get(record, 'missing', 'fallback');
const cloned = ctx.libs.lodash.cloneDeep(record);
cloned.nested.count.toFixed();
const updated = ctx.libs.lodash.set(record, 'nested.count', 2);
updated.name.toUpperCase();
const debounced = ctx.libs.lodash.debounce((value: number) => value + 1, 50);
debounced.cancel();
const flushed: number | undefined = debounced.flush();
const { get } = ctx.libs.lodash;
const destructuredName: typeof directName = get(record, 'name');
`);

    expect(diagnostics).toEqual([]);
  });

  it('reports misspelled APIs, invalid debounce arguments, and official inferred value errors', () => {
    const messages = getLodashDiagnostics(`
const record = { name: 'Ada', count: 1 };
ctx.libs.lodash.clonDeep(record);
ctx.libs.lodash.debounce(123, 50);
ctx.libs.lodash.get(record, 'name').toFixed();
const count: number = ctx.libs.lodash.get(record, 'name');
`).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));

    expect(messages.some((message) => /clonDeep/.test(message))).toBe(true);
    expect(messages.some((message) => /number|callable|Function/.test(message))).toBe(true);
    expect(messages.some((message) => /toFixed/.test(message))).toBe(true);
    expect(messages.some((message) => /string/.test(message) && /number/.test(message))).toBe(true);
  });

  it('recognizes direct, destructured, and aliased lodash usage as one library-level request', () => {
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

  it('generates the full official closure with both runtime and type package versions locked by content', async () => {
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
    const loaderSource = result.artifacts.get('loaders.ts') || '';
    const packSource = result.artifacts.get('packs/lodash.ts') || '';

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
    expect(loaderSource).not.toContain('LoDashStatic');
    expect(packSource).toContain('LoDashStatic');
    expect(pack?.metadata).toMatchObject({
      loadGranularity: 'library',
      loadingReason: RUNJS_LODASH_LIBRARY_LEVEL_LOADING_REASON,
      runtimeShape: 'default-or-namespace',
    });
    await expect(
      generateRunJSTypeLibraryPacks({
        projectRoot: process.cwd(),
        outputDirectory: directory,
        definitions: [RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION],
        check: true,
      }),
    ).resolves.toBeTruthy();
  });

  it('records why lodash/get cannot materially reduce the shared declaration closure', () => {
    const libraryGraph = collectRunJSTypeDeclarationGraphSync(process.cwd(), 'lodash');
    const getGraph = collectRunJSTypeDeclarationGraphSync(process.cwd(), 'lodash/get');
    const libraryBytes = totalDeclarationBytes(libraryGraph.dependencyFiles);
    const getBytes = totalDeclarationBytes(getGraph.dependencyFiles);

    expect(RUNJS_LODASH_LIBRARY_LEVEL_LOADING_REASON).toContain('same shared common declaration graph');
    expect(getBytes).toBeGreaterThanOrEqual(libraryBytes * 0.95);
    expect(getGraph.dependencyFiles.some((file) => file.path.endsWith('/@types/lodash/common/object.d.ts'))).toBe(true);
  });

  it('loads Node files only for lodash requests and caches the official closure once', () => {
    const noUsage = loadNodeRunJSLodashTypeLibraryFiles([]);
    expect(noUsage).toEqual({ dependencyFiles: [], rootFiles: [] });
    expect(getNodeRunJSLodashTypeLibraryDebugState()).toMatchObject({ cached: false, loadCount: 0 });

    const requests = [{ kind: 'library' as const, libraryName: 'lodash', packId: 'lodash' }];
    const first = loadNodeRunJSLodashTypeLibraryFiles(requests);
    const second = loadNodeRunJSLodashTypeLibraryFiles(requests);

    expect(second).toBe(first);
    expect(first.rootFiles).toHaveLength(1);
    expect(first.rootFiles[0].path).toBe(RUNJS_TYPESCRIPT_LODASH_BRIDGE_PATH);
    expect(first.dependencyFiles.some((file) => file.path.endsWith('/@types/lodash/index.d.ts'))).toBe(true);
    expect(getNodeRunJSLodashTypeLibraryDebugState()).toMatchObject({ cached: true, loadCount: 1 });
  });

  it('matches the runtime loader default-or-namespace resolution shape', async () => {
    const namespaceModule = await import('lodash');
    const resolved = namespaceModule.default || namespaceModule;

    expect(typeof namespaceModule).toBe('object');
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
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid package metadata: ${specifier}`);
  }
  const version = (value as Record<string, unknown>).version;
  if (typeof version !== 'string') {
    throw new Error(`Missing package version: ${specifier}`);
  }
  return { version };
}

function getLodashDiagnostics(code: string): ts.Diagnostic[] {
  const graph = collectRunJSTypeDeclarationGraphSync(process.cwd(), 'lodash');
  const codePath = '/src/main.ts';
  const contextPath = '/__runjs__/lodash-test-context.d.ts';
  const virtualFiles = new Map<string, string>(graph.dependencyFiles.map((file) => [file.path, file.content]));
  virtualFiles.set(RUNJS_TYPESCRIPT_LODASH_BRIDGE_PATH, RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION);
  virtualFiles.set(
    contextPath,
    'interface RunJSContext { libs: { lodash: RunJSLodashLibrary } }\ndeclare const ctx: RunJSContext;\n',
  );
  virtualFiles.set(codePath, code);
  const options: ts.CompilerOptions = {
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2020,
    types: [],
  };
  const baseHost = ts.createCompilerHost(options, true);
  const normalize = (fileName: string): string => fileName.replace(/\\/gu, '/');
  const getVirtualFile = (fileName: string): string | undefined => virtualFiles.get(normalize(fileName));
  const host: ts.CompilerHost = {
    ...baseHost,
    directoryExists(directoryName) {
      const directory = normalize(directoryName).replace(/\/$/u, '');
      return (
        [...virtualFiles.keys()].some((fileName) => fileName.startsWith(`${directory}/`)) ||
        Boolean(baseHost.directoryExists?.(directoryName))
      );
    },
    fileExists(fileName) {
      return getVirtualFile(fileName) !== undefined || baseHost.fileExists(fileName);
    },
    getCurrentDirectory() {
      return '/';
    },
    getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
      const content = getVirtualFile(fileName);
      return content === undefined
        ? baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile)
        : ts.createSourceFile(normalize(fileName), content, languageVersion, true, ts.ScriptKind.TS);
    },
    readFile(fileName) {
      return getVirtualFile(fileName) ?? baseHost.readFile(fileName);
    },
    realpath(fileName) {
      return normalize(fileName);
    },
  };
  const program = ts.createProgram({
    rootNames: [contextPath, RUNJS_TYPESCRIPT_LODASH_BRIDGE_PATH, codePath],
    options,
    host,
  });
  return [...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics()].filter(
    (diagnostic) => normalize(diagnostic.file?.fileName || '') === codePath,
  );
}
