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

import type { RunJSTypeLibraryPack, RunJSTypeLibraryRequest } from '../../../typescript-library';
import { collectRunJSTypeLibraryUsage } from '../../../typescript-library-usage';
import {
  createOfficialTypeLibraryTestProgram,
  formatOfficialTypeLibraryDiagnostic,
  getOfficialTypeLibraryExpressionType,
  getOfficialTypeLibraryMainDiagnostics,
} from '../../__tests__/test-helpers';
import { generateRunJSTypeLibraryPacks } from '../../generator';
import {
  RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION,
  RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_PATH,
} from '..';
import {
  clearNodeRunJSFormulaTypeLibraryCacheForTests,
  getNodeRunJSFormulaTypeLibraryDebugState,
  loadNodeRunJSFormulaTypeLibraryFiles,
} from '../node';

interface PackageJsonRecord {
  version?: string;
}

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');
const contextDeclaration = `
interface RunJSFormulaTestContext {
  libs: { formula: RunJSFormulaLibrary };
}
declare const ctx: RunJSFormulaTestContext;
`;
let outputDirectory: string;
let formulaPack: RunJSTypeLibraryPack;
let generatedArtifacts: ReadonlyMap<string, string>;
let generatedManifest: readonly {
  id: string;
  sourcePackage: string;
  version: string;
  fileCount: number;
  rawBytes: number;
  contentHash: string;
}[];

beforeAll(async () => {
  outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-formulajs-type-pack-'));
  const result = await generateRunJSTypeLibraryPacks({
    projectRoot: repositoryRoot,
    outputDirectory,
    definitions: [RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION],
  });
  const generatedPack = result.packs.get('formulajs');
  if (!generatedPack) {
    throw new Error('The Formula.js type pack was not generated.');
  }
  formulaPack = generatedPack;
  generatedArtifacts = result.artifacts;
  generatedManifest = result.manifest;
});

afterAll(async () => {
  clearNodeRunJSFormulaTypeLibraryCacheForTests();
  await fs.rm(outputDirectory, { recursive: true, force: true });
});

