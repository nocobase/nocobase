/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';

import type { LightExtensionSaveSourceInput } from '../../shared/types';
import PluginLightExtensionServer from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import {
  buildLightExtensionCompilerBuildIdentity,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
} from '../services/LightExtensionCompileContract';
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionRepoService, type LightExtensionServiceContext } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';
import { PublishCompiledEntriesService } from '../services/PublishCompiledEntriesService';
import { RuntimeResolveService } from '../services/RuntimeResolveService';

describe('plugin-light-extension saveSource runtime compile', () => {
  let app: MockServer;
  let repoService: LightExtensionRepoService;
  let runtimeCompileService: LightExtensionRuntimeCompileService;
  let runtimeResolveService: RuntimeResolveService;
  let compilerBridge: LightExtensionWorkspaceCompilerBridge;
  let fileService: LightExtensionFileService;
  let entryService: LightExtensionEntryService;
  let validator: LightExtensionValidator;
  let auditService: LightExtensionAuditService;
  let permissionService: LightExtensionPermissionService;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginLightExtensionServer],
    });
    auditService = new LightExtensionAuditService(app.db);
    permissionService = new LightExtensionPermissionService(auditService);
    validator = new LightExtensionValidator();
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
    runtimeCompileService = new LightExtensionRuntimeCompileService(app.db, fileService, entryService, compilerBridge);
    runtimeResolveService = new RuntimeResolveService(app.db);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  const saveCurrentSource = async (input: Omit<LightExtensionSaveSourceInput, 'expectedHeadCommitId'>) => {
    const currentRepo = await repoService.getRepo(input.repoId);
    return runtimeCompileService.saveSource({
      ...input,
      expectedHeadCommitId: currentRepo.headCommitId,
    });
  };

  it('saves source, compiles ready entries, and resolves runtime from the entry current artifact', async () => {
    const repo = await repoService.createRepo({ name: 'Save Source Runtime', initialFiles: baselineSalesKpiFiles() });

    const result = await saveCurrentSource({
      repoId: repo.id,
      message: 'save source runtime',
      files: validSalesKpiFiles(),
    });
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: result.compile.entries[0].entryId,
    });
    const compileLogs = await app.db.getRepository('lightExtensionLogs').find({
      filter: {
        repoId: repo.id,
        action: 'runtimeCompile',
      },
    });
    const runtime = await runtimeResolveService.resolve({
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: repo.id,
        entryId: result.compile.entries[0].entryId,
        kind: 'js-block',
      },
      settings: {
        region: 'EMEA',
      },
    });
    const runtimeArtifact = await runtimeResolveService.getArtifact(runtime.artifactHash);

    expect(result.compile.status).toBe('success');
    expect(result.diagnostics).toEqual([]);
    expect(compileLogs).toHaveLength(1);
    expect(entry?.get('compiledCommitId')).toBe(result.commit.id);
    expect(entry?.get('runtimeArtifact')).toMatchObject({
      version: 'v2',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    });
    expect(runtime).toMatchObject({
      entryId: result.compile.entries[0].entryId,
      version: 'v2',
      settings: {
        region: 'EMEA',
      },
      artifactHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
    });
    expect(runtime).not.toHaveProperty('code');
    expect(runtimeArtifact.code).toContain('Sales KPI');
  });

  it('only recompiles the Entry whose local source changed', async () => {
    const repo = await repoService.createRepo({
      name: 'Incremental Entry Save',
      initialFiles: preciseSharedDependencyFiles(),
    });
    await saveCurrentSource({
      repoId: repo.id,
      message: 'establish compiled entries',
      files: [{ path: 'README.md', content: '# Incremental entry fixture\n', language: 'markdown' }],
    });
    const compileEntrySpy = vi.spyOn(compilerBridge, 'compileEntry');

    const updated = await saveCurrentSource({
      repoId: repo.id,
      message: 'change one Entry source',
      files: [
        {
          path: 'src/client/js-blocks/dependent/index.tsx',
          content: `import { runtimeValue } from '../../../shared/runtime-value'; ctx.render(<div>Updated {runtimeValue}</div>);`,
          language: 'typescript',
        },
      ],
    });
    const afterEntries = await app.db.getRepository('lightExtensionEntries').find({
      filter: { repoId: repo.id },
      sort: ['entryName'],
    });

    expect(compileEntrySpy).toHaveBeenCalledTimes(1);
    expect(compileEntrySpy).toHaveBeenCalledWith(
      expect.objectContaining({ entryName: 'dependent' }),
      expect.any(Object),
    );
    expect(updated.compile.status).toBe('success');
    expect(updated.compile.entries).toEqual([
      expect.objectContaining({ entryName: 'dependent', execution: 'compiled' }),
      expect.objectContaining({ entryName: 'independent', execution: 'skipped' }),
    ]);
    expect(afterEntries.every((entry) => entry.get('compiledCommitId') === updated.commit.id)).toBe(true);
  });

  it('conservatively recompiles every ready Entry after a shared source change', async () => {
    const repo = await repoService.createRepo({
      name: 'Precise Shared Dependency Save',
      initialFiles: preciseSharedDependencyFiles(),
    });
    const initial = await saveCurrentSource({
      repoId: repo.id,
      message: 'establish compiled entries',
      files: [{ path: 'README.md', content: '# Precise dependency fixture\n', language: 'markdown' }],
    });
    expect(initial.compile.entries).toHaveLength(2);
    expect(initial.compile.entries.every((entry) => entry.execution === 'compiled')).toBe(true);

    const updated = await saveCurrentSource({
      repoId: repo.id,
      message: 'change one shared runtime dependency',
      files: [
        {
          path: 'src/shared/runtime-value.ts',
          content: 'export const runtimeValue = 2;\n',
          language: 'typescript',
        },
      ],
    });
    const afterEntries = await app.db.getRepository('lightExtensionEntries').find({
      filter: { repoId: repo.id },
      sort: ['entryName'],
    });

    expect(updated.compile.entries).toHaveLength(2);
    expect(updated.compile.entries.every((entry) => entry.execution === 'compiled')).toBe(true);
    expect(afterEntries.every((entry) => entry.get('compiledCommitId') === updated.commit.id)).toBe(true);
  });

  it('rebuilds missing or corrupt immutable artifacts and recompiles after a compiler build change', async () => {
    const repo = await repoService.createRepo({
      name: 'Compile All Recovery',
      initialFiles: preciseSharedDependencyFiles(),
    });
    const initial = await saveCurrentSource({
      repoId: repo.id,
      message: 'establish immutable artifacts',
      files: [{ path: 'README.md', content: '# Compile all recovery\n', language: 'markdown' }],
    });
    expect(initial.compile.entries.every((entry) => entry.execution === 'compiled')).toBe(true);
    const compileEntrySpy = vi.spyOn(compilerBridge, 'compileEntry');
    const entries = await app.db.getRepository('lightExtensionEntries').find({
      filter: { repoId: repo.id },
      sort: ['entryName'],
    });
    const firstArtifactHash = String(entries[0].get('artifactHash'));
    const secondArtifactHash = String(entries[1].get('artifactHash'));
    await app.db.getRepository('lightExtensionRuntimeArtifacts').destroy({ filterByTk: firstArtifactHash });
    const corruptArtifact = await app.db.getRepository('lightExtensionRuntimeArtifacts').findOne({
      filterByTk: secondArtifactHash,
    });
    if (!corruptArtifact) {
      throw new Error('Expected the second immutable artifact');
    }
    await corruptArtifact.update({
      code: 'corrupt artifact code',
      entryPath: 'src/client/js-blocks/wrong/index.tsx',
      runtimeContract: 'corrupt.runtime-contract',
    });

    const repaired = await saveCurrentSource({
      repoId: repo.id,
      message: 'repair immutable artifacts from current Entry artifacts',
      files: [{ path: 'README.md', content: '# Repair artifacts\n', language: 'markdown' }],
    });
    expect(compileEntrySpy).not.toHaveBeenCalled();
    expect(repaired.compile.status).toBe('skipped');
    expect(repaired.compile.entries.every((entry) => entry.execution === 'skipped')).toBe(true);
    await expect(
      app.db.getRepository('lightExtensionRuntimeArtifacts').findOne({ filterByTk: firstArtifactHash }),
    ).resolves.toBeTruthy();
    await expect(
      app.db.getRepository('lightExtensionRuntimeArtifacts').findOne({ filterByTk: secondArtifactHash }),
    ).resolves.toMatchObject({
      entryPath: expect.not.stringContaining('/wrong/'),
      runtimeContract: 'light-extension.runtime-artifact.v1',
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
      { compilerBuildIdentity: changedBuildIdentity },
    );
    const rebuilt = await buildAwareService.saveSource({
      repoId: repo.id,
      expectedHeadCommitId: repaired.commit.id,
      message: 'recompile with changed build identity',
      files: [{ path: 'README.md', content: '# Changed build\n', language: 'markdown' }],
    });
    const rebuiltEntries = await app.db.getRepository('lightExtensionEntries').find({ filter: { repoId: repo.id } });

    expect(compileEntrySpy).toHaveBeenCalledTimes(2);
    expect(rebuilt.compile.entries.every((entry) => entry.execution === 'compiled')).toBe(true);
    expect(rebuiltEntries.every((entry) => entry.get('compilerBuildId') === changedBuildIdentity.compilerBuildId)).toBe(
      true,
    );
  });

  it('reuses one canonical candidate for validation, reconcile, and Save compilation', async () => {
    const repo = await repoService.createRepo({
      name: 'Canonical Candidate Save',
      initialFiles: baselineSalesKpiFiles(),
    });
    const pullSpy = vi.spyOn(fileService, 'pull');
    const pullCommitSpy = vi.spyOn(fileService, 'pullCommit');
    const candidateSpy = vi.spyOn(fileService, 'prepareSourceCandidate');
    const prepareEntriesSpy = vi.spyOn(entryService, 'prepareEntries');
    const reconcileCandidateSpy = vi.spyOn(entryService, 'planReconcileEntries');
    const validateWorkspaceSpy = vi.spyOn(validator, 'validateWorkspace');
    const compileEntrySpy = vi.spyOn(compilerBridge, 'compileEntry');

    const result = await saveCurrentSource({
      repoId: repo.id,
      message: 'canonical Save',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: '\uFEFFconst title = "销售指标";\r\nctx.render(<div>{title}</div>);\r',
          language: 'typescript',
        },
      ],
    });
    const preparedCandidate = await candidateSpy.mock.results[0].value;
    const candidate = preparedCandidate.vscPreparedPush.candidate;
    const canonicalContent = 'const title = "销售指标";\nctx.render(<div>{title}</div>);\n';
    const candidateFile = candidate.files.find((file) => file.path.endsWith('/index.tsx'));
    const validatedFile = validateWorkspaceSpy.mock.calls[0][0].files.find((file) => file.path.endsWith('/index.tsx'));
    const compiledFile = compileEntrySpy.mock.calls[0][0].files.find((file) => file.path.endsWith('/index.tsx'));

    expect(pullSpy).not.toHaveBeenCalled();
    expect(pullCommitSpy).not.toHaveBeenCalled();
    expect(prepareEntriesSpy).not.toHaveBeenCalled();
    expect(candidateSpy).toHaveBeenCalledTimes(1);
    expect(validateWorkspaceSpy).toHaveBeenCalledTimes(1);
    expect(reconcileCandidateSpy).toHaveBeenCalledTimes(1);
    expect(reconcileCandidateSpy.mock.calls[0][0]).toBe(repo.id);
    expect(candidate.changedPaths).toEqual(['src/client/js-blocks/sales-kpi/index.tsx']);
    expect(candidateFile?.content).toBe(canonicalContent);
    expect(validatedFile?.content).toBe(canonicalContent);
    expect(compiledFile?.content).toBe(canonicalContent);
    expect(candidateFile?.size).toBe(Buffer.byteLength(canonicalContent, 'utf8'));
    expect(candidate.treeHash).toBe(result.commit.treeHash);
    expect(result).not.toHaveProperty('candidate');
    expect(result).not.toHaveProperty('files');

    pullCommitSpy.mockRestore();
    const persisted = await fileService.pullCommit({
      repoId: repo.id,
      commitId: result.commit.id,
      includeContent: 'all',
    });
    expect(persisted.files?.find((file) => file.path.endsWith('/index.tsx'))?.content).toBe(canonicalContent);
  });

  it('rejects prepared source candidates from another file service or a shape-compatible clone', async () => {
    const repo = await repoService.createRepo({
      name: 'Prepared Source Candidate Identity',
      initialFiles: baselineSalesKpiFiles(),
    });
    const prepared = await fileService.prepareSourceCandidate({
      repoId: repo.id,
      expectedHeadCommitId: repo.headCommitId,
      message: 'prepare source candidate identity',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Prepared source identity</div>);\n',
          language: 'typescript',
        },
      ],
    });
    const otherFileService = new LightExtensionFileService(
      app.db,
      auditService,
      permissionService,
      repoService,
      undefined,
      validator,
    );
    const forged = { ...prepared };

    await expect(
      app.db.sequelize.transaction((transaction) => otherFileService.publishSourceCandidate(prepared, { transaction })),
    ).rejects.toThrow('must be created by this file service instance');
    await expect(
      app.db.sequelize.transaction((transaction) => fileService.publishSourceCandidate(forged, { transaction })),
    ).rejects.toThrow('must be created by this file service instance');
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: repo.headCommitId });
  });

  it('rejects prepared saves from another runtime service or a shape-compatible clone', async () => {
    const repo = await repoService.createRepo({
      name: 'Prepared Save Identity',
      initialFiles: baselineSalesKpiFiles(),
    });
    const prepared = await runtimeCompileService.prepareSaveSource({
      repoId: repo.id,
      expectedHeadCommitId: repo.headCommitId,
      message: 'prepare save identity',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Prepared save identity</div>);\n',
          language: 'typescript',
        },
      ],
    });
    const otherRuntimeCompileService = new LightExtensionRuntimeCompileService(
      app.db,
      fileService,
      entryService,
      compilerBridge,
    );
    const forged = { ...prepared };

    await expect(
      app.db.sequelize.transaction((transaction) =>
        otherRuntimeCompileService.publishPreparedSave(prepared, { transaction }),
      ),
    ).rejects.toThrow('must be created by this runtime compile service instance');
    await expect(
      app.db.sequelize.transaction((transaction) => runtimeCompileService.publishPreparedSave(forged, { transaction })),
    ).rejects.toThrow('must be created by this runtime compile service instance');
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: repo.headCommitId });
  });

  it('rejects a prepared save when the compiler and type-library identity changes before publish', async () => {
    const compilerBuildIdentity = structuredClone(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY);
    const buildAwareService = new LightExtensionRuntimeCompileService(
      app.db,
      fileService,
      entryService,
      compilerBridge,
      { compilerBuildIdentity },
    );
    const repo = await repoService.createRepo({
      name: 'Prepared Save Compile Identity',
      initialFiles: baselineSalesKpiFiles(),
    });
    const prepared = await buildAwareService.prepareSaveSource({
      repoId: repo.id,
      expectedHeadCommitId: repo.headCommitId,
      message: 'prepare compile identity',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Prepared compile identity</div>);\n',
          language: 'typescript',
        },
      ],
    });
    const changedRunjsBuildId = 'a'.repeat(64);
    compilerBuildIdentity.runjs.components.typeLibraryFingerprint = 'b'.repeat(64);
    compilerBuildIdentity.runjs.compilerBuildId = changedRunjsBuildId;
    compilerBuildIdentity.components.runjsCompilerBuildId = changedRunjsBuildId;
    compilerBuildIdentity.compilerBuildId = buildLightExtensionCompilerBuildIdentity(
      compilerBuildIdentity.components,
      compilerBuildIdentity.runjs,
    ).compilerBuildId;

    await expect(
      app.db.sequelize.transaction((transaction) => buildAwareService.publishPreparedSave(prepared, { transaction })),
    ).rejects.toThrow('compile inputs changed before the prepared workspace was published');
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: repo.headCommitId });
  });

  it('rejects a prepared save when descriptor or settings inputs change before publish', async () => {
    const repo = await repoService.createRepo({
      name: 'Prepared Save Entry Inputs',
      initialFiles: baselineSalesKpiFiles(),
    });
    const prepared = await runtimeCompileService.prepareSaveSource({
      repoId: repo.id,
      expectedHeadCommitId: repo.headCommitId,
      message: 'prepare entry inputs',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Prepared entry inputs</div>);\n',
          language: 'typescript',
        },
      ],
    });
    const preparedEntry = prepared.entryPlan.result.entries[0];
    preparedEntry.descriptorPath = 'src/client/js-blocks/sales-kpi/changed-entry.json';
    preparedEntry.settingsSchemaHash = 'c'.repeat(64);

    await expect(
      app.db.sequelize.transaction((transaction) =>
        runtimeCompileService.publishPreparedSave(prepared, { transaction }),
      ),
    ).rejects.toThrow('compile inputs changed before the prepared workspace was published');
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: repo.headCommitId });
  });

  it('persists and resolves an immutable JS Page render artifact', async () => {
    const descriptor = {
      path: 'src/client/js-pages/orders/entry.json',
      content: JSON.stringify({
        schemaVersion: 1,
        key: 'orders',
        settings: {
          title: { type: 'string' },
        },
      }),
      language: 'json',
    };
    const repo = await repoService.createRepo({
      name: 'JS Page Runtime',
      initialFiles: [
        descriptor,
        {
          path: 'src/client/js-pages/orders/index.tsx',
          content: 'ctx.render(ctx.page.uid);\n',
          language: 'typescript',
        },
      ],
    });

    const result = await saveCurrentSource({
      repoId: repo.id,
      message: 'compile js page runtime',
      files: [
        {
          path: 'src/shared/format.ts',
          content: 'export const format = (uid: string, title: string) => `${uid}:${title}`;\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-pages/orders/index.tsx',
          content:
            'import { format } from "../../../shared/format";\nctx.render(format(ctx.page.uid, String(ctx.settings.title)));\n',
          language: 'typescript',
        },
      ],
    });
    const compiled = result.compile.entries[0];
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({ filterByTk: compiled.entryId });
    const runtime = await runtimeResolveService.resolve({
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: repo.id,
        entryId: compiled.entryId,
        kind: 'js-page',
      },
      settings: { title: 'Orders' },
    });
    const artifact = await runtimeResolveService.getArtifact(runtime.artifactHash);

    expect(result).toMatchObject({ compile: { status: 'success' }, diagnostics: [] });
    expect(entry?.get('kind')).toBe('js-page');
    expect(entry?.get('surfaceStyle')).toBe('render');
    expect(entry?.get('runtimeArtifact')).toMatchObject({
      version: 'v2',
      entryPath: 'src/client/js-pages/orders/index.tsx',
      metadata: expect.objectContaining({ kind: 'js-page', modelUse: 'JSPageModel' }),
    });
    expect(runtime).toMatchObject({
      entryId: compiled.entryId,
      version: 'v2',
      settings: { title: 'Orders' },
      artifactHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
    });
    expect(runtime).not.toHaveProperty('code');
    expect(artifact).toMatchObject({
      entryPath: 'src/client/js-pages/orders/index.tsx',
      runtimeContract: 'light-extension.runtime-artifact.v1',
    });
  });

  it('keeps descriptor hashes isolated from runtime hashes and tracks ordinary JSON modules', async () => {
    const repo = await repoService.createRepo({
      name: 'Hash Isolation',
      initialFiles: baselineSalesKpiFiles(),
    });
    const entryRepository = app.db.getRepository('lightExtensionEntries');
    const artifactRepository = app.db.getRepository('lightExtensionRuntimeArtifacts');
    const readEntry = async () => {
      const entry = await entryRepository.findOne({ filter: { repoId: repo.id, entryName: 'sales-kpi' } });
      expect(entry).toBeTruthy();
      return {
        compiledCommitId: String(entry?.get('compiledCommitId')),
        filesHash: String(entry?.get('filesHash')),
        runtimeCodeHash: String(entry?.get('runtimeCodeHash')),
        artifactHash: String(entry?.get('artifactHash')),
        settingsSchemaHash: String(entry?.get('settingsSchemaHash')),
        settingsDefaultsHash: String(entry?.get('settingsDefaultsHash')),
      };
    };

    const initial = await saveCurrentSource({
      repoId: repo.id,
      message: 'compile initial hash contract',
      files: salesKpiJsonModuleFiles({ descriptorTitle: 'Sales KPI', dataTitle: 'Revenue' }),
    });
    const initialHashes = await readEntry();
    expect(initialHashes.compiledCommitId).toBe(initial.commit.id);
    await expect(artifactRepository.count()).resolves.toBe(1);

    const titleChanged = await saveCurrentSource({
      repoId: repo.id,
      message: 'change descriptor title',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/entry.json',
          content: JSON.stringify(
            salesKpiDescriptor({ descriptorTitle: 'Revenue KPI', propertyTitle: 'Region', defaultRegion: 'APAC' }),
          ),
          language: 'json',
        },
      ],
    });
    const titleHashes = await readEntry();
    expect(titleHashes.compiledCommitId).toBe(titleChanged.commit.id);
    expectRuntimeHashes(titleHashes, initialHashes);
    expect(titleHashes.settingsSchemaHash).toBe(initialHashes.settingsSchemaHash);
    expect(titleHashes.settingsDefaultsHash).toBe(initialHashes.settingsDefaultsHash);
    await expect(artifactRepository.count()).resolves.toBe(1);

    await saveCurrentSource({
      repoId: repo.id,
      message: 'reorder settings properties',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/entry.json',
          content: JSON.stringify(
            salesKpiDescriptor({
              descriptorTitle: 'Revenue KPI',
              propertyTitle: 'Region',
              defaultRegion: 'APAC',
              reverseProperties: true,
            }),
          ),
          language: 'json',
        },
      ],
    });
    const reorderedHashes = await readEntry();
    expectRuntimeHashes(reorderedHashes, initialHashes);
    expect(reorderedHashes.settingsSchemaHash).not.toBe(titleHashes.settingsSchemaHash);
    expect(reorderedHashes.settingsDefaultsHash).toBe(titleHashes.settingsDefaultsHash);
    await expect(artifactRepository.count()).resolves.toBe(1);

    await saveCurrentSource({
      repoId: repo.id,
      message: 'change settings UI declaration',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/entry.json',
          content: JSON.stringify(
            salesKpiDescriptor({
              descriptorTitle: 'Revenue KPI',
              propertyTitle: 'Sales region',
              defaultRegion: 'APAC',
              component: 'Select',
              reverseProperties: true,
            }),
          ),
          language: 'json',
        },
      ],
    });
    const uiHashes = await readEntry();
    expectRuntimeHashes(uiHashes, initialHashes);
    expect(uiHashes.settingsSchemaHash).not.toBe(initialHashes.settingsSchemaHash);
    expect(uiHashes.settingsDefaultsHash).toBe(initialHashes.settingsDefaultsHash);
    await expect(artifactRepository.count()).resolves.toBe(1);

    await saveCurrentSource({
      repoId: repo.id,
      message: 'change settings default',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/entry.json',
          content: JSON.stringify(
            salesKpiDescriptor({
              descriptorTitle: 'Revenue KPI',
              propertyTitle: 'Sales region',
              defaultRegion: 'EMEA',
              component: 'Select',
              reverseProperties: true,
            }),
          ),
          language: 'json',
        },
      ],
    });
    const defaultHashes = await readEntry();
    expectRuntimeHashes(defaultHashes, initialHashes);
    expect(defaultHashes.settingsSchemaHash).not.toBe(uiHashes.settingsSchemaHash);
    expect(defaultHashes.settingsDefaultsHash).not.toBe(uiHashes.settingsDefaultsHash);
    await expect(artifactRepository.count()).resolves.toBe(1);

    await saveCurrentSource({
      repoId: repo.id,
      message: 'change runtime code',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: "import data from './data.json';\nctx.render(<strong>{data.title}</strong>);\n",
          language: 'typescript',
        },
      ],
    });
    const codeHashes = await readEntry();
    expect(codeHashes.filesHash).not.toBe(defaultHashes.filesHash);
    expect(codeHashes.runtimeCodeHash).not.toBe(defaultHashes.runtimeCodeHash);
    expect(codeHashes.artifactHash).not.toBe(defaultHashes.artifactHash);
    expect(codeHashes.settingsSchemaHash).toBe(defaultHashes.settingsSchemaHash);
    expect(codeHashes.settingsDefaultsHash).toBe(defaultHashes.settingsDefaultsHash);
    await expect(artifactRepository.count()).resolves.toBe(2);

    await saveCurrentSource({
      repoId: repo.id,
      message: 'change runtime JSON module',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/data.json',
          content: JSON.stringify({ title: 'Orders' }),
          language: 'json',
        },
      ],
    });
    const jsonHashes = await readEntry();
    expect(jsonHashes.filesHash).not.toBe(codeHashes.filesHash);
    expect(jsonHashes.runtimeCodeHash).not.toBe(codeHashes.runtimeCodeHash);
    expect(jsonHashes.artifactHash).not.toBe(codeHashes.artifactHash);
    expect(jsonHashes.settingsSchemaHash).toBe(codeHashes.settingsSchemaHash);
    expect(jsonHashes.settingsDefaultsHash).toBe(codeHashes.settingsDefaultsHash);
    await expect(artifactRepository.count()).resolves.toBe(3);
  });

  it('returns null settings hashes without a schema and stable hashes for an explicit empty schema', async () => {
    const repo = await repoService.createRepo({
      name: 'Null And Empty Settings Schema',
      initialFiles: [
        ...entryFiles('no-schema', 'Initial no schema', { schemaVersion: 1, key: 'no-schema' }),
        ...entryFiles('empty-schema', 'Initial empty schema', {
          schemaVersion: 1,
          key: 'empty-schema',
          settings: {},
        }),
      ],
    });

    await saveCurrentSource({
      repoId: repo.id,
      message: 'compile null and empty schemas',
      files: [
        {
          path: 'src/client/js-blocks/no-schema/index.tsx',
          content: 'ctx.render(<div>No schema</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/empty-schema/index.tsx',
          content: 'ctx.render(<div>Empty schema</div>);\n',
          language: 'typescript',
        },
      ],
    });
    const entries = await app.db.getRepository('lightExtensionEntries').find({
      filter: { repoId: repo.id },
      sort: ['entryName'],
    });
    const emptySchema = entries.find((entry) => entry.get('entryName') === 'empty-schema');
    const noSchema = entries.find((entry) => entry.get('entryName') === 'no-schema');

    expect(noSchema?.get('settingsSchema')).toBeNull();
    expect(noSchema?.get('settingsSchemaHash')).toBeNull();
    expect(noSchema?.get('settingsDefaultsHash')).toBeNull();
    expect(emptySchema?.get('settingsSchema')).toEqual({ type: 'object', properties: {} });
    expect(emptySchema?.get('settingsSchemaHash')).toMatch(/^[a-f0-9]{64}$/u);
    expect(emptySchema?.get('settingsDefaultsHash')).toMatch(/^[a-f0-9]{64}$/u);
    await expect(runtimeResolveService.listSelectableEntries({ repoId: repo.id })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entryName: 'no-schema',
          settingsSchema: null,
          settingsSchemaHash: null,
          settingsDefaultsHash: null,
        }),
        expect.objectContaining({
          entryName: 'empty-schema',
          settingsSchema: { type: 'object', properties: {} },
          settingsSchemaHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
          settingsDefaultsHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
        }),
      ]),
    );
  });

  it('rejects entry.json imports without changing the repository head or current artifact', async () => {
    const repo = await repoService.createRepo({
      name: 'Reject Descriptor Import',
      initialFiles: baselineSalesKpiFiles(),
    });
    const first = await saveCurrentSource({
      repoId: repo.id,
      message: 'compile before descriptor import',
      files: validSalesKpiFiles(),
    });
    const entryId = first.compile.entries[0].entryId;
    const initialEntry = await app.db.getRepository('lightExtensionEntries').findOne({ filterByTk: entryId });
    const initialArtifactHash = initialEntry?.get('artifactHash');

    await expect(
      saveCurrentSource({
        repoId: repo.id,
        message: 'reject descriptor import',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: "import descriptor from './entry.json';\nctx.render(<div>{descriptor.title}</div>);\n",
            language: 'typescript',
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      status: 422,
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'entry_descriptor_import_not_allowed' })]),
      },
    });

    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: first.commit.id });
    const currentEntry = await app.db.getRepository('lightExtensionEntries').findOne({ filterByTk: entryId });
    expect(currentEntry?.get('compiledCommitId')).toBe(first.commit.id);
    expect(currentEntry?.get('artifactHash')).toBe(initialArtifactHash);
  });

  it('rejects invalid settings visibility conditions with HTTP 422 semantics before saving source', async () => {
    const repo = await repoService.createRepo({
      name: 'Reject Invalid Settings Condition',
      initialFiles: baselineSalesKpiFiles(),
    });
    const first = await saveCurrentSource({
      repoId: repo.id,
      message: 'compile before invalid condition',
      files: validSalesKpiFiles(),
    });

    await expect(
      saveCurrentSource({
        repoId: repo.id,
        message: 'reject invalid condition',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/entry.json',
            content: JSON.stringify({
              schemaVersion: 1,
              key: 'sales-kpi',
              settings: {
                mode: { type: 'integer' },
                region: {
                  type: 'string',
                  'x-visible-when': { path: 'mode', operator: '$in', value: 1 },
                },
              },
            }),
            language: 'json',
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      status: 422,
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'settings_condition_value_invalid',
            path: 'src/client/js-blocks/sales-kpi/entry.json',
            details: expect.objectContaining({ schemaPath: expect.stringContaining('x-visible-when') }),
          }),
        ]),
      },
    });
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: first.commit.id });
  });

  it('preserves entryId and runtime bindings when an entry directory is renamed', async () => {
    const repo = await repoService.createRepo({
      name: 'Stable Entry Directory Rename',
      initialFiles: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Initial</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'stable-sales-kpi', title: 'Sales KPI' }),
          language: 'json',
        },
      ],
    });
    const first = await saveCurrentSource({
      repoId: repo.id,
      message: 'compile stable entry',
      files: validSalesKpiFiles().map((file) =>
        file.path.endsWith('/entry.json')
          ? {
              ...file,
              content: JSON.stringify({
                schemaVersion: 1,
                key: 'stable-sales-kpi',
                title: 'Sales KPI',
                settings: {},
              }),
            }
          : file,
      ),
    });
    const originalEntryId = first.compile.entries[0].entryId;

    const renamed = await saveCurrentSource({
      repoId: repo.id,
      message: 'rename stable entry directory',
      files: [
        { path: 'src/client/js-blocks/sales-kpi/index.tsx', operation: 'delete' },
        { path: 'src/client/js-blocks/sales-kpi/entry.json', operation: 'delete' },
        {
          path: 'src/client/js-blocks/renamed-sales/index.tsx',
          content: 'const title = "Renamed Sales KPI";\nctx.render(<div>{title}</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/renamed-sales/entry.json',
          content: JSON.stringify({
            schemaVersion: 1,
            key: 'stable-sales-kpi',
            title: 'Sales KPI',
            settings: {},
          }),
          language: 'json',
        },
      ],
    });
    const entries = await app.db.getRepository('lightExtensionEntries').find({ filter: { repoId: repo.id } });

    expect(renamed.compile.entries[0]).toMatchObject({
      entryId: originalEntryId,
      entryName: 'stable-sales-kpi',
      entryPath: 'src/client/js-blocks/renamed-sales/index.tsx',
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].get('id')).toBe(originalEntryId);
    expect(entries[0].get('healthStatus')).toBe('ready');
    const renamedRuntime = await runtimeResolveService.resolve({
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: repo.id,
        entryId: originalEntryId,
        kind: 'js-block',
      },
    });
    await expect(runtimeResolveService.getArtifact(renamedRuntime.artifactHash)).resolves.toMatchObject({
      artifactHash: renamedRuntime.artifactHash,
      code: expect.stringContaining('Renamed Sales KPI'),
    });
    expect(renamedRuntime).toMatchObject({
      entryId: originalEntryId,
      entryPath: 'src/client/js-blocks/renamed-sales/index.tsx',
    });
  });

  it('rejects no-change saves and blocks archived repositories', async () => {
    const repo = await repoService.createRepo({ name: 'No Change Save', initialFiles: baselineSalesKpiFiles() });
    const first = await saveCurrentSource({
      repoId: repo.id,
      message: 'initial save',
      files: validSalesKpiFiles(),
    });
    await expect(
      saveCurrentSource({
        repoId: repo.id,
        message: 'no change save',
        files: [],
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_ERROR',
      details: { sourceCode: 'NO_CHANGES' },
    });

    const updated = await saveCurrentSource({
      repoId: repo.id,
      message: 'save against current repository head',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'const title = "Updated Sales KPI";\nctx.render(<div>{title}</div>);\n',
          language: 'typescript',
        },
      ],
    });
    expect(updated.commit.parentCommitId).toBe(first.commit.id);

    await repoService.archiveRepo({
      repoId: repo.id,
    });
    await expect(
      saveCurrentSource({
        repoId: repo.id,
        message: 'blocked save',
        files: [],
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_REPO_ARCHIVED',
    });
  });

  it('rejects a save when compilation fails and keeps the previous source and runtime', async () => {
    const repo = await repoService.createRepo({
      name: 'Failed Runtime Compile',
      initialFiles: baselineSalesKpiFiles(),
    });
    const first = await saveCurrentSource({
      repoId: repo.id,
      message: 'initial save',
      files: validSalesKpiFiles(),
    });
    const entryBeforeFailure = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: first.compile.entries[0].entryId,
    });
    const artifactHashBeforeFailure = entryBeforeFailure?.get('artifactHash');
    await expect(
      saveCurrentSource({
        repoId: repo.id,
        message: 'broken source',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: "import Missing from './missing';\nctx.render(<Missing />);\n",
            language: 'typescript',
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
    });
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: first.compile.entries[0].entryId,
    });

    expect(entry?.get('healthStatus')).toBe('ready');
    expect(entry?.get('compiledCommitId')).toBe(first.commit.id);
    expect(entry?.get('artifactHash')).toBe(artifactHashBeforeFailure);
    expect(entry?.get('runtimeArtifact')).toMatchObject({
      code: expect.stringContaining('Sales KPI'),
    });
    const currentRuntime = await runtimeResolveService.resolve({
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: repo.id,
        entryId: first.compile.entries[0].entryId,
        kind: 'js-block',
      },
    });
    await expect(runtimeResolveService.getArtifact(currentRuntime.artifactHash)).resolves.toMatchObject({
      code: expect.stringContaining('Sales KPI'),
    });
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({
      headCommitId: first.commit.id,
    });
    const fixed = await saveCurrentSource({
      repoId: repo.id,
      message: 'fixed source',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'const title = "Fixed Sales KPI";\nctx.render(<div>{title}</div>);\n',
          language: 'typescript',
        },
      ],
    });
    const entryAfterFix = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: first.compile.entries[0].entryId,
    });

    expect(entryAfterFix?.get('compiledCommitId')).toBe(fixed.commit.id);
    expect(entryAfterFix?.get('artifactHash')).not.toBe(artifactHashBeforeFailure);
  });

  it('rolls back every entry when one entry fails to compile', async () => {
    const repo = await repoService.createRepo({
      name: 'Atomic Multi Entry Compile',
      initialFiles: baselineMultiEntryFiles(),
    });
    const first = await saveCurrentSource({
      repoId: repo.id,
      message: 'compile both v1 entries',
      files: multiEntryFiles('V1'),
    });
    const commitCountBeforeFailure = await app.db.getRepository('vscFileCommits').count();

    await expect(
      saveCurrentSource({
        repoId: repo.id,
        message: 'reject partial v2 compile',
        files: multiEntryFiles('V2', true),
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            severity: 'error',
            path: 'src/client/js-blocks/entry-b/index.tsx',
          }),
        ]),
      },
    });

    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeFailure);
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: first.commit.id });
    const entriesAfterFailure = await app.db.getRepository('lightExtensionEntries').find({
      filter: { repoId: repo.id },
      sort: ['entryName'],
    });
    expect(entriesAfterFailure).toHaveLength(2);
    for (const entry of entriesAfterFailure) {
      expect(entry.get('compiledCommitId')).toBe(first.commit.id);
      expect(entry.get('runtimeArtifact')).toMatchObject({
        code: expect.stringContaining('V1'),
      });
    }

    const fixed = await saveCurrentSource({
      repoId: repo.id,
      message: 'compile both v2 entries',
      files: multiEntryFiles('V2'),
    });
    const entriesAfterFix = await app.db.getRepository('lightExtensionEntries').find({
      filter: { repoId: repo.id },
      sort: ['entryName'],
    });

    expect(fixed.commit.parentCommitId).toBe(first.commit.id);
    expect(entriesAfterFix).toHaveLength(2);
    for (const entry of entriesAfterFix) {
      expect(entry.get('compiledCommitId')).toBe(fixed.commit.id);
      expect(entry.get('runtimeArtifact')).toMatchObject({
        code: expect.stringContaining('V2'),
      });
    }
  });

  it('rejects the second save when concurrent requests use the same expected head', async () => {
    const repo = await repoService.createRepo({
      name: 'Serialized Runtime Compile',
      initialFiles: baselineSalesKpiFiles(),
    });
    const expectedHeadCommitId = repo.headCommitId;
    const firstCompileStarted = createDeferred();
    const secondCompileStarted = createDeferred();
    const releaseFirstCompile = createDeferred();
    const compileEntry = compilerBridge.compileEntry.bind(compilerBridge);
    let compileCallCount = 0;

    vi.spyOn(compilerBridge, 'compileEntry').mockImplementation(async (input, ctx) => {
      compileCallCount += 1;
      if (compileCallCount === 1) {
        firstCompileStarted.resolve();
        await releaseFirstCompile.promise;
      } else if (compileCallCount === 2) {
        secondCompileStarted.resolve();
      }

      return compileEntry(input, ctx);
    });

    const firstSavePromise = runtimeCompileService.saveSource({
      repoId: repo.id,
      expectedHeadCommitId,
      message: 'first serialized save',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>First serialized runtime</div>);\n',
          language: 'typescript',
        },
      ],
    });
    await firstCompileStarted.promise;

    const secondSavePromise = runtimeCompileService.saveSource({
      repoId: repo.id,
      expectedHeadCommitId,
      message: 'second serialized save',
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Second serialized runtime</div>);\n',
          language: 'typescript',
        },
      ],
    });
    const secondCompileStartedBeforeRelease = await Promise.race([
      secondCompileStarted.promise.then(() => true),
      delay(250).then(() => false),
    ]);

    releaseFirstCompile.resolve();

    const settled = await Promise.allSettled([firstSavePromise, secondSavePromise]);
    const successes = settled.filter(
      (result): result is PromiseFulfilledResult<Awaited<typeof firstSavePromise>> => result.status === 'fulfilled',
    );
    const failures = settled.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
    const winner = successes[0]?.value;
    const loserError = failures[0]?.reason;
    const currentRepo = await repoService.getRepo(repo.id);
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filter: {
        repoId: repo.id,
        entryName: 'sales-kpi',
      },
    });
    const compileLogs = await app.db.getRepository('lightExtensionLogs').find({
      filter: {
        repoId: repo.id,
        action: 'runtimeCompile',
        result: 'success',
      },
    });

    expect(secondCompileStartedBeforeRelease).toBe(true);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(winner).toBeDefined();
    expect(loserError).toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_OUTDATED',
      status: 409,
      details: {
        expectedHeadCommitId,
        currentHeadCommitId: winner?.commit.id,
      },
    });
    expect(compileCallCount).toBe(2);
    expect(currentRepo.headCommitId).toBe(winner?.commit.id);
    expect(entry?.get('compiledCommitId')).toBe(winner?.commit.id);
    expect(entry?.get('runtimeArtifact')).toMatchObject({
      code: expect.stringContaining(
        settled[0].status === 'fulfilled' ? 'First serialized runtime' : 'Second serialized runtime',
      ),
    });
    expect(compileLogs).toHaveLength(1);
  });

  it('rolls back a compile success audit when publish fails', async () => {
    const repo = await repoService.createRepo({
      name: 'Runtime Compile Audit Rollback',
      initialFiles: baselineSalesKpiFiles(),
    });
    const compileEntry = vi.spyOn(compilerBridge, 'compileEntry');
    const publisher = PublishCompiledEntriesService.forDatabase(app.db);
    const publish = publisher.publishCompiledEntries.bind(publisher);
    vi.spyOn(publisher, 'publishCompiledEntries').mockImplementation(async (batch, transaction) => {
      await publish(batch, transaction);
      throw new Error('forced compile publish rollback');
    });
    const failingRuntime = new LightExtensionRuntimeCompileService(app.db, fileService, entryService, compilerBridge, {
      publishCompiledEntries: publisher,
    });

    await expect(
      failingRuntime.saveSource({
        repoId: repo.id,
        expectedHeadCommitId: repo.headCommitId,
        message: 'rollback runtime compile audit',
        files: validSalesKpiFiles(),
      }),
    ).rejects.toThrow('forced compile publish rollback');

    expect(compileEntry).toHaveBeenCalledTimes(1);
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: repo.headCommitId });
    await expect(
      app.db.getRepository('lightExtensionLogs').count({
        filter: {
          repoId: repo.id,
          action: 'runtimeCompile',
          result: 'success',
        },
      }),
    ).resolves.toBe(0);
  });

  it('rolls back source, artifacts, entries, and references when reference refresh fails', async () => {
    const repo = await repoService.createRepo({
      name: 'Reference Refresh Rollback',
      initialFiles: baselineSalesKpiFiles(),
    });
    const initial = await saveCurrentSource({
      repoId: repo.id,
      message: 'establish reference refresh rollback baseline',
      files: validSalesKpiFiles(),
    });
    const entryId = initial.compile.entries[0].entryId;
    const reference = await app.db.getRepository('lightExtensionReferences').create({
      values: {
        repoId: repo.id,
        entryId,
        kind: 'js-block',
        ownerKind: 'flowModel.step',
        ownerLocator: {
          kind: 'flowModel.step',
          modelUid: 'flow_reference_refresh_rollback',
          use: 'JSBlockModel',
          stepPath: ['stepParams', 'jsSettings'],
        },
        ownerLocatorHash: 'owner_reference_refresh_rollback',
        resolvedStatus: 'active',
      },
    });
    const [commitCount, treeCount, blobCount, artifactCount] = await Promise.all([
      app.db.getRepository('vscFileCommits').count(),
      app.db.getRepository('vscFileTrees').count(),
      app.db.getRepository('vscFileBlobs').count(),
      app.db.getRepository('lightExtensionRuntimeArtifacts').count(),
    ]);
    const refreshReferencesForRepo = vi.fn(
      async (_repoId: string, ctx?: LightExtensionServiceContext, _reason?: string) => {
        await app.db.getRepository('lightExtensionReferences').update({
          filterByTk: reference.get('id'),
          values: { resolvedStatus: 'runtime_missing' },
          transaction: ctx?.transaction,
        });
        throw new Error('forced reference refresh rollback');
      },
    );
    const failingRuntime = new LightExtensionRuntimeCompileService(app.db, fileService, entryService, compilerBridge);
    failingRuntime.useReferenceService({ refreshReferencesForRepo });

    await expect(
      failingRuntime.saveSource({
        repoId: repo.id,
        expectedHeadCommitId: initial.commit.id,
        message: 'rollback failed reference refresh',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: 'ctx.render(<div>Reference refresh must roll back</div>);\n',
            language: 'typescript',
          },
        ],
      }),
    ).rejects.toThrow('forced reference refresh rollback');

    expect(refreshReferencesForRepo).toHaveBeenCalledWith(
      repo.id,
      expect.objectContaining({ transaction: expect.anything() }),
      'source_published',
    );
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: initial.commit.id });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
    await expect(app.db.getRepository('vscFileTrees').count()).resolves.toBe(treeCount);
    await expect(app.db.getRepository('vscFileBlobs').count()).resolves.toBe(blobCount);
    await expect(app.db.getRepository('lightExtensionRuntimeArtifacts').count()).resolves.toBe(artifactCount);
    await expect(app.db.getRepository('lightExtensionEntries').findOne({ filterByTk: entryId })).resolves.toMatchObject(
      {
        compiledCommitId: initial.commit.id,
      },
    );
    await expect(
      app.db.getRepository('lightExtensionReferences').findOne({ filterByTk: reference.get('id') }),
    ).resolves.toMatchObject({ resolvedStatus: 'active' });
  });
});

