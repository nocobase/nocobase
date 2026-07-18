/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  getRunJSEntryDependencyManifestByteSize,
  hashRunJSEntryDependencyManifest,
  isRunJSEntryDependencyManifestPersistable,
  matchRunJSUnresolvedDependencyCandidate,
  normalizeRunJSEntryDependencyManifest,
  RUNJS_ENTRY_DEPENDENCY_MANIFEST_MAX_BYTES,
  serializeRunJSEntryDependencyManifest,
  validateRunJSEntryDependencyManifest,
  type RunJSEntryDependencyManifestV1,
} from '../dependency-manifest';
import {
  buildRunJSUnresolvedCandidatePaths,
  collectRunJSWorkspaceDependencyManifest,
  RunJSRuntimeDependencyCollector,
  RunJSTypeDependencyCollector,
} from '../compiler/dependency-collector';

describe('RunJS entry dependency manifest', () => {
  it('normalizes, deduplicates, and hashes manifests deterministically', () => {
    const first = normalizeRunJSEntryDependencyManifest({
      version: 1,
      compilerBuildId: 'build-v1',
      entryPath: './src/entry.ts',
      runtime: {
        files: [
          { path: 'src/shared.ts', blobHash: 'shared' },
          { path: './src/entry.ts', blobHash: 'entry' },
          { path: 'src/shared.ts', blobHash: 'shared' },
        ],
        edges: [
          { importer: 'src/entry.ts', imported: 'src/shared.ts' },
          { importer: './src/entry.ts', imported: './src/shared.ts' },
        ],
      },
      types: {
        files: [
          { path: 'src/types.ts', blobHash: 'types' },
          { path: 'src/entry.ts', blobHash: 'entry' },
        ],
        edges: [{ importer: 'src/entry.ts', imported: 'src/types.ts', kind: 'type' }],
        contracts: [
          { id: 'surface', version: '2' },
          { id: 'type-pack', version: '1', contentHash: 'pack-hash' },
        ],
      },
      unresolved: [
        {
          importer: 'src/entry.ts',
          specifier: './future',
          kind: 'runtime',
          candidatePaths: ['src/future.tsx', './src/future.ts'],
        },
      ],
    });
    const second = normalizeRunJSEntryDependencyManifest({
      ...first,
      runtime: { files: [...first.runtime.files].reverse(), edges: [...first.runtime.edges].reverse() },
      types: {
        files: [...first.types.files].reverse(),
        edges: [...first.types.edges].reverse(),
        contracts: [...first.types.contracts].reverse(),
      },
      unresolved: [...first.unresolved].reverse(),
    });

    expect(second).toEqual(first);
    expect(hashRunJSEntryDependencyManifest(second)).toBe(hashRunJSEntryDependencyManifest(first));
    expect(first.runtime.files.map((file) => file.path)).toEqual(['src/entry.ts', 'src/shared.ts']);
    expect(first.unresolved[0].candidatePaths).toEqual(['src/future.ts', 'src/future.tsx']);
  });

  it('validates manifest version, build, entry, and persisted hash bindings', () => {
    const manifest = baseManifest();
    const manifestHash = hashRunJSEntryDependencyManifest(manifest);

    expect(
      validateRunJSEntryDependencyManifest({
        value: manifest,
        expectedCompilerBuildId: 'build-v1',
        expectedEntryPath: './src/entry.ts',
        expectedManifestHash: manifestHash,
      }),
    ).toEqual({ valid: true, manifest, manifestHash });
    expect(validateRunJSEntryDependencyManifest({ value: { ...manifest, version: 2 } })).toEqual({
      valid: false,
      reason: 'unsupported_version',
    });
    expect(validateRunJSEntryDependencyManifest({ value: manifest, expectedCompilerBuildId: 'build-v2' })).toEqual({
      valid: false,
      reason: 'compiler_build_mismatch',
    });
    expect(validateRunJSEntryDependencyManifest({ value: manifest, expectedEntryPath: 'src/other.ts' })).toEqual({
      valid: false,
      reason: 'entry_path_mismatch',
    });
    expect(validateRunJSEntryDependencyManifest({ value: manifest, expectedManifestHash: 'stale' })).toEqual({
      valid: false,
      reason: 'manifest_hash_mismatch',
    });
  });

  it('marks oversized manifests unavailable instead of persisting a truncated graph', () => {
    const manifest = baseManifest();
    const serialized = serializeRunJSEntryDependencyManifest(manifest);

    expect(getRunJSEntryDependencyManifestByteSize(manifest)).toBe(new TextEncoder().encode(serialized).byteLength);
    expect(isRunJSEntryDependencyManifestPersistable(manifest)).toBe(true);
    expect(isRunJSEntryDependencyManifestPersistable(manifest, 1)).toBe(false);

    const oversized = normalizeRunJSEntryDependencyManifest({
      ...manifest,
      unresolved: [
        {
          importer: manifest.entryPath,
          specifier: `./${'x'.repeat(RUNJS_ENTRY_DEPENDENCY_MANIFEST_MAX_BYTES)}`,
          kind: 'runtime',
          candidatePaths: [],
        },
      ],
    });
    expect(isRunJSEntryDependencyManifestPersistable(oversized)).toBe(false);
    expect(validateRunJSEntryDependencyManifest({ value: oversized })).toEqual({ valid: false, reason: 'invalid' });
  });

  it('collects transitive runtime inputs, re-exports, JSON, and cycles', () => {
    const { manifest } = collectRunJSWorkspaceDependencyManifest({
      compilerBuildId: 'build-v1',
      entryPath: 'src/entry.ts',
      files: [
        file('src/entry.ts', `import { value } from './barrel'; export default value;`),
        file('src/barrel.ts', `export { value } from './cycle-a';`),
        file('src/cycle-a.ts', `import data from './data.json'; import './cycle-b'; export const value = data.value;`),
        file('src/cycle-b.ts', `import './cycle-a';`),
        file('src/data.json', `{"value": 1}`),
        file('src/unreferenced.ts', 'export const ignored = true;'),
      ],
    });

    expect(manifest.runtime.files.map((item) => item.path)).toEqual([
      'src/barrel.ts',
      'src/cycle-a.ts',
      'src/cycle-b.ts',
      'src/data.json',
      'src/entry.ts',
    ]);
    expect(manifest.runtime.edges).toEqual([
      { importer: 'src/barrel.ts', imported: 'src/cycle-a.ts' },
      { importer: 'src/cycle-a.ts', imported: 'src/cycle-b.ts' },
      { importer: 'src/cycle-a.ts', imported: 'src/data.json' },
      { importer: 'src/cycle-b.ts', imported: 'src/cycle-a.ts' },
      { importer: 'src/entry.ts', imported: 'src/barrel.ts' },
    ]);
  });

  it('collects type-only imports, type re-exports, references, ambient roots, and contracts separately', () => {
    const { manifest } = collectRunJSWorkspaceDependencyManifest({
      compilerBuildId: 'build-v1',
      entryPath: 'src/entry.ts',
      typeRoots: ['src/global.d.ts'],
      typeContracts: [
        { id: 'runjs:surface', version: '2' },
        { id: 'type-pack:antd/button', version: '5', contentHash: 'antd-button' },
      ],
      files: [
        file(
          'src/entry.ts',
          `/// <reference path="./reference.d.ts" />\nimport type { PublicShape } from './barrel';\nexport default {} as PublicShape;`,
        ),
        file('src/barrel.ts', `export type { PublicShape } from './shape';`),
        file('src/shape.ts', `export interface PublicShape { id: string }`),
        file('src/reference.d.ts', `interface ReferencedValue { enabled: boolean }`),
        file('src/global.d.ts', `declare const ambientFlag: boolean;`),
      ],
    });

    expect(manifest.runtime.files.map((item) => item.path)).toEqual(['src/entry.ts']);
    expect(manifest.types.files.map((item) => item.path)).toEqual([
      'src/barrel.ts',
      'src/entry.ts',
      'src/global.d.ts',
      'src/reference.d.ts',
      'src/shape.ts',
    ]);
    expect(manifest.types.edges).toEqual([
      { importer: 'src/barrel.ts', imported: 'src/shape.ts', kind: 'type' },
      { importer: 'src/entry.ts', imported: 'src/barrel.ts', kind: 'type' },
      { importer: 'src/entry.ts', imported: 'src/reference.d.ts', kind: 'reference' },
    ]);
    expect(manifest.types.contracts).toEqual([
      { id: 'runjs:surface', version: '2' },
      { id: 'type-pack:antd/button', version: '5', contentHash: 'antd-button' },
    ]);
  });

  it('records not-found, blocked require, and dynamic imports with deterministic candidate paths', () => {
    const { manifest } = collectRunJSWorkspaceDependencyManifest({
      compilerBuildId: 'build-v1',
      entryPath: 'src/entry.ts',
      files: [
        file(
          'src/entry.ts',
          `import './missing';\nimport forbidden from 'forbidden-package';\nrequire('./legacy');\nimport('./lazy');`,
        ),
      ],
    });

    expect(manifest.unresolved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ importer: 'src/entry.ts', specifier: './missing', kind: 'runtime' }),
        { importer: 'src/entry.ts', specifier: 'forbidden-package', kind: 'blocked', candidatePaths: [] },
        expect.objectContaining({ importer: 'src/entry.ts', specifier: './legacy', kind: 'blocked' }),
        expect.objectContaining({ importer: 'src/entry.ts', specifier: './lazy', kind: 'dynamic' }),
      ]),
    );
    expect(buildRunJSUnresolvedCandidatePaths('src/entry.ts', './missing')).toEqual([
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
    ]);
  });

  it('supports independently composed runtime and type collectors', () => {
    const runtime = new RunJSRuntimeDependencyCollector();
    runtime.recordFile({ path: 'src/entry.ts', blobHash: 'entry' });
    runtime.recordEdge({ importer: 'src/entry.ts', imported: 'src/runtime.ts' });
    runtime.recordEdge({ importer: './src/entry.ts', imported: './src/runtime.ts' });

    const types = new RunJSTypeDependencyCollector();
    types.recordFile({ path: 'src/types.ts', blobHash: 'types' });
    types.recordEdge({ importer: 'src/entry.ts', imported: 'src/types.ts', kind: 'type' });
    types.recordContract({ id: 'surface', version: '2' });

    expect(runtime.snapshot()).toMatchObject({
      files: [{ path: 'src/entry.ts', blobHash: 'entry' }],
      edges: [{ importer: 'src/entry.ts', imported: 'src/runtime.ts' }],
    });
    expect(types.snapshot()).toMatchObject({
      files: [{ path: 'src/types.ts', blobHash: 'types' }],
      edges: [{ importer: 'src/entry.ts', imported: 'src/types.ts', kind: 'type' }],
      contracts: [{ id: 'surface', version: '2' }],
    });
  });

  it('matches unresolved candidates without treating an unknown candidate set as safe', () => {
    expect(
      matchRunJSUnresolvedDependencyCandidate('src/future.ts', {
        candidatePaths: ['src/future.ts', 'src/future/index.ts'],
      }),
    ).toBe('match');
    expect(
      matchRunJSUnresolvedDependencyCandidate('src/other.ts', {
        candidatePaths: ['src/future.ts', 'src/future/index.ts'],
      }),
    ).toBe('no-match');
    expect(matchRunJSUnresolvedDependencyCandidate('src/future.ts', { candidatePaths: [] })).toBe('unknown');
  });
});

function file(path: string, content: string) {
  return { path, content, blobHash: `blob:${path}` };
}

function baseManifest(): RunJSEntryDependencyManifestV1 {
  return {
    version: 1,
    compilerBuildId: 'build-v1',
    entryPath: 'src/entry.ts',
    runtime: { files: [{ path: 'src/entry.ts', blobHash: 'entry' }], edges: [] },
    types: { files: [{ path: 'src/entry.ts', blobHash: 'entry' }], edges: [], contracts: [] },
    unresolved: [],
  };
}
