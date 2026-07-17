/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionEntryRecord } from '../../shared/types';
import PluginVscFileServer from '@nocobase/plugin-vsc-file';
import { MockServer, createMockServer } from '@nocobase/test';
import type { LightExtensionCompileMetricsSummary } from '../../shared/compileMetrics';
import PluginLightExtensionServer from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import {
  buildLightExtensionCompileKey,
  type CompileInputManifestSourceFile,
} from '../services/LightExtensionCompileKey';
import {
  buildLightExtensionCompilerBuildIdentity,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
  type LightExtensionCompilerBuildIdentityComponents,
} from '../services/LightExtensionCompileContract';
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';
import { RuntimeResolveService } from '../services/RuntimeResolveService';

describe('light extension compiler identity and compile key', () => {
  it('changes the compiler build id when any build component changes', () => {
    expect(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId).toMatch(/^[a-f0-9]{64}$/u);
    for (const component of Object.keys(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS) as Array<
      keyof LightExtensionCompilerBuildIdentityComponents
    >) {
      const current = LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS[component];
      const changed = {
        ...LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
        [component]: typeof current === 'number' ? current + 1 : `${current}.changed`,
      } as LightExtensionCompilerBuildIdentityComponents;
      expect(buildLightExtensionCompilerBuildIdentity(changed).compilerBuildId, component).not.toBe(
        LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId,
      );
    }
  });

  it('builds a canonical key from blob metadata without source contents', () => {
    const entry = createEntry();
    const files = compileFiles();
    const first = buildLightExtensionCompileKey({ entry, files });
    const reordered = buildLightExtensionCompileKey({ entry, files: [...files].reverse() });

    expect(reordered).toEqual(first);
    expect(first.compileKey).toMatch(/^[a-f0-9]{64}$/u);
    expect(first.inputManifest.files).toEqual([
      expect.objectContaining({ path: 'src/client/js-blocks/sales/index.tsx', blobHash: 'blob_entry' }),
      expect.objectContaining({ path: 'src/shared/format.ts', blobHash: 'blob_shared' }),
    ]);
    expect(first.inputManifest.files).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ path: entry.descriptorPath })]),
    );
    expect(JSON.stringify(first.inputManifest)).not.toContain('source body');
  });

  it('changes for blob, entry path, and compiler contract changes but ignores repository metadata', () => {
    const entry = createEntry();
    const files = compileFiles();
    const first = buildLightExtensionCompileKey({ entry, files });
    const changedBlob = buildLightExtensionCompileKey({
      entry,
      files: files.map((file) =>
        file.path.endsWith('/index.tsx') ? { ...file, blobHash: 'blob_entry_changed' } : file,
      ),
    });
    const moved = buildLightExtensionCompileKey({
      entry: {
        ...entry,
        entryPath: 'src/client/js-blocks/moved/index.tsx',
        descriptorPath: 'src/client/js-blocks/moved/entry.json',
      },
      files: files.map((file) => ({ ...file, path: file.path.replace('/sales/', '/moved/') })),
    });
    const changedBuild = buildLightExtensionCompileKey({
      entry,
      files,
      compilerBuildIdentity: buildLightExtensionCompilerBuildIdentity({
        ...LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
        validatorVersion: 'changed-validator',
      }),
    });
    const changedDisplayMetadata = buildLightExtensionCompileKey({
      entry: { ...entry, repoId: 'repo_other', title: 'Changed title' },
      files,
    });

    expect(changedBlob.compileKey).not.toBe(first.compileKey);
    expect(moved.compileKey).not.toBe(first.compileKey);
    expect(changedBuild.compileKey).not.toBe(first.compileKey);
    expect(changedDisplayMetadata.compileKey).toBe(first.compileKey);
  });
});