describe('RunJS Formula.js official type library', () => {
  it('defines an independent default-or-namespace library pack', () => {
    expect(RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION).toMatchObject({
      id: 'formulajs',
      libraryName: 'formula',
      entry: '@formulajs/formulajs',
      triggers: ['formulajs'],
      metadata: {
        loadGranularity: 'library',
        runtimeShape: 'default-or-namespace',
      },
    });
    expect(RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION).toContain("typeof import('@formulajs/formulajs')");
    expect(RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION).toContain(
      'interface RunJSFormulaLibrary extends RunJSOfficialFormulaModule',
    );
  });

  it('generates the official declaration and manifest without putting its body in the loader chunk', async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(repositoryRoot, 'node_modules/@formulajs/formulajs/package.json'), 'utf8'),
    ) as PackageJsonRecord;
    const manifest = generatedManifest.find((entry) => entry.id === 'formulajs');
    const dependencyPaths = formulaPack.dependencyFiles.map((file) => file.path);
    const loaderSource = generatedArtifacts.get('loaders.ts') || '';
    const packSource = generatedArtifacts.get('packs/formulajs.ts') || '';

    expect(formulaPack.version).toBe(packageJson.version);
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
    expect(loaderSource).not.toContain('Returns the average of its arguments');
    expect(packSource).toContain('Returns the average of its arguments');
    await expect(
      generateRunJSTypeLibraryPacks({
        projectRoot: repositoryRoot,
        outputDirectory,
        definitions: [RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION],
        check: true,
      }),
    ).resolves.toBeTruthy();
  });

  it('uses the package SUM, AVERAGE, and formula signatures', () => {
    const program = createFormulaProgram(
      formulaPack,
      `
const total: number = ctx.libs.formula.SUM(1, 2, 3);
const average = ctx.libs.formula.AVERAGE(1, 2, 3);
const absolute: number | Error = ctx.libs.formula.ABS(-5);
const rounded = ctx.libs.formula.ROUND(2.345, 2);
const { SUM } = ctx.libs.formula;
const aliasedTotal: number = SUM([1, 2], 3);
void total;
void average;
void absolute;
void rounded;
void aliasedTotal;
`,
    );

    expect(getOfficialTypeLibraryMainDiagnostics(program)).toEqual([]);
    expect(getOfficialTypeLibraryExpressionType(program, 'ctx.libs.formula.SUM(1, 2, 3)')).toBe('number');
    expect(getOfficialTypeLibraryExpressionType(program, 'ctx.libs.formula.SUM')).toBe('(...args: any[]) => number');
    expect(getOfficialTypeLibraryExpressionType(program, 'ctx.libs.formula.AVERAGE')).not.toBe('unknown');
  });

  it('reports official member and arity diagnostics consistently in generated and Node packs', () => {
    const source = `
ctx.libs.formula.ABS();
ctx.libs.formula.ROUND(1);
ctx.libs.formula.AVERGE(1, 2);
`;
    const browserDiagnostics = getOfficialTypeLibraryMainDiagnostics(createFormulaProgram(formulaPack, source));
    const nodeFiles = loadNodeRunJSFormulaTypeLibraryFiles(
      [{ kind: 'library', libraryName: 'formula', packId: 'formulajs' }],
      repositoryRoot,
    );
    const nodeDiagnostics = getOfficialTypeLibraryMainDiagnostics(
      createOfficialTypeLibraryTestProgram({
        source,
        contextDeclaration,
        files: [...nodeFiles.rootFiles, ...nodeFiles.dependencyFiles],
      }),
    );
    const messages = browserDiagnostics.map(formatOfficialTypeLibraryDiagnostic).join('\n');

    expect(browserDiagnostics.map(formatOfficialTypeLibraryDiagnostic)).toEqual(
      nodeDiagnostics.map(formatOfficialTypeLibraryDiagnostic),
    );
    expect(messages).toContain('Expected 1 arguments');
    expect(messages).toContain('Expected 2 arguments');
    expect(messages).toContain("Property 'AVERGE' does not exist");
  });

  it('detects direct, destructured, and aliased Formula.js usage without requesting mathjs', () => {
    const requests = collectRunJSTypeLibraryUsage(ts, {
      files: [
        {
          path: 'src/main.ts',
          content: `
ctx.libs.formula.SUM(1, 2);
const { AVERAGE } = ctx.libs.formula;
const libs = ctx.libs;
const formula = libs.formula;
AVERAGE(1, 2);
formula.ABS(-1);
`,
        },
      ],
    });

    expect(requests).toEqual([{ kind: 'library', libraryName: 'formula', packId: 'formulajs' }]);
  });

  it('loads the Node declaration only for Formula.js requests and caches it once', () => {
    clearNodeRunJSFormulaTypeLibraryCacheForTests();
    const mathRequest: RunJSTypeLibraryRequest = {
      kind: 'library',
      libraryName: 'math',
      packId: 'mathjs',
    };
    const formulaRequest: RunJSTypeLibraryRequest = {
      kind: 'library',
      libraryName: 'formula',
      packId: 'formulajs',
    };

    expect(loadNodeRunJSFormulaTypeLibraryFiles([mathRequest], repositoryRoot)).toEqual({
      dependencyFiles: [],
      rootFiles: [],
    });
    const first = loadNodeRunJSFormulaTypeLibraryFiles([formulaRequest], repositoryRoot);
    const second = loadNodeRunJSFormulaTypeLibraryFiles([formulaRequest], repositoryRoot);

    expect(second).toBe(first);
    expect(first.rootFiles).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_PATH })]),
    );
    expect(first.dependencyFiles.map((file) => file.path)).not.toContain('/node_modules/mathjs/types/index.d.ts');
    expect(getNodeRunJSFormulaTypeLibraryDebugState()).toEqual({ cachedProjectCount: 1, loadCount: 1 });
  });

  it('matches the default-or-namespace resolution used by the runtime loader', async () => {
    const namespaceModule = await import('@formulajs/formulajs');
    const moduleWithDefault = namespaceModule as typeof namespaceModule & { default?: typeof namespaceModule };
    const resolved = moduleWithDefault.default || namespaceModule;

    expect(typeof resolved.SUM).toBe('function');
    expect(resolved.SUM(1, 2, 3)).toBe(6);
    expect(resolved.AVERAGE(1, 2, 3)).toBe(2);
  });
});

function createFormulaProgram(pack: RunJSTypeLibraryPack, source: string) {
  return createOfficialTypeLibraryTestProgram({
    source,
    contextDeclaration,
    files: [...pack.rootFiles, ...pack.dependencyFiles],
  });
}
