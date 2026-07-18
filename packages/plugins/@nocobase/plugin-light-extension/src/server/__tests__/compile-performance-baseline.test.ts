/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginVscFileServer from '@nocobase/plugin-vsc-file';
import { MockServer, createMockServer } from '@nocobase/test';

import type {
  LightExtensionCompileMetricCounter,
  LightExtensionCompileMetricsSummary,
} from '../../shared/compileMetrics';
import type { LightExtensionSaveSourceInput } from '../../shared/types';
import PluginLightExtensionServer from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';
import {
  type CompilePerformanceFixture,
  createMediumCompilePerformanceFixture,
  createSmallCompilePerformanceFixture,
} from './helpers/compilePerformanceFixture';

type EntryRuntimeState = {
  artifactHash: string | null;
  compiledCommitId: string | null;
  entryName: string;
  title: string | null;
};

describe('plugin-light-extension complete save performance baseline', () => {
  let app: MockServer;
  let repoService: LightExtensionRepoService;
  let runtimeCompileService: LightExtensionRuntimeCompileService;
  let compilerBridge: LightExtensionWorkspaceCompilerBridge;
  let metricsSummaries: LightExtensionCompileMetricsSummary[];

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginVscFileServer, PluginLightExtensionServer],
    });
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const validator = new LightExtensionValidator();
    repoService = new LightExtensionRepoService(app.db, auditService, permissionService, undefined, validator);
    const fileService = new LightExtensionFileService(
      app.db,
      auditService,
      permissionService,
      repoService,
      undefined,
      validator,
    );
    const entryService = new LightExtensionEntryService(app.db, fileService, repoService, validator);
    compilerBridge = new LightExtensionWorkspaceCompilerBridge(auditService, permissionService);
    metricsSummaries = [];
    runtimeCompileService = new LightExtensionRuntimeCompileService(
      app.db,
      fileService,
      entryService,
      compilerBridge,
      (summary) => metricsSummaries.push(summary),
    );
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('records stable medium-fixture counters for private, shared, descriptor metadata, and README saves', async () => {
    const fixture = createMediumCompilePerformanceFixture();
    const { repo, headCommitId: seededHeadCommitId } = await seedFixtureRepo(
      'Complete Save Performance Baseline',
      fixture,
    );
    let expectedHeadCommitId = seededHeadCommitId;
    let repoByteSize = fixture.parameters.totalBytes;
    metricsSummaries = [];

    const privateChange = changeFixtureFile(
      fixture,
      'src/client/js-blocks/entry-01/private-01.ts',
      "export const privateValue = 'entry-01-private-baseline';\n",
    );
    repoByteSize += privateChange.byteDelta;
    const privateSave = await runtimeCompileService.saveSource({
      repoId: repo.id,
      expectedHeadCommitId,
      message: 'change one private entry file',
      files: [privateChange.file],
    });
    expectedHeadCommitId = privateSave.commit.id;
    expect(privateSave.compile.entries).toHaveLength(fixture.parameters.entryCount);
    expectCompleteSaveSummaries(metricsSummaries, fixture, repoByteSize, 'success', {
      affected: 1,
      compiled: 1,
      reused: fixture.parameters.entryCount - 1,
      hits: fixture.parameters.entryCount - 1,
      misses: 1,
    });

    metricsSummaries = [];
    const beforeShared = new Map(
      (await readEntryRuntimeStates(repo.id)).map((entry) => [entry.entryName, entry] as const),
    );
    const sharedChange = changeFixtureFile(
      fixture,
      'src/shared/shared-01.ts',
      "export const sharedValue1 = 'shared-baseline-updated';\n",
    );
    repoByteSize += sharedChange.byteDelta;
    const sharedSave = await runtimeCompileService.saveSource({
      repoId: repo.id,
      expectedHeadCommitId,
      message: 'change one shared file',
      files: [sharedChange.file],
    });
    expectedHeadCommitId = sharedSave.commit.id;
    const afterShared = await readEntryRuntimeStates(repo.id);
    expect(
      afterShared.filter((entry) => entry.artifactHash !== beforeShared.get(entry.entryName)?.artifactHash),
    ).toHaveLength(fixture.parameters.entryCount);
    expectCompleteSaveSummaries(metricsSummaries, fixture, repoByteSize, 'success', {
      affected: fixture.parameters.entryCount,
      compiled: fixture.parameters.entryCount,
      reused: 0,
      hits: 0,
      misses: fixture.parameters.entryCount,
    });

    metricsSummaries = [];
    const descriptorPath = 'src/client/js-blocks/entry-01/entry.json';
    const beforeDescriptor = afterShared.find((entry) => entry.entryName === 'entry-01');
    const descriptorChange = changeFixtureFile(
      fixture,
      descriptorPath,
      `${JSON.stringify({ schemaVersion: 1, key: 'entry-01', title: 'Updated display metadata' })}\n`,
    );
    repoByteSize += descriptorChange.byteDelta;
    const descriptorSave = await runtimeCompileService.saveSource({
      repoId: repo.id,
      expectedHeadCommitId,
      message: 'change descriptor display metadata',
      files: [descriptorChange.file],
    });
    expectedHeadCommitId = descriptorSave.commit.id;
    const afterDescriptor = (await readEntryRuntimeStates(repo.id)).find((entry) => entry.entryName === 'entry-01');
    expect(afterDescriptor).toMatchObject({
      artifactHash: beforeDescriptor?.artifactHash,
      compiledCommitId: descriptorSave.commit.id,
      title: 'Updated display metadata',
    });
    expectCompleteSaveSummaries(metricsSummaries, fixture, repoByteSize, 'success', {
      affected: 0,
      compiled: 0,
      reused: fixture.parameters.entryCount,
      hits: fixture.parameters.entryCount,
      misses: 0,
    });

    metricsSummaries = [];
    const beforeReadme = await readEntryRuntimeStates(repo.id);
    const readmeChange = changeFixtureFile(fixture, 'README.md', '# Updated non-runtime documentation\n');
    repoByteSize += readmeChange.byteDelta;
    const readmeSave = await runtimeCompileService.saveSource({
      repoId: repo.id,
      expectedHeadCommitId,
      message: 'change README only',
      files: [readmeChange.file],
    });
    const afterReadme = await readEntryRuntimeStates(repo.id);
    expect(afterReadme.map(({ entryName, artifactHash }) => ({ entryName, artifactHash }))).toEqual(
      beforeReadme.map(({ entryName, artifactHash }) => ({ entryName, artifactHash })),
    );
    expect(afterReadme.every((entry) => entry.compiledCommitId === readmeSave.commit.id)).toBe(true);
    expectCompleteSaveSummaries(metricsSummaries, fixture, repoByteSize, 'success', {
      affected: 0,
      compiled: 0,
      reused: fixture.parameters.entryCount,
      hits: fixture.parameters.entryCount,
      misses: 0,
    });
  });

  it('rolls back the Head, compiled commit, and current artifact when one entry fails to compile', async () => {
    const fixture = createSmallCompilePerformanceFixture();
    const repo = await repoService.createRepo({
      name: 'Failed Save Performance Baseline',
      initialFiles: fixture.files,
    });
    const initialChange = changeFixtureFile(
      fixture,
      'src/client/js-blocks/entry-01/private-01.ts',
      "export const privateValue = 'compiled-before-failure';\n",
    );
    const initialSave = await runtimeCompileService.saveSource({
      repoId: repo.id,
      expectedHeadCommitId: repo.headCommitId,
      message: 'compile before failure baseline',
      files: [initialChange.file],
    });
    const beforeFailure = await readEntryRuntimeStates(repo.id);
    const commitCountBeforeFailure = await app.db.getRepository('vscFileCommits').count();
    const artifactCountBeforeFailure = await app.db.getRepository('lightExtensionRuntimeArtifacts').count();
    metricsSummaries = [];

    const brokenChange = changeFixtureFile(
      fixture,
      'src/client/js-blocks/entry-01/index.tsx',
      "import Missing from './missing';\nctx.render(<Missing />);\n",
    );
    const failedRepoByteSize = fixture.parameters.totalBytes + initialChange.byteDelta + brokenChange.byteDelta;
    await expect(
      runtimeCompileService.saveSource({
        repoId: repo.id,
        expectedHeadCommitId: initialSave.commit.id,
        message: 'reject one broken entry',
        files: [brokenChange.file],
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      status: 422,
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            path: 'src/client/js-blocks/entry-01/index.tsx',
            severity: 'error',
          }),
        ]),
      },
    });

    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: initialSave.commit.id });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeFailure);
    await expect(app.db.getRepository('lightExtensionRuntimeArtifacts').count()).resolves.toBe(
      artifactCountBeforeFailure,
    );
    expect(await readEntryRuntimeStates(repo.id)).toEqual(beforeFailure);
    expectCompleteSaveSummaries(metricsSummaries, fixture, failedRepoByteSize, 'rejected', {
      affected: 1,
      compiled: 1,
      reused: 0,
      hits: 0,
      misses: 1,
    });
  });

  it('commits exactly one same-Head concurrent save and records the other request as outdated', async () => {
    const fixture = createSmallCompilePerformanceFixture();
    const repo = await repoService.createRepo({
      name: 'Concurrent Save Performance Baseline',
      initialFiles: fixture.files,
    });
    const expectedHeadCommitId = repo.headCommitId;
    const compileStarted = createDeferred();
    const releaseCompile = createDeferred();
    const compileEntry = compilerBridge.compileEntry.bind(compilerBridge);
    let compileCallCount = 0;

    vi.spyOn(compilerBridge, 'compileEntry').mockImplementation(async (input, ctx) => {
      compileCallCount += 1;
      if (compileCallCount === 1) {
        compileStarted.resolve();
        await releaseCompile.promise;
      }
      return compileEntry(input, ctx);
    });

    const firstChange = changeFixtureFile(
      fixture,
      'src/client/js-blocks/entry-01/private-01.ts',
      "export const privateValue = 'first-concurrent-save';\n",
    );
    const firstSavePromise = runtimeCompileService.saveSource({
      repoId: repo.id,
      expectedHeadCommitId,
      message: 'first same-head save',
      files: [firstChange.file],
    });
    await compileStarted.promise;

    const secondChange = changeFixtureFile(fixture, 'README.md', '# Second concurrent save\n');
    const secondSavePromise = runtimeCompileService
      .saveSource({
        repoId: repo.id,
        expectedHeadCommitId,
        message: 'second same-head save',
        files: [secondChange.file],
      })
      .then(
        () => undefined,
        (error: unknown) => error,
      );
    releaseCompile.resolve();

    const firstSave = await firstSavePromise;
    const secondSaveError = await secondSavePromise;
    expect(secondSaveError).toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_OUTDATED',
      status: 409,
      details: {
        currentHeadCommitId: firstSave.commit.id,
        expectedHeadCommitId,
      },
    });
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: firstSave.commit.id });
    const entries = await readEntryRuntimeStates(repo.id);
    expect(entries).toHaveLength(fixture.parameters.entryCount);
    expect(entries.every((entry) => entry.compiledCommitId === firstSave.commit.id)).toBe(true);
    expect(compileCallCount).toBe(fixture.parameters.entryCount);

    const saveSummaries = summariesFor('saveSource', metricsSummaries);
    const runtimeSummaries = summariesFor('runtimeCompile', metricsSummaries);
    expect(saveSummaries).toHaveLength(2);
    expect(runtimeSummaries).toHaveLength(1);
    expectSummary(
      summaryWithResult(saveSummaries, 'success'),
      'saveSource',
      'success',
      expectedSaveCounters(fixture, fixture.parameters.totalBytes + firstChange.byteDelta, {
        affected: fixture.parameters.entryCount,
        compiled: fixture.parameters.entryCount,
        reused: 0,
        hits: 0,
        misses: fixture.parameters.entryCount,
      }),
      [
        'total',
        'push',
        'snapshotMaterialize',
        'treePrepare',
        'workspaceValidation',
        'entryReconcile',
        'compilePlan',
        'compileEntries',
        'artifactPersist',
        'transaction',
      ],
    );
    expectSummary(
      runtimeSummaries[0],
      'runtimeCompile',
      'success',
      expectedRuntimeCounters(fixture, {
        affected: fixture.parameters.entryCount,
        compiled: fixture.parameters.entryCount,
        reused: 0,
        hits: 0,
        misses: fixture.parameters.entryCount,
      }),
      ['total', 'treePrepare', 'entryReconcile', 'compilePlan', 'compileEntries', 'artifactPersist', 'transaction'],
    );
    expectSummary(summaryWithResult(saveSummaries, 'outdated'), 'saveSource', 'outdated', expectedOutdatedCounters(), [
      'total',
      'push',
      'transaction',
    ]);
  });

  async function readEntryRuntimeStates(repoId: string): Promise<EntryRuntimeState[]> {
    const entries = await app.db.getRepository('lightExtensionEntries').find({
      filter: { repoId },
      sort: ['entryName'],
    });
    return entries.map((entry) => ({
      artifactHash: nullableString(entry.get('artifactHash')),
      compiledCommitId: nullableString(entry.get('compiledCommitId')),
      entryName: String(entry.get('entryName')),
      title: nullableString(entry.get('title')),
    }));
  }

  async function seedFixtureRepo(name: string, fixture: CompilePerformanceFixture) {
    const rootAndSharedFiles = fixture.files.filter((file) => !file.path.startsWith('src/client/js-blocks/'));
    const entryFiles = fixture.files.filter((file) => file.path.startsWith('src/client/js-blocks/'));
    const repo = await repoService.createRepo({
      name,
      initialFiles: rootAndSharedFiles,
    });
    let headCommitId = repo.headCommitId;

    for (let offset = 0; offset < entryFiles.length; offset += 90) {
      const save = await runtimeCompileService.saveSource({
        repoId: repo.id,
        expectedHeadCommitId: headCommitId,
        message: `seed compile performance fixture ${offset / 90 + 1}`,
        files: entryFiles.slice(offset, offset + 90),
      });
      headCommitId = save.commit.id;
    }

    return { repo, headCommitId };
  }
});

