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

import type { LightExtensionSaveSourceInput } from '../../shared/types';
import type { LightExtensionCompileMetricsSummary } from '../../shared/compileMetrics';
import PluginLightExtensionServer from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';
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
  let metricsSummaries: LightExtensionCompileMetricsSummary[];

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginVscFileServer, PluginLightExtensionServer],
    });
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
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
    metricsSummaries = [];
    runtimeCompileService = new LightExtensionRuntimeCompileService(
      app.db,
      fileService,
      entryService,
      compilerBridge,
      (summary) => metricsSummaries.push(summary),
    );
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
    expect(metricsSummaries).toHaveLength(2);
    expect(metricsSummaries).toEqual([
      expect.objectContaining({
        schemaVersion: 1,
        operation: 'runtimeCompile',
        result: 'success',
        durationsMs: expect.objectContaining({
          total: expect.any(Number),
          snapshotMaterialize: expect.any(Number),
          workspaceValidation: expect.any(Number),
        }),
        counters: expect.objectContaining({
          affectedEntryCount: 1,
          compiledEntryCount: 1,
          blobContentQueryCount: 0,
          blobContentRowCount: 0,
          snapshotMaterializationCount: 1,
          treeNormalizationCount: 1,
        }),
      }),
      expect.objectContaining({
        schemaVersion: 1,
        operation: 'saveSource',
        result: 'success',
        durationsMs: expect.objectContaining({
          total: expect.any(Number),
          prepare: expect.any(Number),
          snapshotMaterialize: expect.any(Number),
          workspaceValidation: expect.any(Number),
          transaction: expect.any(Number),
        }),
        counters: expect.objectContaining({
          changedFileCount: 2,
          repoFileCount: 2,
          entryCount: 1,
          affectedEntryCount: 1,
          compiledEntryCount: 1,
          blobContentQueryCount: 0,
          blobContentRowCount: 0,
          snapshotMaterializationCount: 1,
          treeNormalizationCount: 1,
        }),
      }),
    ]);
    expect(JSON.stringify(metricsSummaries)).not.toMatch(/repoId|entryId|src\/client|Sales KPI|artifactHash/iu);
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
    expect(metricsSummaries.find((summary) => summary.operation === 'saveSource')?.counters).toMatchObject({
      snapshotMaterializationCount: 1,
      blobContentQueryCount: 1,
      blobContentRowCount: 1,
    });

    pullCommitSpy.mockRestore();
    const persisted = await fileService.pullCommit({
      repoId: repo.id,
      commitId: result.commit.id,
      includeContent: 'all',
    });
    expect(persisted.files?.find((file) => file.path.endsWith('/index.tsx'))?.content).toBe(canonicalContent);
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
    metricsSummaries = [];
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
    metricsSummaries = [];

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
    metricsSummaries = [];

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
    expect(metricsSummaries).toHaveLength(2);
    expect(metricsSummaries.map(({ operation, result }) => ({ operation, result }))).toEqual([
      { operation: 'runtimeCompile', result: 'rejected' },
      { operation: 'saveSource', result: 'rejected' },
    ]);
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
    metricsSummaries = [];
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
    expect(
      metricsSummaries.filter(({ operation, result }) => operation === 'runtimeCompile' && result === 'success'),
    ).toHaveLength(2);
    expect(
      metricsSummaries.filter(({ operation, result }) => operation === 'saveSource' && result === 'success'),
    ).toHaveLength(1);
    expect(
      metricsSummaries.filter(({ operation, result }) => operation === 'saveSource' && result === 'outdated'),
    ).toHaveLength(1);
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
