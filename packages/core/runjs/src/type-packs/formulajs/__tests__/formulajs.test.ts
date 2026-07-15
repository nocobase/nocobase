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
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { RunJSTypeLibraryPack } from '../../../typescript-library';
import { collectRunJSTypeLibraryUsage } from '../../../typescript-library-usage';
import { generateRunJSTypeLibraryPacks } from '../../generator';
import {
  RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION,
  RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_PATH,
} from '..';

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');
let outputDirectory: string;
let formulaPack: RunJSTypeLibraryPack;
let generatedManifest: Awaited<ReturnType<typeof generateRunJSTypeLibraryPacks>>['manifest'];

beforeAll(async () => {
  outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-formulajs-type-pack-'));
  const result = await generateRunJSTypeLibraryPacks({
    projectRoot: repositoryRoot,
    outputDirectory,
    definitions: [RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION],
  });
  const generatedPack = result.packs.get('formulajs');
  if (!generatedPack) throw new Error('The Formula.js type pack was not generated.');
  formulaPack = generatedPack;
  generatedManifest = result.manifest;
});

afterAll(async () => {
  await fs.rm(outputDirectory, { recursive: true, force: true });
});

describe('RunJS Formula.js official type library', () => {
  it('defines an independent default-or-namespace bridge', () => {
    expect(RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION).toMatchObject({
      id: 'formulajs',
      libraryName: 'formula',
      entry: '@formulajs/formulajs',
      triggers: ['formulajs'],
      metadata: { loadGranularity: 'library', runtimeShape: 'default-or-namespace' },
    });
    expect(RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION).toContain("typeof import('@formulajs/formulajs')");
    expect(RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION).toContain(
      'interface RunJSFormulaLibrary extends RunJSOfficialFormulaModule',
    );
  });

  it('generates the official declaration closure and stable manifest', async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(repositoryRoot, 'node_modules/@formulajs/formulajs/package.json'), 'utf8'),
    ) as { version?: string };
    const manifest = generatedManifest.find((entry) => entry.id === 'formulajs');
    const dependencyPaths = formulaPack.dependencyFiles.map((file) => file.path);

    expect(formulaPack.version).toBe(packageJson.version);
    expect(formulaPack.rootFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION,
          path: RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_PATH,
        }),
      ]),
    );
    expect(dependencyPaths).toEqual(
      expect.arrayContaining([
        '/node_modules/@formulajs/formulajs/package.json',
        '/node_modules/@formulajs/formulajs/types/cjs/index.d.cts',
      ]),
    );
    expect(manifest).toMatchObject({
      id: 'formulajs',
      sourcePackage: '@formulajs/formulajs',
      version: packageJson.version,
      fileCount: formulaPack.rootFiles.length + formulaPack.dependencyFiles.length,
      rawBytes: formulaPack.metadata?.rawBytes,
      contentHash: formulaPack.contentHash,
    });
    expect(manifest?.contentHash).toMatch(/^[a-f0-9]{64}$/u);
  });

  it('detects direct, destructured, and aliased Formula.js usage without requesting mathjs', () => {
    const requests = collectRunJSTypeLibraryUsage(ts, {
      files: [
        {
          path: 'src/main.ts',
          content: `
ctx.libs.formula.SUM(1, 2);
const { AVERAGE } = ctx.libs.formula;
const formula = ctx.libs.formula;
AVERAGE(1, 2);
formula.ABS(-1);
`,
        },
      ],
    });

    expect(requests).toEqual([{ kind: 'library', libraryName: 'formula', packId: 'formulajs' }]);
  });

  it('matches the default-or-namespace shape used by the runtime loader', async () => {
    const namespaceModule = await import('@formulajs/formulajs');
    const moduleWithDefault = namespaceModule as typeof namespaceModule & { default?: typeof namespaceModule };
    const resolved = moduleWithDefault.default || namespaceModule;

    expect(typeof resolved.SUM).toBe('function');
    expect(resolved.SUM(1, 2, 3)).toBe(6);
    expect(resolved.AVERAGE(1, 2, 3)).toBe(2);
  });
});