function expectCompleteSaveSummaries(
  summaries: LightExtensionCompileMetricsSummary[],
  fixture: CompilePerformanceFixture,
  repoByteSize: number,
  result: 'success' | 'rejected',
  counts: ExpectedCompileCounts,
): void {
  const saveSummaries = summariesFor('saveSource', summaries);
  const runtimeSummaries = summariesFor('runtimeCompile', summaries);
  expect(saveSummaries).toHaveLength(1);
  expect(runtimeSummaries).toHaveLength(1);
  const compileEntriesStage = counts.compiled > 0 ? ['compileEntries'] : [];
  const artifactPersistStage = result === 'success' && fixture.parameters.entryCount > 0 ? ['artifactPersist'] : [];
  expectSummary(saveSummaries[0], 'saveSource', result, expectedSaveCounters(fixture, repoByteSize, counts), [
    'total',
    'push',
    'snapshotMaterialize',
    'treePrepare',
    'workspaceValidation',
    'entryReconcile',
    'compilePlan',
    ...compileEntriesStage,
    ...artifactPersistStage,
    'transaction',
  ]);
  expectSummary(runtimeSummaries[0], 'runtimeCompile', result, expectedRuntimeCounters(fixture, counts), [
    'total',
    'treePrepare',
    'entryReconcile',
    'compilePlan',
    ...compileEntriesStage,
    ...artifactPersistStage,
    'transaction',
  ]);
}