function validSalesKpiFiles() {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: 'const title = "Sales KPI";\nctx.render(<div>{title}</div>);\n',
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/sales-kpi/entry.json',
      content: JSON.stringify({
        schemaVersion: 1,
        key: 'sales-kpi',
        settings: {
          region: {
            type: 'string',
            default: 'APAC',
          },
        },
      }),
      language: 'json',
    },
  ];
}

function salesKpiJsonModuleFiles(input: { descriptorTitle: string; dataTitle: string }) {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: "import data from './data.json';\nctx.render(<div>{data.title}</div>);\n",
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/sales-kpi/data.json',
      content: JSON.stringify({ title: input.dataTitle }),
      language: 'json',
    },
    {
      path: 'src/client/js-blocks/sales-kpi/entry.json',
      content: JSON.stringify(
        salesKpiDescriptor({
          descriptorTitle: input.descriptorTitle,
          propertyTitle: 'Region',
          defaultRegion: 'APAC',
        }),
      ),
      language: 'json',
    },
  ];
}

function salesKpiDescriptor(input: {
  descriptorTitle: string;
  propertyTitle: string;
  defaultRegion: string;
  component?: string;
  reverseProperties?: boolean;
}) {
  const region = {
    type: 'string',
    title: input.propertyTitle,
    default: input.defaultRegion,
    enum: ['APAC', 'EMEA'],
    ...(input.component ? { 'x-component': input.component } : {}),
  };
  const showLabel = {
    type: 'boolean',
    default: true,
  };
  const properties = input.reverseProperties ? { showLabel, region } : { region, showLabel };

  return {
    schemaVersion: 1,
    key: 'sales-kpi',
    title: input.descriptorTitle,
    settings: properties,
  };
}

