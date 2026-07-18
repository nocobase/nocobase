/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sha256Hex } from '..';
import { buildRunJSEntryDependencyManifestFromGraph, compileRunJSSourceWorkspace } from '../compiler';

describe('RunJS compiler-derived dependency graph', () => {
  it('records runtime re-exports, JSON modules, and cycles from the actual esbuild build', async () => {
    const files = [
      {
        path: 'src/entry.ts',
        content: `import { value } from './barrel'; import data from './data.json'; return value + data.offset;`,
      },
      { path: 'src/barrel.ts', content: `export { value } from './cycle-a';` },
      {
        path: 'src/cycle-a.ts',
        content: `import { next } from './cycle-b'; export const value = next + 1;`,
      },
      { path: 'src/cycle-b.ts', content: `import './cycle-a'; export const next = 1;` },
      { path: 'src/data.json', content: `{"offset":2}` },
    ];
    const result = await compileRunJSSourceWorkspace({ entry: 'src/entry.ts', files, surfaceStyle: 'value' });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    expect(result.dependencyGraph?.runtime).toEqual({
      files: ['src/barrel.ts', 'src/cycle-a.ts', 'src/cycle-b.ts', 'src/data.json', 'src/entry.ts'],
      edges: [
        { importer: 'src/barrel.ts', imported: 'src/cycle-a.ts' },
        { importer: 'src/cycle-a.ts', imported: 'src/cycle-b.ts' },
        { importer: 'src/cycle-b.ts', imported: 'src/cycle-a.ts' },
        { importer: 'src/entry.ts', imported: 'src/barrel.ts' },
        { importer: 'src/entry.ts', imported: 'src/data.json' },
      ],
    });
  });

  it('records the exact modules loaded by the esbuild resolver after entry adaptation', async () => {
    const files = [
      {
        path: 'src/entry.ts',
        content: `export type { RuntimeShape } from './runtime-shape'; return 1;`,
      },
      {
        path: 'src/runtime-shape.ts',
        content: `export interface RuntimeShape { id: string }; console.info('runtime-side-effect');`,
      },
    ];
    const result = await compileRunJSSourceWorkspace({ entry: 'src/entry.ts', files, surfaceStyle: 'value' });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    expect(result.artifact.code).toContain('runtime-side-effect');
    expect(result.dependencyGraph?.runtime).toEqual({
      files: ['src/entry.ts', 'src/runtime-shape.ts'],
      edges: [{ importer: 'src/entry.ts', imported: 'src/runtime-shape.ts' }],
    });
  });

  it('uses the actual TypeScript Program roots and resolutions, including ambient and selected type-pack contracts', async () => {
    const files = [
      {
        path: 'src/entry.ts',
        content: `/// <reference path="./ambient.d.ts" />\nimport type { SharedShape } from './shared-shape';\nimport dayjs from 'dayjs';\nimport { createClient } from '@nocobase/sdk/client';\nconst client = createClient();\nconst value: SharedShape = { id: dayjs().year() }; return client.auth.role || value.id;`,
      },
      { path: 'src/shared-shape.ts', content: `export interface SharedShape { id: number }` },
      { path: 'src/ambient.d.ts', content: `declare const ambientFlag: boolean;` },
      { path: 'src/unreferenced.ts', content: `const invalid: number = String(1);` },
    ];
    const result = await compileRunJSSourceWorkspace({ entry: 'src/entry.ts', files, surfaceStyle: 'value' });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    expect(result.dependencyGraph?.types.files).toEqual(['src/ambient.d.ts', 'src/entry.ts', 'src/shared-shape.ts']);
    expect(result.dependencyGraph?.types.edges).toEqual([
      { importer: 'src/entry.ts', imported: 'src/ambient.d.ts', kind: 'reference' },
      { importer: 'src/entry.ts', imported: 'src/shared-shape.ts', kind: 'type' },
    ]);
    expect(result.dependencyGraph?.types.contracts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'runjs:context', contentHash: expect.stringMatching(/^[a-f0-9]{64}$/u) }),
        expect.objectContaining({ id: 'runjs:surface', version: 'value' }),
        expect.objectContaining({ id: 'runjs:type-library:@nocobase/sdk/client' }),
        expect.objectContaining({ id: 'runjs:type-library:dayjs' }),
        expect.objectContaining({ id: 'runjs:typescript-environment' }),
      ]),
    );
  });

  it('records transitive type re-exports without adding them to the runtime graph', async () => {
    const files = [
      {
        path: 'src/entry.ts',
        content: `import type { Shape } from './types'; const value: Shape = { id: 1 }; return value.id;`,
      },
      { path: 'src/types.ts', content: `export type { Shape } from './shape';` },
      { path: 'src/shape.ts', content: `export interface Shape { id: number }` },
    ];
    const result = await compileRunJSSourceWorkspace({ entry: 'src/entry.ts', files, surfaceStyle: 'value' });

    expect(result.failureCode, JSON.stringify(result.artifact.diagnostics, null, 2)).toBeUndefined();
    expect(result.dependencyGraph?.runtime).toEqual({ files: ['src/entry.ts'], edges: [] });
    expect(result.dependencyGraph?.types.files).toEqual(['src/entry.ts', 'src/shape.ts', 'src/types.ts']);
    expect(result.dependencyGraph?.types.edges).toEqual([
      { importer: 'src/entry.ts', imported: 'src/types.ts', kind: 'type' },
      { importer: 'src/types.ts', imported: 'src/shape.ts', kind: 'type' },
    ]);
  });

  it('isolates identical relative module names by executable Entry root', async () => {
    const files = [
      { path: 'src/entry-a/index.ts', content: `import { value } from './shared'; return value;` },
      { path: 'src/entry-a/shared.ts', content: `export const value = 'a';` },
      { path: 'src/entry-b/index.ts', content: `import { value } from './shared'; return value;` },
      { path: 'src/entry-b/shared.ts', content: `export const value = 'b';` },
    ];
    const first = await compileRunJSSourceWorkspace({ entry: 'src/entry-a/index.ts', files, surfaceStyle: 'value' });
    const second = await compileRunJSSourceWorkspace({ entry: 'src/entry-b/index.ts', files, surfaceStyle: 'value' });

    expect(first.failureCode).toBeUndefined();
    expect(second.failureCode).toBeUndefined();
    expect(first.dependencyGraph?.runtime).toEqual({
      files: ['src/entry-a/index.ts', 'src/entry-a/shared.ts'],
      edges: [{ importer: 'src/entry-a/index.ts', imported: 'src/entry-a/shared.ts' }],
    });
    expect(second.dependencyGraph?.runtime).toEqual({
      files: ['src/entry-b/index.ts', 'src/entry-b/shared.ts'],
      edges: [{ importer: 'src/entry-b/index.ts', imported: 'src/entry-b/shared.ts' }],
    });
  });

  it('binds surface, modelUse, and allowed globals to distinct type contracts', async () => {
    const files = [{ path: 'src/entry.ts', content: `return 1;` }];
    const compile = (surfaceStyle: 'value' | 'action', modelUse: string, additionalAllowedGlobals?: string[]) =>
      compileRunJSSourceWorkspace({
        entry: 'src/entry.ts',
        files,
        surfaceStyle,
        additionalAllowedGlobals,
        legacy: {
          version: 'v2',
          surfaceStyle,
          language: 'typescript',
          metadata: { kind: 'runjs', modelUse },
        },
      });
    const base = await compile('value', 'RunJSValue');
    const action = await compile('action', 'JSActionModel');
    const extended = await compile('value', 'RunJSValue', ['customRuntimeGlobal']);
    const contracts = (result: typeof base) =>
      result.dependencyGraph?.types.contracts.filter((contract) =>
        ['runjs:context', 'runjs:surface'].includes(contract.id),
      );

    expect(base.failureCode).toBeUndefined();
    expect(action.failureCode).toBeUndefined();
    expect(extended.failureCode).toBeUndefined();
    expect(contracts(action)).not.toEqual(contracts(base));
    expect(contracts(extended)).not.toEqual(contracts(base));
  });

  it.each([
    {
      label: 'not-found import',
      content: `import './missing'; return 1;`,
      expected: {
        importer: 'src/entry.ts',
        specifier: './missing',
        kind: 'runtime',
        candidatePaths: [
          'src/missing.js',
          'src/missing.json',
          'src/missing.jsx',
          'src/missing.ts',
          'src/missing.tsx',
          'src/missing/index.js',
          'src/missing/index.json',
          'src/missing/index.jsx',
          'src/missing/index.ts',
          'src/missing/index.tsx',
        ],
      },
    },
    {
      label: 'blocked import',
      content: `import fs from 'node:fs'; return fs;`,
      expected: {
        importer: 'src/entry.ts',
        specifier: 'node:fs',
        kind: 'blocked',
        candidatePaths: [],
      },
    },
    {
      label: 'dynamic import',
      content: `const loaded = await import('./later'); return loaded;`,
      expected: {
        importer: 'src/entry.ts',
        specifier: './later',
        kind: 'dynamic',
        candidatePaths: [
          'src/later.js',
          'src/later.json',
          'src/later.jsx',
          'src/later.ts',
          'src/later.tsx',
          'src/later/index.js',
          'src/later/index.json',
          'src/later/index.jsx',
          'src/later/index.ts',
          'src/later/index.tsx',
        ],
      },
    },
  ])('returns a runtime partial graph for a failed $label', async ({ content, expected }) => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/entry.ts',
      surfaceStyle: 'value',
      files: [
        { path: 'src/entry.ts', content },
        { path: 'src/later.ts', content: `export const value = 1;` },
      ],
    });

    expect(result.failureCode).toBeDefined();
    expect(result.dependencyGraph).toMatchObject({
      runtime: { files: ['src/entry.ts'], edges: [] },
      types: { files: [], edges: [], contracts: [] },
      unresolved: [expected],
    });
  });

  it('keeps imported diagnostics in the Program while excluding unreferenced non-ambient files', async () => {
    const unreferenced = await compileRunJSSourceWorkspace({
      entry: 'src/entry.ts',
      surfaceStyle: 'value',
      files: [
        { path: 'src/entry.ts', content: 'return 1;' },
        { path: 'src/unreferenced.ts', content: 'const invalid: number = String(1);' },
      ],
    });
    const imported = await compileRunJSSourceWorkspace({
      entry: 'src/entry.ts',
      surfaceStyle: 'value',
      files: [
        { path: 'src/entry.ts', content: `import './imported'; return 1;` },
        { path: 'src/imported.ts', content: 'const invalid: number = String(1);' },
      ],
    });

    expect(unreferenced.failureCode).toBeUndefined();
    expect(unreferenced.dependencyGraph?.types.files).toEqual(['src/entry.ts']);
    expect(imported.failureCode).toBe('RUNJS_COMPILE_FAILED');
    expect(imported.artifact.diagnostics).toEqual([
      expect.objectContaining({
        path: 'src/imported.ts',
        message: expect.stringContaining("Type 'string' is not assignable to type 'number'"),
      }),
    ]);
  });

  it('binds compiler-derived paths to canonical blob hashes deterministically', async () => {
    const files = [
      { path: 'src/entry.ts', content: `import type { Shape } from './shape'; return {} as Shape;` },
      { path: 'src/shape.ts', content: 'export interface Shape { id?: string }' },
    ].map((file) => ({ ...file, blobHash: sha256Hex(file.content) }));
    const result = await compileRunJSSourceWorkspace({ entry: 'src/entry.ts', files, surfaceStyle: 'value' });
    if (!result.dependencyGraph) {
      throw new Error('Expected compiler dependency graph');
    }

    const first = buildRunJSEntryDependencyManifestFromGraph({
      compilerBuildId: 'compiler-build',
      entryPath: 'src/entry.ts',
      files,
      graph: result.dependencyGraph,
    });
    const second = buildRunJSEntryDependencyManifestFromGraph({
      compilerBuildId: 'compiler-build',
      entryPath: 'src/entry.ts',
      files: [...files].reverse(),
      graph: result.dependencyGraph,
    });

    expect(second).toEqual(first);
    expect(first.manifest.types.files).toEqual([
      { path: 'src/entry.ts', blobHash: files[0].blobHash },
      { path: 'src/shape.ts', blobHash: files[1].blobHash },
    ]);
  });
});