function expectedSaveCounters(
  fixture: CompilePerformanceFixture,
  repoByteSize: number,
  counts: ExpectedCompileCounts,
): Record<LightExtensionCompileMetricCounter, number> {
  const { entryCount, fileCount } = fixture.parameters;
  return {
    repoFileCount: fileCount,
    repoByteSize,
    changedFileCount: 1,
    entryCount,
    affectedEntryCount: counts.affected,
    compiledEntryCount: counts.compiled,
    reusedEntryCount: counts.reused,
    skippedEntryCount: 0,
    compileCacheHitCount: counts.hits,
    compileCacheMissCount: counts.misses,
    compileCacheCorruptCount: 0,
    blobContentQueryCount: fileCount > 1 ? 1 : 0,
    blobContentRowCount: Math.max(fileCount - 1, 0),
    snapshotMaterializationCount: 1,
    treeNormalizationCount: 1,
    referenceScanCount: 0,
  };
}

function expectedRuntimeCounters(
  fixture: CompilePerformanceFixture,
  counts: ExpectedCompileCounts,
): Record<LightExtensionCompileMetricCounter, number> {
  const { entryCount } = fixture.parameters;
  return {
    repoFileCount: 0,
    repoByteSize: 0,
    changedFileCount: 0,
    entryCount,
    affectedEntryCount: counts.affected,
    compiledEntryCount: counts.compiled,
    reusedEntryCount: counts.reused,
    skippedEntryCount: 0,
    compileCacheHitCount: counts.hits,
    compileCacheMissCount: counts.misses,
    compileCacheCorruptCount: 0,
    blobContentQueryCount: 0,
    blobContentRowCount: 0,
    snapshotMaterializationCount: 0,
    treeNormalizationCount: 0,
    referenceScanCount: 0,
  };
}

