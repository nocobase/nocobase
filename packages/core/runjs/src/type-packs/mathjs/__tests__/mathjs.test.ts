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
  RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION,
  RUNJS_TYPESCRIPT_MATHJS_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_MATHJS_BRIDGE_PATH,
} from '..';
import {
  clearNodeRunJSMathTypeLibraryCacheForTests,
  getNodeRunJSMathTypeLibraryDebugState,
  loadNodeRunJSMathTypeLibraryFiles,
} from '../node';

interface PackageJsonRecord {
  version?: string;
}

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');
const contextDeclaration = `
interface RunJSMathTestContext {
  libs: { math: RunJSMathLibrary };
}
declare const ctx: RunJSMathTestContext;
`;
let outputDirectory: string;
let mathPack: RunJSTypeLibraryPack;
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
  outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-mathjs-type-pack-'));
  const result = await generateRunJSTypeLibraryPacks({
    projectRoot: repositoryRoot,
    outputDirectory,
    definitions: [RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION],
  });
  const generatedPack = result.packs.get('mathjs');
  if (!generatedPack) {
    throw new Error('The mathjs type pack was not generated.');
  }
  mathPack = generatedPack;
  generatedArtifacts = result.artifacts;
  generatedManifest = result.manifest;
});

afterAll(async () => {
  clearNodeRunJSMathTypeLibraryCacheForTests();
  await fs.rm(outputDirectory, { recursive: true, force: true });
});

