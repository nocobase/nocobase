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

import { runCompletionCatalogGeneratorCli } from '../../../scripts/generate-completion-catalogs';
import {
  collectRunJSCompletionCatalog,
  generateRunJSCompletionCatalogs,
  RunJSCompletionCatalogArtifactsOutOfDateError,
  type RunJSCompletionCatalogDefinition,
} from '../generator';

const repositoryRoot = path.resolve(__dirname, '../../../../../..');
const temporaryDirectories: string[] = [];

const realDefinitions: readonly RunJSCompletionCatalogDefinition[] = [
  { id: 'antd', moduleName: 'antd', initialBudgetBytes: 48 * 1024 },
  { id: 'antd-icons', moduleName: '@ant-design/icons', initialBudgetBytes: 24 * 1024 },
];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe('RunJS completion catalog generator', () => {
  it('reads current Ant Design public value exports through the TypeScript checker', async () => {
    const catalog = await collectRunJSCompletionCatalog(repositoryRoot, realDefinitions[0]);
    const names = new Set(catalog.entries.map((entry) => entry.name));

    expect(catalog.version).toBe('5.24.2');
    expect(names.has('Button')).toBe(true);
    expect(names.has('Table')).toBe(true);
    expect(names.has('message')).toBe(true);
    expect(names.has('ButtonProps')).toBe(false);
    expect(catalog.entries.find((entry) => entry.name === 'Button')).toMatchObject({
      category: 'component',
      packId: 'antd/Button',
      source: 'antd',
    });
  });

  it('reads current Ant Design Icons exports and maps each icon to the analyzer group', async () => {
    const catalog = await collectRunJSCompletionCatalog(repositoryRoot, realDefinitions[1]);
    const plus = catalog.entries.find((entry) => entry.name === 'PlusOutlined');

    expect(catalog.version).toBe('5.6.1');
    expect(catalog.entries.length).toBeGreaterThan(800);
    expect(plus).toMatchObject({ category: 'icon', group: 'P', packId: 'antd-icons/P' });
    expect(catalog.entries.some((entry) => entry.name === 'createFromIconfontCN')).toBe(true);
  });

  it('generates deterministic catalogs and detects stale dependency export changes', async () => {
    const directory = await createTemporaryDirectory();
    await writeFakePackage(directory, 'fake-catalog', '1.0.0', [
      'export declare const Alpha: () => null;',
      'export declare function helper(): void;',
    ]);
    const outputDirectory = path.join(directory, 'generated');
    const definitions: readonly RunJSCompletionCatalogDefinition[] = [
      { id: 'antd', moduleName: 'fake-catalog', initialBudgetBytes: 8192 },
    ];
    const first = await generateRunJSCompletionCatalogs({ projectRoot: directory, outputDirectory, definitions });
    const firstSnapshot = await readDirectorySnapshot(outputDirectory);
    await generateRunJSCompletionCatalogs({ projectRoot: directory, outputDirectory, definitions });
    expect(await readDirectorySnapshot(outputDirectory)).toEqual(firstSnapshot);

    await writeFakePackage(directory, 'fake-catalog', '1.0.1', [
      'export declare const Beta: () => null;',
      'export declare function helper(): void;',
    ]);
    const changed = await generateRunJSCompletionCatalogs({
      projectRoot: directory,
      outputDirectory: path.join(directory, 'changed'),
      definitions,
    });
    expect(changed.catalogs.get('antd')?.contentHash).not.toBe(first.catalogs.get('antd')?.contentHash);
    expect(changed.catalogs.get('antd')?.entries.some((entry) => entry.name === 'Beta')).toBe(true);
    expect(changed.catalogs.get('antd')?.entries.some((entry) => entry.name === 'Alpha')).toBe(false);

    await expect(
      generateRunJSCompletionCatalogs({ projectRoot: directory, outputDirectory, definitions, check: true }),
    ).rejects.toBeInstanceOf(RunJSCompletionCatalogArtifactsOutOfDateError);
  });

  it('checks the tracked manifest without requiring ignored catalog artifacts', async () => {
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

    expect(await runCompletionCatalogGeneratorCli([], { projectRoot: repositoryRoot, outputDirectory, io })).toBe(0);
    await fs.rm(path.join(outputDirectory, 'antd.ts'), { force: true });
    await fs.rm(path.join(outputDirectory, 'icons.ts'), { force: true });
    await fs.rm(path.join(outputDirectory, 'loaders.ts'), { force: true });
    expect(
      await runCompletionCatalogGeneratorCli(['--check'], { projectRoot: repositoryRoot, outputDirectory, io }),
    ).toBe(0);

    await fs.writeFile(path.join(outputDirectory, 'manifest.ts'), '// stale\n', 'utf8');
    expect(
      await runCompletionCatalogGeneratorCli(['--check'], { projectRoot: repositoryRoot, outputDirectory, io }),
    ).toBe(1);
    expect(messages.join('\n')).toContain('manifest.ts');
  });

  it('keeps an over-budget Icons catalog in an independent async Rsbuild chunk', async () => {
    const directory = await createTemporaryDirectory();
    const generatedDirectory = path.join(directory, 'generated');
    const result = await generateRunJSCompletionCatalogs({
      projectRoot: repositoryRoot,
      outputDirectory: generatedDirectory,
      definitions: realDefinitions,
    });
    expect(result.manifest.find((entry) => entry.id === 'antd')).toMatchObject({ async: false });
    expect(result.manifest.find((entry) => entry.id === 'antd-icons')).toMatchObject({ async: true });
    expect(result.artifacts.get('loaders.ts')).toContain("import('./icons')");

    const entryPath = path.join(directory, 'entry.ts');
    await fs.writeFile(
      entryPath,
      "import { loadGeneratedRunJSAntdCompletionCatalog, loadGeneratedRunJSAntdIconsCompletionCatalog } from './generated/loaders';\n" +
        'globalThis.__runjs_catalog_loader_test__ = { loadGeneratedRunJSAntdCompletionCatalog, loadGeneratedRunJSAntdIconsCompletionCatalog };\n',
      'utf8',
    );
    const outputDirectory = path.join(directory, 'dist');
    const rsbuild = await createRsbuild({
      cwd: directory,
      config: {
        source: { entry: { index: entryPath } },
        output: { cleanDistPath: true, distPath: { root: outputDirectory }, sourceMap: false, target: 'web' },
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
    const initial = [...javascript.entries()].find(([, content]) => content.includes('__runjs_catalog_loader_test__'));
    const iconsChunk = [...javascript.entries()].find(([, content]) => content.includes('PlusOutlined'));

    expect(initial).toBeTruthy();
    expect(initial?.[1]).toContain('Button');
    expect(initial?.[1]).not.toContain('PlusOutlined');
    expect(iconsChunk).toBeTruthy();
    expect(iconsChunk?.[0]).not.toBe(initial?.[0]);
  }, 30_000);
});

async function createTemporaryDirectory(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-runjs-completion-catalog-'));
  temporaryDirectories.push(directory);
  return directory;
}

async function writeFakePackage(
  projectRoot: string,
  packageName: string,
  version: string,
  declarations: readonly string[],
): Promise<void> {
  const packageDirectory = path.join(projectRoot, 'node_modules', packageName);
  await fs.mkdir(packageDirectory, { recursive: true });
  await fs.writeFile(
    path.join(packageDirectory, 'package.json'),
    `${JSON.stringify({ name: packageName, version, types: 'index.d.ts' }, null, 2)}\n`,
    'utf8',
  );
  await fs.writeFile(path.join(packageDirectory, 'index.d.ts'), `${declarations.join('\n')}\n`, 'utf8');
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