describe('light extension trusted compile cache', () => {
  let app: MockServer;
  let repoService: LightExtensionRepoService;
  let fileService: LightExtensionFileService;
  let entryService: LightExtensionEntryService;
  let runtimeCompileService: LightExtensionRuntimeCompileService;
  let compilerBridge: LightExtensionWorkspaceCompilerBridge;
  let metricsSummaries: LightExtensionCompileMetricsSummary[];

  beforeEach(async () => {
    app = await createMockServer({ plugins: [PluginVscFileServer, PluginLightExtensionServer] });
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const validator = new LightExtensionValidator();
    repoService = new LightExtensionRepoService(app.db, auditService, permissionService, undefined, validator);
    fileService = new LightExtensionFileService(
      app.db,
      auditService,
      permissionService,
      repoService,
      undefined,
      validator,
    );
    entryService = new LightExtensionEntryService(app.db, fileService, repoService, validator);
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

  it('compiles only the changed private Entry, advances all ready Entries, and reuses historical keys', async () => {
    const repo = await repoService.createRepo({ name: 'Compile Cache Planner', initialFiles: twoEntryFiles('base') });
    const compileSpy = vi.spyOn(compilerBridge, 'compileEntry');

    const first = await saveCurrent(runtimeCompileService, repoService, repo.id, 'compile v1', twoEntryFiles('v1'));
    expect(compileSpy).toHaveBeenCalledTimes(2);
    expect(first.compile.entries.map((entry) => entry.execution)).toEqual(['compiled', 'compiled']);
    compileSpy.mockClear();
    metricsSummaries = [];

    const privateChange = await saveCurrent(runtimeCompileService, repoService, repo.id, 'change entry a', [
      codeFile('entry-a', 'v2'),
    ]);
    expect(compileSpy).toHaveBeenCalledTimes(1);
    expect(privateChange.compile.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entryName: 'entry-a', execution: 'compiled' }),
        expect.objectContaining({ entryName: 'entry-b', execution: 'reused' }),
      ]),
    );
    expect(runtimeMetrics(metricsSummaries).counters).toMatchObject({
      affectedEntryCount: 1,
      compiledEntryCount: 1,
      reusedEntryCount: 1,
      compileCacheHitCount: 1,
      compileCacheMissCount: 1,
    });
    await expectAllReadyEntriesAtHead(app, repo.id, privateChange.commit.id);
    const lastCompiledAt = (await repoService.getRepo(repo.id)).lastCompiledAt;
    compileSpy.mockClear();
    metricsSummaries = [];

    const metadataOnly = await saveCurrent(runtimeCompileService, repoService, repo.id, 'readme only', [
      { path: 'README.md', content: 'Metadata only\n', language: 'markdown' },
    ]);
    expect(compileSpy).not.toHaveBeenCalled();
    expect(metadataOnly.compile.entries.every((entry) => entry.execution === 'reused')).toBe(true);
    expect(runtimeMetrics(metricsSummaries).counters).toMatchObject({
      affectedEntryCount: 0,
      compiledEntryCount: 0,
      reusedEntryCount: 2,
    });
    await expectAllReadyEntriesAtHead(app, repo.id, metadataOnly.commit.id);
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ lastCompiledAt });
    compileSpy.mockClear();

    const descriptorOnly = await saveCurrent(runtimeCompileService, repoService, repo.id, 'descriptor only', [
      {
        path: 'src/client/js-blocks/entry-a/entry.json',
        content: JSON.stringify({
          schemaVersion: 1,
          key: 'entry-a',
          title: 'Changed display title',
          settings: { region: { type: 'string', default: 'EMEA' } },
        }),
        language: 'json',
      },
    ]);
    expect(compileSpy).not.toHaveBeenCalled();
    expect(descriptorOnly.compile.entries.every((entry) => entry.execution === 'reused')).toBe(true);
    await expectAllReadyEntriesAtHead(app, repo.id, descriptorOnly.commit.id);
    compileSpy.mockClear();

    const reverted = await saveCurrent(runtimeCompileService, repoService, repo.id, 'revert entry a', [
      codeFile('entry-a', 'v1'),
    ]);
    expect(compileSpy).not.toHaveBeenCalled();
    expect(reverted.compile.entries.every((entry) => entry.execution === 'reused')).toBe(true);
    await expectAllReadyEntriesAtHead(app, repo.id, reverted.commit.id);
    compileSpy.mockClear();

    const sharedChange = await saveCurrent(runtimeCompileService, repoService, repo.id, 'add shared source', [
      {
        path: 'src/shared/value.ts',
        content: "export const sharedValue = 'shared-v1';\n",
        language: 'typescript',
      },
    ]);
    expect(compileSpy).toHaveBeenCalledTimes(2);
    expect(sharedChange.compile.entries.every((entry) => entry.execution === 'compiled')).toBe(true);
    await expectAllReadyEntriesAtHead(app, repo.id, sharedChange.commit.id);
  });

  it('keeps a 20-Entry repository runnable while compiling only one private change', async () => {
    const repo = await repoService.createRepo({
      name: 'Twenty Entry Compile Cache',
      initialFiles: manyEntryFiles('base'),
    });
    const compileSpy = vi.spyOn(compilerBridge, 'compileEntry');
    await saveCurrent(runtimeCompileService, repoService, repo.id, 'compile twenty entries', manyEntryFiles('v1'));
    expect(compileSpy).toHaveBeenCalledTimes(20);
    compileSpy.mockClear();
    metricsSummaries = [];

    const saved = await saveCurrent(runtimeCompileService, repoService, repo.id, 'change one of twenty', [
      codeFile('entry-07', 'v2'),
    ]);
    expect(compileSpy).toHaveBeenCalledTimes(1);
    expect(saved.compile.entries.filter((entry) => entry.execution === 'compiled')).toHaveLength(1);
    expect(saved.compile.entries.filter((entry) => entry.execution === 'reused')).toHaveLength(19);
    expect(runtimeMetrics(metricsSummaries).counters).toMatchObject({
      entryCount: 20,
      affectedEntryCount: 1,
      compiledEntryCount: 1,
      reusedEntryCount: 19,
    });
    await expectAllReadyEntriesAtHead(app, repo.id, saved.commit.id);

    const runtimeResolveService = new RuntimeResolveService(app.db);
    const entries = await app.db.getRepository('lightExtensionEntries').find({
      filter: { repoId: repo.id, healthStatus: 'ready' },
      sort: ['entryName'],
    });
    for (const entry of entries) {
      await expect(
        runtimeResolveService.resolve({
          sourceMode: 'light-extension',
          sourceBinding: {
            type: 'light-extension-entry',
            repoId: repo.id,
            entryId: String(entry.get('id')),
            kind: 'js-block',
          },
        }),
      ).resolves.toMatchObject({ entryId: entry.get('id') });
    }
  });

  it('falls back safely for missing artifacts, failed compiles, disabled lookup, and cleared cache', async () => {
    const repo = await repoService.createRepo({ name: 'Compile Cache Recovery', initialFiles: oneEntryFiles('base') });
    const compileSpy = vi.spyOn(compilerBridge, 'compileEntry');
    const first = await saveCurrent(runtimeCompileService, repoService, repo.id, 'compile v1', oneEntryFiles('v1'));
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: first.compile.entries[0].entryId,
    });
    const artifactHash = String(entry?.get('artifactHash'));
    await app.db.getRepository('lightExtensionRuntimeArtifacts').destroy({ filterByTk: artifactHash });
    compileSpy.mockClear();
    metricsSummaries = [];

    const repaired = await saveCurrent(runtimeCompileService, repoService, repo.id, 'repair missing artifact', [
      { path: 'README.md', content: 'Repair cache\n', language: 'markdown' },
    ]);
    expect(compileSpy).toHaveBeenCalledTimes(1);
    expect(runtimeMetrics(metricsSummaries).counters).toMatchObject({
      compileCacheCorruptCount: 1,
      compileCacheMissCount: 1,
      compiledEntryCount: 1,
    });
    await expectAllReadyEntriesAtHead(app, repo.id, repaired.commit.id);
    const cacheRow = await app.db.getRepository('lightExtensionCompileCache').findOne({
      filterByTk: String(
        (await app.db.getRepository('lightExtensionEntries').findOne({ filterByTk: entry?.get('id') }))?.get(
          'compiledInputKey',
        ),
      ),
    });
    await cacheRow?.update({ runtimeContract: 'corrupt-runtime-contract' });
    compileSpy.mockClear();
    metricsSummaries = [];
    const contractRepaired = await saveCurrent(runtimeCompileService, repoService, repo.id, 'repair contract', [
      { path: 'README.md', content: 'Repair contract\n', language: 'markdown' },
    ]);
    expect(compileSpy).toHaveBeenCalledTimes(1);
    expect(runtimeMetrics(metricsSummaries).counters).toMatchObject({ compileCacheCorruptCount: 1 });
    await expectAllReadyEntriesAtHead(app, repo.id, contractRepaired.commit.id);
    const cacheCountBeforeFailure = await app.db.getRepository('lightExtensionCompileCache').count();

    await expect(
      saveCurrent(runtimeCompileService, repoService, repo.id, 'broken compile', [
        {
          path: 'src/client/js-blocks/entry-a/index.tsx',
          content: "import Missing from './missing';\nctx.render(<Missing />);\n",
          language: 'typescript',
        },
      ]),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_VALIDATION_FAILED' });
    await expect(app.db.getRepository('lightExtensionCompileCache').count()).resolves.toBe(cacheCountBeforeFailure);
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: contractRepaired.commit.id });

    runtimeCompileService.setCompileCacheEnabled(false);
    compileSpy.mockClear();
    const disabled = await saveCurrent(runtimeCompileService, repoService, repo.id, 'cache lookup disabled', [
      { path: 'README.md', content: 'Disabled lookup\n', language: 'markdown' },
    ]);
    expect(compileSpy).toHaveBeenCalledTimes(1);
    await expectAllReadyEntriesAtHead(app, repo.id, disabled.commit.id);

    runtimeCompileService.setCompileCacheEnabled(true);
    await runtimeCompileService.clearCompileCache();
    await expect(app.db.getRepository('lightExtensionCompileCache').count()).resolves.toBe(0);
    compileSpy.mockClear();
    const restored = await saveCurrent(runtimeCompileService, repoService, repo.id, 'restore cleared cache', [
      { path: 'README.md', content: 'Cleared cache\n', language: 'markdown' },
    ]);
    expect(compileSpy).toHaveBeenCalledTimes(1);
    await expect(app.db.getRepository('lightExtensionCompileCache').count()).resolves.toBe(1);
    await expectAllReadyEntriesAtHead(app, repo.id, restored.commit.id);
  });

  it('rebuilds Entry-specific metadata on cross-repository reuse and misses after a build-id change', async () => {
    const firstRepo = await repoService.createRepo({ name: 'Cache Source Repo', initialFiles: oneEntryFiles('base') });
    await saveCurrent(runtimeCompileService, repoService, firstRepo.id, 'compile shared input', oneEntryFiles('v1'));
    const secondRepo = await repoService.createRepo({ name: 'Cache Target Repo', initialFiles: oneEntryFiles('base') });
    const compileSpy = vi.spyOn(compilerBridge, 'compileEntry');

    const reused = await saveCurrent(
      runtimeCompileService,
      repoService,
      secondRepo.id,
      'reuse cross repo',
      oneEntryFiles('v1'),
    );
    expect(compileSpy).not.toHaveBeenCalled();
    expect(reused.compile.entries[0].execution).toBe('reused');
    const reusedEntry = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: reused.compile.entries[0].entryId,
    });
    expect(reusedEntry?.get('runtimeArtifact')).toMatchObject({
      metadata: {
        repoId: secondRepo.id,
        entryId: reused.compile.entries[0].entryId,
        entryName: 'entry-a',
      },
    });

    const changedBuildIdentity = buildLightExtensionCompilerBuildIdentity({
      ...LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
      importSecurityPolicy: 'light-extension.import-security.changed',
    });
    const buildAwareService = new LightExtensionRuntimeCompileService(
      app.db,
      fileService,
      entryService,
      compilerBridge,
      undefined,
      { compilerBuildIdentity: changedBuildIdentity },
    );
    compileSpy.mockClear();
    const rebuilt = await saveCurrent(buildAwareService, repoService, secondRepo.id, 'new compiler build', [
      { path: 'README.md', content: 'New build identity\n', language: 'markdown' },
    ]);
    expect(compileSpy).toHaveBeenCalledTimes(1);
    const rebuiltEntry = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: rebuilt.compile.entries[0].entryId,
    });
    expect(rebuiltEntry?.get('compilerBuildId')).toBe(changedBuildIdentity.compilerBuildId);
  });

  it('treats legacy Entry rows without input identity as a one-time cache miss', async () => {
    const repo = await repoService.createRepo({ name: 'Legacy Compile Identity', initialFiles: oneEntryFiles('base') });
    const first = await saveCurrent(
      runtimeCompileService,
      repoService,
      repo.id,
      'compile legacy source',
      oneEntryFiles('v1'),
    );
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: first.compile.entries[0].entryId,
    });
    await entry?.update({ compiledInputKey: null, compilerBuildId: null });
    const compileSpy = vi.spyOn(compilerBridge, 'compileEntry');

    await saveCurrent(runtimeCompileService, repoService, repo.id, 'fill legacy identity', [
      { path: 'README.md', content: 'Legacy identity\n', language: 'markdown' },
    ]);
    expect(compileSpy).toHaveBeenCalledTimes(1);
    const current = await app.db.getRepository('lightExtensionEntries').findOne({ filterByTk: entry?.get('id') });
    expect(current?.get('compiledInputKey')).toMatch(/^[a-f0-9]{64}$/u);
    expect(current?.get('compilerBuildId')).toMatch(/^[a-f0-9]{64}$/u);
  });
});

