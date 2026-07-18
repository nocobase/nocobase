/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { hashRunJSEntryDependencyManifest, sha256Hex, type RunJSEntryDependencyManifestV1 } from '@nocobase/runjs';
import { buildRunJSEntryDependencyManifestFromGraph, compileRunJSSourceWorkspace } from '@nocobase/runjs/compiler';

import { createAffectedEntryCompilePlan, type EntryPlanSnapshot } from '../services/AffectedEntryCompilePlanner';

describe('dependency-aware affected entry compile planner', () => {
  it('derives precise plans from real compiler graphs for a 20-entry and 200-file repository', async () => {
    const fixture = buildRealCompilerFixture();
    const entries: EntryPlanSnapshot[] = [];
    expect(fixture.files).toHaveLength(200);

    for (let index = 0; index < 20; index += 1) {
      const entryName = `entry-${String(index).padStart(2, '0')}`;
      const entryRoot = `src/client/js-blocks/${entryName}`;
      const entryPath = `${entryRoot}/index.ts`;
      const compileFiles = fixture.files
        .filter(
          (file) =>
            (file.path.startsWith(entryRoot) && !file.path.endsWith('/entry.json')) ||
            file.path.startsWith('src/shared/'),
        )
        .map((file) => ({ ...file, blobHash: sha256Hex(file.content) }));
      const compiled = await compileRunJSSourceWorkspace({
        entry: entryPath,
        files: compileFiles,
        surfaceStyle: 'value',
      });
      expect(compiled.failureCode, JSON.stringify(compiled.artifact.diagnostics, null, 2)).toBeUndefined();
      if (!compiled.dependencyGraph) {
        throw new Error(`Compiler dependency graph was not produced for ${entryName}`);
      }
      const dependency = buildRunJSEntryDependencyManifestFromGraph({
        compilerBuildId: 'build-v1',
        entryPath,
        files: compileFiles,
        graph: compiled.dependencyGraph,
      });
      entries.push({
        id: `entry-id-${index}`,
        target: 'client',
        kind: 'js-block',
        entryName,
        entryPath,
        descriptorPath: `${entryRoot}/entry.json`,
        healthStatus: 'ready',
        settingsSchemaHash: null,
        settingsDefaultsHash: null,
        metadataFingerprint: 'metadata-v1',
        compilerBuildId: 'build-v1',
        dependencyManifest: dependency.manifest,
        dependencyManifestHash: dependency.manifestHash,
      });
    }

    expect(plan(entries, ['src/shared/runtime-only.ts']).compileCandidates).toEqual([
      expect.objectContaining({ entryName: 'entry-03', reasons: ['runtime_dependency'] }),
    ]);
    expect(plan(entries, ['src/shared/type-only.ts']).compileCandidates).toEqual([
      expect.objectContaining({ entryName: 'entry-07', reasons: ['type_dependency'] }),
    ]);
    expect(plan(entries, ['src/shared/shared-02.ts']).compileCandidates).toEqual([]);
  }, 60_000);

  it('invalidates only the runtime or type-only shared dependency owner in a 20-entry fixture', () => {
    const entries = Array.from({ length: 20 }, (_, index) => dependencyEntry(index));
    const runtimePlan = plan(entries, ['src/shared/runtime-only.ts']);
    const typePlan = plan(entries, ['src/shared/type-only.ts']);

    expect(runtimePlan.compileCandidates).toEqual([
      expect.objectContaining({ entryName: 'entry-03', reasons: ['runtime_dependency'] }),
    ]);
    expect(runtimePlan.metrics.affectedEntryCount).toBe(1);
    expect(runtimePlan.metrics).toMatchObject({
      preciseHitEntryCount: 1,
      conservativeFallbackEntryCount: 0,
      manifestVersionMismatchEntryCount: 0,
    });
    expect(typePlan.compileCandidates).toEqual([
      expect.objectContaining({ entryName: 'entry-07', reasons: ['type_dependency'] }),
    ]);
    expect(typePlan.metrics.affectedEntryCount).toBe(1);
    expect(typePlan.metrics.preciseHitEntryCount).toBe(1);
  });

  it('does not compile any entry for a shared file absent from every valid graph', () => {
    const entries = Array.from({ length: 20 }, (_, index) => dependencyEntry(index));
    const result = plan(entries, ['src/shared/unreferenced.ts']);

    expect(result.compileCandidates).toEqual([]);
    expect(result.unchangedEntries).toHaveLength(20);
  });

  it('invalidates every old runtime and type reference when a shared file is deleted or renamed', async () => {
    const first = await compilerDependencyEntry(
      1,
      `import { shared } from '../../../shared/multi'; return shared;`,
      `export const shared = 1;`,
    );
    const second = await compilerDependencyEntry(
      2,
      `import type { Shared } from '../../../shared/multi'; const value = {} as Shared; return value;`,
      `export interface Shared { id?: string }`,
    );
    const unrelated = dependencyEntry(3);
    const deleted = createAffectedEntryCompilePlan({
      compilerBuildId: 'build-v1',
      changedPaths: ['src/shared/multi.ts'],
      pathChanges: [{ path: 'src/shared/multi.ts', operation: 'deleted' }],
      previousEntries: [unrelated, second, first],
      candidateEntries: [first, unrelated, second],
    });
    const renamed = createAffectedEntryCompilePlan({
      compilerBuildId: 'build-v1',
      changedPaths: ['src/shared/multi.ts', 'src/shared/renamed.ts'],
      pathChanges: [
        { path: 'src/shared/multi.ts', operation: 'deleted' },
        { path: 'src/shared/renamed.ts', operation: 'added' },
      ],
      previousEntries: [second, first, unrelated],
      candidateEntries: [unrelated, first, second],
    });

    expect(deleted.compileCandidates.map((entry) => entry.entryName)).toEqual(['entry-01', 'entry-02']);
    expect(renamed.compileCandidates.map((entry) => entry.entryName)).toEqual(['entry-01', 'entry-02']);

    const compileDeletedReference = (entryPath: string, content: string) =>
      compileRunJSSourceWorkspace({
        entry: entryPath,
        files: [{ path: entryPath, content }],
        surfaceStyle: 'value',
      });
    const runtimeInput = [
      'src/client/js-blocks/entry-01/index.ts',
      `import { shared } from '../../../shared/multi'; return shared;`,
    ] as const;
    const typeInput = [
      'src/client/js-blocks/entry-02/index.ts',
      `import type { Shared } from '../../../shared/multi'; const value = {} as Shared; return value;`,
    ] as const;
    const firstDiagnostics = await Promise.all([
      compileDeletedReference(...runtimeInput),
      compileDeletedReference(...typeInput),
    ]);
    const repeatedDiagnostics = await Promise.all([
      compileDeletedReference(...runtimeInput),
      compileDeletedReference(...typeInput),
    ]);

    expect(firstDiagnostics.map((result) => result.failureCode)).toEqual([
      'RUNJS_IMPORT_NOT_FOUND',
      'RUNJS_COMPILE_FAILED',
    ]);
    expect(firstDiagnostics.map((result) => result.artifact.diagnostics)).toEqual(
      repeatedDiagnostics.map((result) => result.artifact.diagnostics),
    );
  });

  it('invalidates the entry whose unresolved candidate is satisfied by an added file', () => {
    const unresolved = dependencyEntry(4, {
      unresolved: [
        {
          importer: 'src/client/js-blocks/entry-04/index.ts',
          specifier: '../../../shared/future',
          kind: 'runtime',
          candidatePaths: ['src/shared/future.ts', 'src/shared/future/index.ts'],
        },
      ],
    });
    const unrelated = dependencyEntry(5);
    const result = createAffectedEntryCompilePlan({
      compilerBuildId: 'build-v1',
      changedPaths: ['src/shared/future.ts'],
      pathChanges: [{ path: 'src/shared/future.ts', operation: 'added' }],
      previousEntries: [unrelated, unresolved],
      candidateEntries: [unresolved, unrelated],
    });

    expect(result.compileCandidates).toEqual([
      expect.objectContaining({ entryName: 'entry-04', reasons: ['unresolved_candidate'] }),
    ]);
  });

  it.each([
    ['missing', undefined, 'conservative_manifest_missing'],
    ['unsupported version', { version: 2 }, 'conservative_manifest_version'],
    ['corrupt', { version: 1, runtime: null }, 'conservative_manifest_invalid'],
  ])('falls back for a %s dependency manifest', (_label, dependencyManifest, expectedReason) => {
    const valid = dependencyEntry(1);
    const invalid = dependencyEntry(2, { dependencyManifest });
    const result = plan([valid, invalid], ['src/shared/unreferenced.ts']);

    expect(result.compileCandidates.map((entry) => entry.entryName)).toEqual(['entry-01', 'entry-02']);
    expect(result.compileCandidates.every((entry) => entry.reasons.includes(expectedReason))).toBe(true);
    expect(result.metrics).toMatchObject({
      preciseHitEntryCount: 0,
      conservativeFallbackEntryCount: 2,
      manifestVersionMismatchEntryCount: expectedReason === 'conservative_manifest_version' ? 2 : 0,
    });
  });

  it('falls back on compiler build and persisted manifest hash mismatches', () => {
    const staleBuild = dependencyEntry(1, { compilerBuildId: 'build-v0', manifestCompilerBuildId: 'build-v0' });
    const staleHash = dependencyEntry(2, { dependencyManifestHash: 'stale-hash' });

    expect(plan([staleBuild], ['src/shared/unreferenced.ts']).compileCandidates[0].reasons).toEqual([
      'conservative_build_mismatch',
    ]);
    expect(plan([staleHash], ['src/shared/unreferenced.ts']).compileCandidates[0].reasons).toEqual([
      'conservative_manifest_invalid',
    ]);
  });

  it('falls back for candidate-less unresolved imports on additions and remains byte-stable', () => {
    const unknown = dependencyEntry(1, {
      unresolved: [
        {
          importer: 'src/client/js-blocks/entry-01/index.ts',
          specifier: 'custom-runtime-contract',
          kind: 'type',
          candidatePaths: [],
        },
      ],
    });
    const other = dependencyEntry(2);
    const first = createAffectedEntryCompilePlan({
      compilerBuildId: 'build-v1',
      changedPaths: ['src/shared/new-contract.ts'],
      pathChanges: [{ path: 'src/shared/new-contract.ts', operation: 'added' }],
      previousEntries: [unknown, other],
      candidateEntries: [other, unknown],
    });
    const second = createAffectedEntryCompilePlan({
      compilerBuildId: 'build-v1',
      changedPaths: ['./src/shared/new-contract.ts', 'src/shared/new-contract.ts'],
      pathChanges: [{ path: './src/shared/new-contract.ts', operation: 'added' }],
      previousEntries: [other, unknown],
      candidateEntries: [unknown, other],
    });

    expect(first.compileCandidates.every((entry) => entry.reasons.includes('conservative_unresolved'))).toBe(true);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});

function buildRealCompilerFixture(): { files: Array<{ path: string; content: string }> } {
  const files: Array<{ path: string; content: string }> = [
    { path: 'src/shared/runtime-only.ts', content: 'export const runtimeValue = 3;' },
    { path: 'src/shared/type-only.ts', content: 'export interface TypeOnlyShape { id: number }' },
    ...Array.from({ length: 18 }, (_, index) => ({
      path: `src/shared/shared-${String(index + 2).padStart(2, '0')}.ts`,
      content: `export const shared${index + 2} = ${index + 2};`,
    })),
  ];
  for (let index = 0; index < 20; index += 1) {
    const entryName = `entry-${String(index).padStart(2, '0')}`;
    const root = `src/client/js-blocks/${entryName}`;
    const entryContent =
      index === 3
        ? `import { runtimeValue } from '../../../shared/runtime-only'; return runtimeValue;`
        : index === 7
          ? `import type { TypeOnlyShape } from '../../../shared/type-only'; const value: TypeOnlyShape = { id: 7 }; return value.id;`
          : `return ${index};`;
    files.push(
      { path: `${root}/index.ts`, content: entryContent },
      {
        path: `${root}/entry.json`,
        content: JSON.stringify({ schemaVersion: 1, key: entryName, title: entryName }),
      },
      ...Array.from({ length: 7 }, (_, helperIndex) => ({
        path: `${root}/helper-${helperIndex}.ts`,
        content: `export const helper${helperIndex} = ${helperIndex};`,
      })),
    );
  }
  return { files };
}

function plan(entries: EntryPlanSnapshot[], changedPaths: string[]) {
  return createAffectedEntryCompilePlan({
    compilerBuildId: 'build-v1',
    changedPaths,
    pathChanges: changedPaths.map((path) => ({ path, operation: 'modified' as const })),
    previousEntries: [...entries].reverse(),
    candidateEntries: entries,
  });
}

function dependencyEntry(
  index: number,
  options: {
    runtimeFiles?: string[];
    typeFiles?: string[];
    unresolved?: RunJSEntryDependencyManifestV1['unresolved'];
    dependencyManifest?: unknown;
    dependencyManifestHash?: string;
    compilerBuildId?: string;
    manifestCompilerBuildId?: string;
  } = {},
): EntryPlanSnapshot {
  const entryName = `entry-${String(index).padStart(2, '0')}`;
  const entryPath = `src/client/js-blocks/${entryName}/index.ts`;
  const manifest = manifestForEntry({
    entryPath,
    compilerBuildId: options.manifestCompilerBuildId || 'build-v1',
    runtimeFiles: options.runtimeFiles || (index === 3 ? ['src/shared/runtime-only.ts'] : []),
    typeFiles: options.typeFiles || (index === 7 ? ['src/shared/type-only.ts'] : []),
    unresolved: options.unresolved || [],
  });
  const dependencyManifest = Object.prototype.hasOwnProperty.call(options, 'dependencyManifest')
    ? options.dependencyManifest
    : manifest;
  return {
    id: `entry-id-${index}`,
    target: 'client',
    kind: 'js-block',
    entryName,
    entryPath,
    descriptorPath: `src/client/js-blocks/${entryName}/entry.json`,
    healthStatus: 'ready',
    settingsSchemaHash: null,
    settingsDefaultsHash: null,
    metadataFingerprint: 'metadata-v1',
    compilerBuildId: options.compilerBuildId || 'build-v1',
    dependencyManifest,
    dependencyManifestHash:
      options.dependencyManifestHash ||
      (dependencyManifest === manifest ? hashRunJSEntryDependencyManifest(manifest) : null),
  };
}

async function compilerDependencyEntry(
  index: number,
  entryContent: string,
  sharedContent: string,
): Promise<EntryPlanSnapshot> {
  const entry = dependencyEntry(index);
  const files = [
    { path: entry.entryPath, content: entryContent },
    { path: 'src/shared/multi.ts', content: sharedContent },
  ].map((file) => ({ ...file, blobHash: sha256Hex(file.content) }));
  const compiled = await compileRunJSSourceWorkspace({
    entry: entry.entryPath,
    files,
    surfaceStyle: 'value',
  });
  expect(compiled.failureCode, JSON.stringify(compiled.artifact.diagnostics, null, 2)).toBeUndefined();
  if (!compiled.dependencyGraph) {
    throw new Error(`Compiler dependency graph was not produced for ${entry.entryName}`);
  }
  const dependency = buildRunJSEntryDependencyManifestFromGraph({
    compilerBuildId: 'build-v1',
    entryPath: entry.entryPath,
    files,
    graph: compiled.dependencyGraph,
  });
  return {
    ...entry,
    dependencyManifest: dependency.manifest,
    dependencyManifestHash: dependency.manifestHash,
  };
}

function manifestForEntry(input: {
  entryPath: string;
  compilerBuildId: string;
  runtimeFiles: string[];
  typeFiles: string[];
  unresolved: RunJSEntryDependencyManifestV1['unresolved'];
}): RunJSEntryDependencyManifestV1 {
  const entryFile = { path: input.entryPath, blobHash: `blob:${input.entryPath}` };
  return {
    version: 1,
    compilerBuildId: input.compilerBuildId,
    entryPath: input.entryPath,
    runtime: {
      files: [entryFile, ...input.runtimeFiles.map((path) => ({ path, blobHash: `blob:${path}` }))],
      edges: input.runtimeFiles.map((path) => ({ importer: input.entryPath, imported: path })),
    },
    types: {
      files: [
        entryFile,
        ...input.runtimeFiles.map((path) => ({ path, blobHash: `blob:${path}` })),
        ...input.typeFiles.map((path) => ({ path, blobHash: `blob:${path}` })),
      ],
      edges: [
        ...input.runtimeFiles.map((path) => ({ importer: input.entryPath, imported: path, kind: 'runtime' as const })),
        ...input.typeFiles.map((path) => ({ importer: input.entryPath, imported: path, kind: 'type' as const })),
      ],
      contracts: [{ id: 'surface', version: '2' }],
    },
    unresolved: input.unresolved,
  };
}