describe('RunJS mathjs official type library', () => {
  it('defines an independent namespace-shaped library pack', () => {
    expect(RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION).toMatchObject({
      id: 'mathjs',
      libraryName: 'math',
      entry: 'mathjs',
      triggers: ['mathjs'],
      metadata: {
        loadGranularity: 'library',
        runtimeShape: 'namespace',
      },
    });
    expect(RUNJS_TYPESCRIPT_MATHJS_BRIDGE_DECLARATION).toContain("typeof import('mathjs')");
    expect(RUNJS_TYPESCRIPT_MATHJS_BRIDGE_DECLARATION).toContain(
      'interface RunJSMathLibrary extends RunJSOfficialMathModule',
    );
  });

  it('generates the official declaration closure and manifest without putting declarations in the loader chunk', async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(repositoryRoot, 'node_modules/mathjs/package.json'), 'utf8'),
    ) as PackageJsonRecord;
    const manifest = generatedManifest.find((entry) => entry.id === 'mathjs');
    const dependencyPaths = mathPack.dependencyFiles.map((file) => file.path);
    const loaderSource = generatedArtifacts.get('loaders.ts') || '';
    const packSource = generatedArtifacts.get('packs/mathjs.ts') || '';

    expect(mathPack.version).toBe(packageJson.version);
    expect(dependencyPaths).toEqual(
      expect.arrayContaining([
        '/node_modules/mathjs/types/index.d.ts',
        '/node_modules/mathjs/package.json',
        '/node_modules/decimal.js/decimal.d.ts',
      ]),
    );
    expect(manifest).toMatchObject({
      id: 'mathjs',
      sourcePackage: 'mathjs',
      version: packageJson.version,
      fileCount: mathPack.rootFiles.length + mathPack.dependencyFiles.length,
      rawBytes: mathPack.metadata?.rawBytes,
      contentHash: mathPack.contentHash,
    });
    expect(manifest?.contentHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(loaderSource).not.toContain('interface MathJsInstance');
    expect(packSource).toContain('interface MathJsInstance');
    await expect(
      generateRunJSTypeLibraryPacks({
        projectRoot: repositoryRoot,
        outputDirectory,
        definitions: [RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION],
        check: true,
      }),
    ).resolves.toBeTruthy();
  });

  it('uses official numeric, matrix, and expression signatures instead of unknown placeholders', () => {
    const program = createMathProgram(
      mathPack,
      `
const evaluated = ctx.libs.math.evaluate('2 + 3');
const rounded: number = ctx.libs.math.round(2.345, 2);
const matrix = ctx.libs.math.matrix([[1, 2], [3, 4]]);
const matrixSize: number[] = matrix.size();
const product = ctx.libs.math.multiply(matrix, 2);
const productSize: number[] = product.size();
const { round } = ctx.libs.math;
const aliased: number = round(4.56, 1);
void evaluated;
void rounded;
void matrixSize;
void productSize;
void aliased;
`,
    );

    expect(getOfficialTypeLibraryMainDiagnostics(program)).toEqual([]);
    expect(getOfficialTypeLibraryExpressionType(program, 'ctx.libs.math.round(2.345, 2)')).toBe('number');
    expect(getOfficialTypeLibraryExpressionType(program, 'ctx.libs.math.matrix([[1, 2], [3, 4]])')).toContain('Matrix');
    expect(getOfficialTypeLibraryExpressionType(program, 'ctx.libs.math.multiply(matrix, 2)')).toContain('Matrix');
  });

  it('reports official member and argument diagnostics consistently in generated and Node packs', () => {
    const source = `
ctx.libs.math.evaluate();
ctx.libs.math.round('2.5', 2);
ctx.libs.math.matrx([[1, 2]]);
`;
    const browserDiagnostics = getOfficialTypeLibraryMainDiagnostics(createMathProgram(mathPack, source));
    const nodeFiles = loadNodeRunJSMathTypeLibraryFiles(
      [{ kind: 'library', libraryName: 'math', packId: 'mathjs' }],
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
    expect(messages).toContain('Expected 1-2 arguments');
    expect(messages).toContain('No overload matches this call');
    expect(messages).toContain("Property 'matrx' does not exist");
  });

  it('detects direct, destructured, and aliased math usage without requesting Formula.js', () => {
    const requests = collectRunJSTypeLibraryUsage(ts, {
      files: [
        {
          path: 'src/main.ts',
          content: `
ctx.libs.math.evaluate('2 + 2');
const { round } = ctx.libs.math;
const libs = ctx.libs;
const math = libs.math;
round(2.5);
math.matrix([[1]]);
`,
        },
      ],
    });

    expect(requests).toEqual([{ kind: 'library', libraryName: 'math', packId: 'mathjs' }]);
  });

  it('loads the Node closure only for math requests and caches it once', () => {
    clearNodeRunJSMathTypeLibraryCacheForTests();
    const formulaRequest: RunJSTypeLibraryRequest = {
      kind: 'library',
      libraryName: 'formula',
      packId: 'formulajs',
    };
    const mathRequest: RunJSTypeLibraryRequest = {
      kind: 'library',
      libraryName: 'math',
      packId: 'mathjs',
    };

    expect(loadNodeRunJSMathTypeLibraryFiles([formulaRequest], repositoryRoot)).toEqual({
      dependencyFiles: [],
      rootFiles: [],
    });
    const first = loadNodeRunJSMathTypeLibraryFiles([mathRequest], repositoryRoot);
    const second = loadNodeRunJSMathTypeLibraryFiles([mathRequest], repositoryRoot);

    expect(second).toBe(first);
    expect(first.rootFiles).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: RUNJS_TYPESCRIPT_MATHJS_BRIDGE_PATH })]),
    );
    expect(first.dependencyFiles.map((file) => file.path)).not.toContain(
      '/node_modules/@formulajs/formulajs/types/cjs/index.d.cts',
    );
    expect(getNodeRunJSMathTypeLibraryDebugState()).toEqual({ cachedProjectCount: 1, loadCount: 1 });
  });

  it('matches the namespace shape used by the runtime loader', async () => {
    const namespaceModule = await import('mathjs');

    expect(typeof namespaceModule.evaluate).toBe('function');
    expect(namespaceModule.evaluate('2 + 3')).toBe(5);
    expect(namespaceModule.round(2.345, 2)).toBe(2.35);
  });
});

function createMathProgram(pack: RunJSTypeLibraryPack, source: string) {
  return createOfficialTypeLibraryTestProgram({
    source,
    contextDeclaration,
    files: [...pack.rootFiles, ...pack.dependencyFiles],
  });
}