function entryFiles(entryName: string, label: string, descriptor: Record<string, unknown>) {
  return [
    {
      path: `src/client/js-blocks/${entryName}/index.tsx`,
      content: `ctx.render(<div>${label}</div>);\n`,
      language: 'typescript',
    },
    {
      path: `src/client/js-blocks/${entryName}/entry.json`,
      content: JSON.stringify(descriptor),
      language: 'json',
    },
  ];
}

function expectRuntimeHashes(
  actual: { filesHash: string; runtimeCodeHash: string; artifactHash: string },
  expected: { filesHash: string; runtimeCodeHash: string; artifactHash: string },
) {
  expect(actual.filesHash).toBe(expected.filesHash);
  expect(actual.runtimeCodeHash).toBe(expected.runtimeCodeHash);
  expect(actual.artifactHash).toBe(expected.artifactHash);
}

function baselineSalesKpiFiles() {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: 'ctx.render(<div>Initial</div>);\n',
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/sales-kpi/entry.json',
      content: '{"schemaVersion":1,"key":"sales-kpi"}',
      language: 'json',
    },
  ];
}

function preciseSharedDependencyFiles() {
  return [
    {
      path: 'src/client/js-blocks/dependent/index.tsx',
      content: `import { runtimeValue } from '../../../shared/runtime-value'; ctx.render(<div>{runtimeValue}</div>);`,
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/dependent/entry.json',
      content: JSON.stringify({ schemaVersion: 1, key: 'dependent' }),
      language: 'json',
    },
    {
      path: 'src/client/js-blocks/independent/index.tsx',
      content: 'ctx.render(<div>Independent</div>);',
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/independent/entry.json',
      content: JSON.stringify({ schemaVersion: 1, key: 'independent' }),
      language: 'json',
    },
    {
      path: 'src/shared/runtime-value.ts',
      content: 'export const runtimeValue = 1;\n',
      language: 'typescript',
    },
  ];
}