async function saveCurrent(
  service: LightExtensionRuntimeCompileService,
  repoService: LightExtensionRepoService,
  repoId: string,
  message: string,
  files: Array<{ path: string; content: string; language: string }>,
) {
  const repo = await repoService.getRepo(repoId);
  return service.saveSource({
    repoId,
    expectedHeadCommitId: repo.headCommitId,
    message,
    files,
  });
}

function runtimeMetrics(summaries: LightExtensionCompileMetricsSummary[]): LightExtensionCompileMetricsSummary {
  const summary = [...summaries].reverse().find((item) => item.operation === 'runtimeCompile');
  if (!summary) {
    throw new Error('Runtime compile metrics were not collected');
  }
  return summary;
}

async function expectAllReadyEntriesAtHead(app: MockServer, repoId: string, commitId: string): Promise<void> {
  const entries = await app.db.getRepository('lightExtensionEntries').find({
    filter: { repoId, healthStatus: 'ready' },
  });
  expect(entries.length).toBeGreaterThan(0);
  for (const entry of entries) {
    expect(entry.get('compiledCommitId')).toBe(commitId);
    expect(entry.get('compiledInputKey')).toMatch(/^[a-f0-9]{64}$/u);
    expect(entry.get('compilerBuildId')).toMatch(/^[a-f0-9]{64}$/u);
  }
}

