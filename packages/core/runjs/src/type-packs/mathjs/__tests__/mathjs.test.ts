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
  RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION,
  RUNJS_TYPESCRIPT_MATHJS_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_MATHJS_BRIDGE_PATH,
} from '..';

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');
let outputDirectory: string;
let mathPack: RunJSTypeLibraryPack;
let generatedManifest: Awaited<ReturnType<typeof generateRunJSTypeLibraryPacks>>['manifest'];

beforeAll(async () => {
  outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-mathjs-type-pack-'));
  const result = await generateRunJSTypeLibraryPacks({
    projectRoot: repositoryRoot,
    outputDirectory,
    definitions: [RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION],
  });
  const generatedPack = result.packs.get('mathjs');
  if (!generatedPack) throw new Error('The mathjs type pack was not generated.');
  mathPack = generatedPack;
  generatedManifest = result.manifest;
});

afterAll(async () => {
  await fs.rm(outputDirectory, { recursive: true, force: true });
});

describe('RunJS mathjs official type library', () => {
  it('defines an independent namespace-shaped bridge', () => {
    expect(RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION).toMatchObject({
      id: 'mathjs',
      libraryName: 'math',
      entry: 'mathjs',
      triggers: ['mathjs'],
      metadata: { loadGranularity: 'library', runtimeShape: 'namespace' },
    });
    expect(RUNJS_TYPESCRIPT_MATHJS_BRIDGE_DECLARATION).toContain("typeof import('mathjs')");
    expect(RUNJS_TYPESCRIPT_MATHJS_BRIDGE_DECLARATION).toContain(
      'interface RunJSMathLibrary extends RunJSOfficialMathModule',
    );
  });

  it('generates the official declaration closure and stable manifest', async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(repositoryRoot, 'node_modules/mathjs/package.json'), 'utf8'),
    ) as { version?: string };
    const manifest = generatedManifest.find((entry) => entry.id === 'mathjs');
    const dependencyPaths = mathPack.dependencyFiles.map((file) => file.path);

    expect(mathPack.version).toBe(packageJson.version);
    expect(mathPack.rootFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: RUNJS_TYPESCRIPT_MATHJS_BRIDGE_DECLARATION,
          path: RUNJS_TYPESCRIPT_MATHJS_BRIDGE_PATH,
        }),
      ]),
    );
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
  });

  it('detects direct, destructured, and aliased math usage without requesting Formula.js', () => {
    const requests = collectRunJSTypeLibraryUsage(ts, {
      files: [
        {
          path: 'src/main.ts',
          content: `
ctx.libs.math.evaluate('2 + 2');
const { round } = ctx.libs.math;
const math = ctx.libs.math;
round(2.5);
math.matrix([[1]]);
`,
        },
      ],
    });

    expect(requests).toEqual([{ kind: 'library', libraryName: 'math', packId: 'mathjs' }]);
  });

  it('matches the namespace shape used by the runtime loader', async () => {
    const namespaceModule = await import('mathjs');

    expect(typeof namespaceModule.evaluate).toBe('function');
    expect(namespaceModule.evaluate('2 + 3')).toBe(5);
    expect(namespaceModule.round(2.345, 2)).toBe(2.35);
  });
});
