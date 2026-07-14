/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRsbuild } from '@rsbuild/core';
import { afterEach, describe, expect, it } from 'vitest';

import { runTypePackGeneratorCli } from '../../../scripts/generate-type-packs';
import {
  collectRunJSTypeDeclarationGraph,
  generateRunJSTypeLibraryPacks,
  RunJSTypePackArtifactsOutOfDateError,
  RunJSTypePackPathConflictError,
  toVirtualTypePackPath,
  type RunJSTypeLibraryPackDefinition,
} from '../generator';

const repositoryRoot = path.resolve(__dirname, '../../../../../..');
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe('RunJS type-pack generator', () => {
  it('collects the complete React declaration closure and package metadata', async () => {
    const graph = await collectRunJSTypeDeclarationGraph(repositoryRoot, 'react');
    const paths = graph.dependencyFiles.map((file) => file.path);

    expect(graph.sourcePackage).toBe('@types/react');
    expect(graph.version).toBe('18.3.18');
    expect(paths).toContain('/node_modules/@types/react/index.d.ts');
    expect(paths).toContain('/node_modules/@types/react/global.d.ts');
    expect(paths).toContain('/node_modules/@types/prop-types/index.d.ts');
    expect(paths).toContain('/node_modules/csstype/index.d.ts');
    expect(paths).toContain('/node_modules/@types/react/package.json');
    expect(paths).toContain('/node_modules/react/package.json');
    expect(paths.every((filePath) => declarationOrPackageJson(filePath))).toBe(true);
    expect(paths.some((filePath) => filePath.startsWith('/node_modules/typescript/lib/'))).toBe(false);
    expect(paths.some((filePath) => /\/(?:__tests__|tests?|fixtures)\//u.test(filePath))).toBe(false);
  });

  it('collects only the declaration closure needed by an antd component subpath', async () => {
    const graph = await collectRunJSTypeDeclarationGraph(repositoryRoot, 'antd/es/button');
    const paths = graph.dependencyFiles.map((file) => file.path);

    expect(paths).toContain('/node_modules/antd/es/button/index.d.ts');
    expect(paths).toContain('/node_modules/antd/es/button/button.d.ts');
    expect(paths).toContain('/node_modules/antd/package.json');
    expect(paths.some((filePath) => filePath.includes('/antd/es/table/'))).toBe(false);
    expect(paths.some((filePath) => filePath.includes('/antd/es/calendar/'))).toBe(false);
    expect(paths.every((filePath) => !/\.(?:js|map)$/u.test(filePath))).toBe(true);
  });

  it('normalizes macOS, Linux, and Windows node_modules paths to the same virtual path', () => {
    expect(toVirtualTypePackPath('/Users/demo/repo/node_modules/@types/react/index.d.ts')).toBe(
      '/node_modules/@types/react/index.d.ts',
    );
    expect(toVirtualTypePackPath('/home/demo/repo/node_modules/@types/react/index.d.ts')).toBe(
      '/node_modules/@types/react/index.d.ts',
    );
    expect(toVirtualTypePackPath('C:\\repo\\node_modules\\@types\\react\\index.d.ts')).toBe(
      '/node_modules/@types/react/index.d.ts',
    );
  });

  it('writes byte-identical output across consecutive runs and emits literal dynamic imports', async () => {
    const directory = await createTemporaryDirectory();
    const outputDirectory = path.join(directory, 'generated');
    const definitions: RunJSTypeLibraryPackDefinition[] = [
      { id: 'react', libraryName: 'react', entry: 'react', triggers: ['react'] },
      {
        id: 'antd/Button',
        libraryName: 'antd',
        entry: 'antd/es/button',
        dependencies: ['react'],
      },
    ];

    await generateRunJSTypeLibraryPacks({ projectRoot: repositoryRoot, outputDirectory, definitions });
    const first = await readDirectorySnapshot(outputDirectory);
    await generateRunJSTypeLibraryPacks({ projectRoot: repositoryRoot, outputDirectory, definitions });
    const second = await readDirectorySnapshot(outputDirectory);

    expect(second).toEqual(first);
    expect(second.get('loaders.ts')).toContain("import('./packs/react')");
    expect(second.get('loaders.ts')).toContain("import('./packs/antd-button')");
    expect(second.get('loaders.ts')).not.toMatch(/import\(`[^`]*\$\{/u);
    expect(second.get('manifest.ts')).not.toContain('interface CSSProperties');
  });

  it('changes the pack hash when version, entry, or declaration content changes', async () => {
    const directory = await createTemporaryDirectory();
    await writeFakePackage(directory, 'fake-lib', {
      version: '1.0.0',
      declarations: {
        'index.d.ts': "export { marker } from './shared';\n",
        'shared.d.ts': "export declare const marker: 'first';\n",
        'alternate.d.ts': "export declare const marker: 'alternate';\n",
      },
    });

    const first = await generateSingleFakePack(directory, {
      id: 'fake',
      libraryName: 'fake',
      entry: 'fake-lib',
    });
    const versionChanged = await generateSingleFakePack(directory, {
      id: 'fake',
      libraryName: 'fake',
      entry: 'fake-lib',
      version: '2.0.0',
    });
    const entryChanged = await generateSingleFakePack(directory, {
      id: 'fake',
      libraryName: 'fake',
      entry: 'fake-lib/alternate',
    });
    await fs.writeFile(
      path.join(directory, 'node_modules/fake-lib/shared.d.ts'),
      "export declare const marker: 'second';\n",
      'utf8',
    );
    const contentChanged = await generateSingleFakePack(directory, {
      id: 'fake',
      libraryName: 'fake',
      entry: 'fake-lib',
    });

    expect(versionChanged.contentHash).not.toBe(first.contentHash);
    expect(entryChanged.contentHash).not.toBe(first.contentHash);
    expect(contentChanged.contentHash).not.toBe(first.contentHash);
  });

  it('excludes files supplied by declared dependency packs and records manifest statistics', async () => {
    const directory = await createTemporaryDirectory();
    await writeFakePackage(directory, 'fake-base', {
      version: '1.2.3',
      declarations: { 'index.d.ts': 'export interface BaseValue { id: number }\n' },
    });
    await writeFakePackage(directory, 'fake-addon', {
      version: '4.5.6',
      declarations: {
        'index.d.ts': "import type { BaseValue } from 'fake-base';\nexport declare const value: BaseValue;\n",
      },
    });
    const outputDirectory = path.join(directory, 'generated');
    const result = await generateRunJSTypeLibraryPacks({
      projectRoot: directory,
      outputDirectory,
      definitions: [
        { id: 'base', libraryName: 'base', entry: 'fake-base' },
        { id: 'addon', libraryName: 'addon', entry: 'fake-addon', dependencies: ['base'] },
      ],
    });
    const base = result.packs.get('base');
    const addon = result.packs.get('addon');
    const addonManifest = result.manifest.find((entry) => entry.id === 'addon');

    expect(base?.dependencyFiles.some((file) => file.path.includes('/fake-base/'))).toBe(true);
    expect(addon?.dependencyFiles.some((file) => file.path.includes('/fake-base/'))).toBe(false);
    expect(addon?.dependencies).toEqual([{ id: 'base', version: base?.version, contentHash: base?.contentHash }]);
    expect(addonManifest).toMatchObject({
      entry: 'fake-addon',
      sourcePackage: 'fake-addon',
      version: '4.5.6',
      fileCount: addon?.dependencyFiles.length,
      dependencyFileCount: addon?.dependencyFiles.length,
      rootFileCount: 0,
    });
    expect(addonManifest?.rawBytes).toBeGreaterThan(0);
  });

  it('rejects different content for the same virtual path across packs', async () => {
    const directory = await createTemporaryDirectory();
    await writeFakePackage(directory, 'fake-a', {
      version: '1.0.0',
      declarations: { 'index.d.ts': 'export declare const a: true;\n' },
    });
    await writeFakePackage(directory, 'fake-b', {
      version: '1.0.0',
      declarations: { 'index.d.ts': 'export declare const b: true;\n' },
    });

    await expect(
      generateRunJSTypeLibraryPacks({
        projectRoot: directory,
        outputDirectory: path.join(directory, 'generated'),
        definitions: [
          {
            id: 'a',
            libraryName: 'a',
            entry: 'fake-a',
            rootFiles: [{ path: '/__runjs__/shared-bridge.d.ts', content: 'declare const shared: 1;' }],
          },
          {
            id: 'b',
            libraryName: 'b',
            entry: 'fake-b',
            rootFiles: [{ path: '/__runjs__/shared-bridge.d.ts', content: 'declare const shared: 2;' }],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(RunJSTypePackPathConflictError);
  });

  it('reports stale pack artifacts in check mode without rewriting them', async () => {
    const directory = await createTemporaryDirectory();
    const outputDirectory = path.join(directory, 'generated');
    const definitions: RunJSTypeLibraryPackDefinition[] = [{ id: 'react', libraryName: 'react', entry: 'react' }];
    await generateRunJSTypeLibraryPacks({ projectRoot: repositoryRoot, outputDirectory, definitions });
    const packPath = path.join(outputDirectory, 'packs/react.ts');
    const staleContent = `${await fs.readFile(packPath, 'utf8')}\n// stale\n`;
    await fs.writeFile(packPath, staleContent, 'utf8');

    let error: RunJSTypePackArtifactsOutOfDateError | undefined;
    try {
      await generateRunJSTypeLibraryPacks({
        projectRoot: repositoryRoot,
        outputDirectory,
        definitions,
        check: true,
      });
    } catch (caught) {
      if (caught instanceof RunJSTypePackArtifactsOutOfDateError) {
        error = caught;
      } else {
        throw caught;
      }
    }

    expect(error?.staleArtifacts).toContain('packs/react.ts');
    expect(await fs.readFile(packPath, 'utf8')).toBe(staleContent);
  });

  it('returns a non-zero CLI status and names outdated artifacts in --check mode', async () => {
    const directory = await createTemporaryDirectory();
    const outputDirectory = path.join(directory, 'generated');
    const messages: string[] = [];
    const io = {
      error(message: string) {
        messages.push(message);
      },
      log(message: string) {
        messages.push(message);
      },
    };
    expect(await runTypePackGeneratorCli([], { projectRoot: repositoryRoot, outputDirectory, io })).toBe(0);
    await fs.writeFile(path.join(outputDirectory, 'manifest.ts'), '// stale\n', 'utf8');

    expect(await runTypePackGeneratorCli(['--check'], { projectRoot: repositoryRoot, outputDirectory, io })).toBe(1);
    expect(messages.join('\n')).toContain('manifest.ts');
  });

  it('keeps declaration bodies out of the initial Rsbuild chunk and splits packs independently', async () => {
    const directory = await createTemporaryDirectory();
    await writeFakePackage(directory, 'fake-alpha', {
      version: '1.0.0',
      declarations: { 'index.d.ts': "export declare const alpha: 'RUNJS_ALPHA_DECLARATION_MARKER';\n" },
    });
    await writeFakePackage(directory, 'fake-beta', {
      version: '1.0.0',
      declarations: { 'index.d.ts': "export declare const beta: 'RUNJS_BETA_DECLARATION_MARKER';\n" },
    });
    const generatedDirectory = path.join(directory, 'generated');
    await generateRunJSTypeLibraryPacks({
      projectRoot: directory,
      outputDirectory: generatedDirectory,
      definitions: [
        { id: 'alpha', libraryName: 'alpha', entry: 'fake-alpha' },
        { id: 'beta', libraryName: 'beta', entry: 'fake-beta' },
      ],
    });
    const entryPath = path.join(directory, 'entry.ts');
    await fs.writeFile(
      entryPath,
      "import { generatedRunJSTypeLibraryPackLoaders } from './generated/loaders';\n" +
        'globalThis.__runjs_type_pack_loader_test__ = generatedRunJSTypeLibraryPackLoaders;\n',
      'utf8',
    );
    const outputDirectory = path.join(directory, 'dist');
    const rsbuild = await createRsbuild({
      cwd: directory,
      config: {
        source: { entry: { index: entryPath } },
        output: {
          cleanDistPath: true,
          distPath: { root: outputDirectory },
          sourceMap: false,
          target: 'web',
        },
        tools: {
          rspack(config) {
            config.performance = false;
            config.stats = 'errors-warnings';
          },
        },
      },
    });
    const buildResult = await rsbuild.build();
    await buildResult.close();
    const javascript = await readJavaScriptFiles(outputDirectory);
    const initial = [...javascript.entries()].find(([, content]) =>
      content.includes('__runjs_type_pack_loader_test__'),
    );
    const alphaChunk = [...javascript.entries()].find(([, content]) =>
      content.includes('RUNJS_ALPHA_DECLARATION_MARKER'),
    );
    const betaChunk = [...javascript.entries()].find(([, content]) =>
      content.includes('RUNJS_BETA_DECLARATION_MARKER'),
    );

    expect(initial).toBeTruthy();
    expect(initial?.[1]).not.toContain('RUNJS_ALPHA_DECLARATION_MARKER');
    expect(initial?.[1]).not.toContain('RUNJS_BETA_DECLARATION_MARKER');
    expect(alphaChunk).toBeTruthy();
    expect(betaChunk).toBeTruthy();
    expect(alphaChunk?.[0]).not.toBe(betaChunk?.[0]);
  }, 30_000);
});

function declarationOrPackageJson(filePath: string): boolean {
  return filePath.endsWith('package.json') || /\.d\.(?:cts|mts|ts)$/u.test(filePath);
}

async function createTemporaryDirectory(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-runjs-type-pack-'));
  temporaryDirectories.push(directory);
  return directory;
}

async function writeFakePackage(
  projectRoot: string,
  packageName: string,
  input: { version: string; declarations: Readonly<Record<string, string>> },
): Promise<void> {
  const packageDirectory = path.join(projectRoot, 'node_modules', ...packageName.split('/'));
  await fs.mkdir(packageDirectory, { recursive: true });
  await fs.writeFile(
    path.join(packageDirectory, 'package.json'),
    `${JSON.stringify({ name: packageName, version: input.version, types: 'index.d.ts' }, null, 2)}\n`,
    'utf8',
  );
  for (const [relativePath, content] of Object.entries(input.declarations)) {
    const fileName = path.join(packageDirectory, relativePath);
    await fs.mkdir(path.dirname(fileName), { recursive: true });
    await fs.writeFile(fileName, content, 'utf8');
  }
}

async function generateSingleFakePack(
  projectRoot: string,
  definition: RunJSTypeLibraryPackDefinition,
): Promise<NonNullable<ReturnType<Map<string, import('../../typescript-library').RunJSTypeLibraryPack>['get']>>> {
  const result = await generateRunJSTypeLibraryPacks({
    projectRoot,
    outputDirectory: path.join(projectRoot, `generated-${Math.random().toString(16).slice(2)}`),
    definitions: [definition],
  });
  const pack = result.packs.get(definition.id);
  if (!pack) {
    throw new Error(`Missing generated fake pack: ${definition.id}`);
  }
  return pack;
}

async function readDirectorySnapshot(directory: string, prefix = ''): Promise<Map<string, string>> {
  const snapshot = new Map<string, string>();
  const entries = await fs.readdir(path.join(directory, prefix), { withFileTypes: true });
  for (const entry of entries) {
    const relativePath = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      const nested = await readDirectorySnapshot(directory, relativePath);
      nested.forEach((content, fileName) => snapshot.set(fileName, content));
    } else if (entry.isFile()) {
      snapshot.set(relativePath, await fs.readFile(path.join(directory, relativePath), 'utf8'));
    }
  }
  return snapshot;
}

async function readJavaScriptFiles(directory: string): Promise<Map<string, string>> {
  const snapshot = await readDirectorySnapshot(directory);
  return new Map([...snapshot].filter(([fileName]) => fileName.endsWith('.js')));
}