function expectedOutdatedCounters(): Record<LightExtensionCompileMetricCounter, number> {
  return {
    repoFileCount: 0,
    repoByteSize: 0,
    changedFileCount: 1,
    entryCount: 0,
    affectedEntryCount: 0,
    compiledEntryCount: 0,
    reusedEntryCount: 0,
    skippedEntryCount: 0,
    compileCacheHitCount: 0,
    compileCacheMissCount: 0,
    compileCacheCorruptCount: 0,
    blobContentQueryCount: 0,
    blobContentRowCount: 0,
    snapshotMaterializationCount: 0,
    treeNormalizationCount: 0,
    referenceScanCount: 0,
  };
}

interface ExpectedCompileCounts {
  affected: number;
  compiled: number;
  reused: number;
  hits: number;
  misses: number;
}

function expectSummary(
  summary: LightExtensionCompileMetricsSummary,
  operation: LightExtensionCompileMetricsSummary['operation'],
  result: LightExtensionCompileMetricsSummary['result'],
  counters: Record<LightExtensionCompileMetricCounter, number>,
  durationStages: string[],
): void {
  expect(summary).toEqual({
    schemaVersion: 1,
    operation,
    result,
    durationsMs: expect.any(Object),
    counters,
  });
  expect(Object.keys(summary.durationsMs).sort()).toEqual([...durationStages].sort());
  for (const duration of Object.values(summary.durationsMs)) {
    expect(duration).toEqual(expect.any(Number));
    expect(duration).toBeGreaterThanOrEqual(0);
  }
  expect(JSON.stringify(summary)).not.toMatch(/repoId|entryId|artifactHash|src\/client|src\/shared|README/iu);
}