function twoEntryFiles(version: string) {
  return [...oneEntryFiles(version), ...entryFiles('entry-b', version)];
}

function manyEntryFiles(version: string) {
  return [
    { path: 'README.md', content: `Twenty entries ${version}\n`, language: 'markdown' },
    ...Array.from({ length: 20 }, (_, index) =>
      entryFiles(`entry-${String(index + 1).padStart(2, '0')}`, version),
    ).flat(),
  ];
}

function oneEntryFiles(version: string) {
  return [
    { path: 'README.md', content: `Compile cache ${version}\n`, language: 'markdown' },
    ...entryFiles('entry-a', version),
  ];
}

function entryFiles(entryName: string, version: string) {
  return [
    codeFile(entryName, version),
    {
      path: `src/client/js-blocks/${entryName}/entry.json`,
      content: JSON.stringify({ schemaVersion: 1, key: entryName, title: entryName }),
      language: 'json',
    },
  ];
}

function codeFile(entryName: string, version: string) {
  return {
    path: `src/client/js-blocks/${entryName}/index.tsx`,
    content: `ctx.render(<div>${entryName}-${version}</div>);\n`,
    language: 'typescript',
  };
}

function createEntry(): LightExtensionEntryRecord {
  return {
    id: 'entry_sales',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-block',
    entryName: 'sales',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
    descriptorPath: 'src/client/js-blocks/sales/entry.json',
    title: 'Sales',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: null,
    settingsSchemaHash: null,
    compiledCommitId: null,
    compiledInputKey: null,
    compilerBuildId: null,
    runtimeArtifact: null,
    runtimeVersion: null,
    surfaceStyle: null,
    runtimeCodeHash: null,
    artifactHash: null,
    filesHash: null,
    settingsDefaultsHash: null,
    compiledAt: null,
    healthStatus: 'ready',
    diagnostics: [],
  };
}

function compileFiles(): CompileInputManifestSourceFile[] {
  return [
    {
      path: 'README.md',
      blobHash: 'blob_readme',
      language: 'markdown',
      mode: '100644',
    },
    {
      path: 'src/shared/format.ts',
      blobHash: 'blob_shared',
      language: 'typescript',
      mode: '100644',
    },
    {
      path: 'src/client/js-blocks/sales/entry.json',
      blobHash: 'blob_descriptor',
      language: 'json',
      mode: '100644',
    },
    {
      path: 'src/client/js-blocks/sales/index.tsx',
      blobHash: 'blob_entry',
      language: 'typescript',
      mode: '100644',
    },
  ];
}