function baselineMultiEntryFiles() {
  return [
    {
      path: 'src/client/js-blocks/entry-a/index.tsx',
      content: 'ctx.render(<div>A initial</div>);\n',
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/entry-a/entry.json',
      content: '{"schemaVersion":1,"key":"entry-a"}',
      language: 'json',
    },
    {
      path: 'src/client/js-blocks/entry-b/index.tsx',
      content: 'ctx.render(<div>B initial</div>);\n',
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/entry-b/entry.json',
      content: '{"schemaVersion":1,"key":"entry-b"}',
      language: 'json',
    },
  ];
}

function multiEntryFiles(version: string, breakEntryB = false) {
  return [
    {
      path: 'src/client/js-blocks/entry-a/index.tsx',
      content: `ctx.render(<div>A ${version}</div>);\n`,
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/entry-a/entry.json',
      content: '{"schemaVersion":1,"key":"entry-a"}',
      language: 'json',
    },
    {
      path: 'src/client/js-blocks/entry-b/index.tsx',
      content: breakEntryB
        ? `import Missing from './missing';\nctx.render(<Missing>B ${version}</Missing>);\n`
        : `ctx.render(<div>B ${version}</div>);\n`,
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/entry-b/entry.json',
      content: '{"schemaVersion":1,"key":"entry-b"}',
      language: 'json',
    },
  ];
}

function createDeferred() {
  let resolveDeferred!: () => void;
  const promise = new Promise<void>((resolve) => {
    resolveDeferred = resolve;
  });

  return { promise, resolve: resolveDeferred };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