function summariesFor(
  operation: LightExtensionCompileMetricsSummary['operation'],
  summaries: LightExtensionCompileMetricsSummary[],
): LightExtensionCompileMetricsSummary[] {
  return summaries.filter((summary) => summary.operation === operation);
}

function summaryWithResult(
  summaries: LightExtensionCompileMetricsSummary[],
  result: LightExtensionCompileMetricsSummary['result'],
): LightExtensionCompileMetricsSummary {
  const summary = summaries.find((candidate) => candidate.result === result);
  expect(summary).toBeDefined();
  return summary as LightExtensionCompileMetricsSummary;
}

function changeFixtureFile(
  fixture: CompilePerformanceFixture,
  path: string,
  content: string,
): { byteDelta: number; file: LightExtensionSaveSourceInput['files'][number] } {
  const current = fixture.files.find((file) => file.path === path);
  if (!current) {
    throw new Error(`Compile performance fixture file not found: ${path}`);
  }
  const byteDelta = Buffer.byteLength(content, 'utf8') - Buffer.byteLength(current.content, 'utf8');
  current.content = content;
  return {
    byteDelta,
    file: {
      path,
      content,
      language: current.language,
    },
  };
}

function createDeferred(): { promise: Promise<void>; resolve: () => void } {
  let resolveDeferred!: () => void;
  const promise = new Promise<void>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
