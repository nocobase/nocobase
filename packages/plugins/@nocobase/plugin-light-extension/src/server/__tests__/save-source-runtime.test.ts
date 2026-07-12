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
    runtimeCompileService = new LightExtensionRuntimeCompileService(app.db, fileService, entryService, compilerBridge);
    runtimeResolveService = new RuntimeResolveService(app.db);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('saves source, compiles ready entries, and resolves runtime from the entry current artifact', async () => {
    const repo = await repoService.createRepo({ name: 'Save Source Runtime', initialFiles: baselineSalesKpiFiles() });

    const result = await runtimeCompileService.saveSource({
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
      cache: {
        immutable: false,
      },
    });
    expect(runtime.code).toContain('Sales KPI');
  });

  it('preserves entryId and runtime bindings when an entry directory is renamed', async () => {
    const repo = await repoService.createRepo({
      name: 'Stable Entry Directory Rename',
      initialFiles: [
        ...baselineSalesKpiFiles(),
        {
          path: 'src/client/js-blocks/sales-kpi/meta.json',
          content: JSON.stringify({ key: 'stable-sales-kpi', title: 'Sales KPI' }),
          language: 'json',
        },
      ],
    });
    const first = await runtimeCompileService.saveSource({
      repoId: repo.id,
      message: 'compile stable entry',
      files: validSalesKpiFiles(),
    });
    const originalEntryId = first.compile.entries[0].entryId;

    const renamed = await runtimeCompileService.saveSource({
      repoId: repo.id,
      message: 'rename stable entry directory',
      files: [
        { path: 'src/client/js-blocks/sales-kpi/index.tsx', operation: 'delete' },
        { path: 'src/client/js-blocks/sales-kpi/meta.json', operation: 'delete' },
        { path: 'src/client/js-blocks/sales-kpi/settings.json', operation: 'delete' },
        {
          path: 'src/client/js-blocks/renamed-sales/index.tsx',
          content: 'const title = "Renamed Sales KPI";\nctx.render(<div>{title}</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/renamed-sales/meta.json',
          content: JSON.stringify({ key: 'stable-sales-kpi', title: 'Sales KPI' }),
          language: 'json',
        },
        {
          path: 'src/client/js-blocks/renamed-sales/settings.json',
          content: JSON.stringify({ type: 'object', properties: {} }),
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
    await expect(
      runtimeResolveService.resolve({
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: repo.id,
          entryId: originalEntryId,
          kind: 'js-block',
        },
      }),
    ).resolves.toMatchObject({
      entryId: originalEntryId,
      entryPath: 'src/client/js-blocks/renamed-sales/index.tsx',
      code: expect.stringContaining('Renamed Sales KPI'),
    });
  });

  it('rejects no-change saves and blocks archived repositories', async () => {
    const repo = await repoService.createRepo({ name: 'No Change Save', initialFiles: baselineSalesKpiFiles() });
    const first = await runtimeCompileService.saveSource({
      repoId: repo.id,
      message: 'initial save',
      files: validSalesKpiFiles(),
    });

    await expect(
      runtimeCompileService.saveSource({
        repoId: repo.id,
        message: 'no change save',
        files: [],
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_ERROR',
      details: { sourceCode: 'NO_CHANGES' },
    });

    const updated = await runtimeCompileService.saveSource({
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
      runtimeCompileService.saveSource({
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
    const first = await runtimeCompileService.saveSource({
      repoId: repo.id,
      message: 'initial save',
      files: validSalesKpiFiles(),
    });

    await expect(
      runtimeCompileService.saveSource({
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
    await expect(
      runtimeResolveService.resolve({
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: repo.id,
          entryId: first.compile.entries[0].entryId,
          kind: 'js-block',
        },
      }),
    ).resolves.toMatchObject({
      code: expect.stringContaining('Sales KPI'),
    });
    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({
      headCommitId: first.commit.id,
    });
  });

  it('rolls back every entry when one entry fails to compile', async () => {
    const repo = await repoService.createRepo({
      name: 'Atomic Multi Entry Compile',
      initialFiles: baselineMultiEntryFiles(),
    });
    const first = await runtimeCompileService.saveSource({
      repoId: repo.id,
      message: 'compile both v1 entries',
      files: multiEntryFiles('V1'),
    });
    const commitCountBeforeFailure = await app.db.getRepository('vscFileCommits').count();

    await expect(
      runtimeCompileService.saveSource({
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

    const fixed = await runtimeCompileService.saveSource({
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

  it('serializes the complete save pipeline and keeps runtime on the latest head', async () => {
    const repo = await repoService.createRepo({
      name: 'Serialized Runtime Compile',
      initialFiles: baselineSalesKpiFiles(),
    });
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

    const [firstSave, secondSave] = await Promise.all([firstSavePromise, secondSavePromise]);
    const currentRepo = await repoService.getRepo(repo.id);
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filter: {
        repoId: repo.id,
        entryName: 'sales-kpi',
      },
    });

    expect(secondCompileStartedBeforeRelease).toBe(false);
    expect(secondSave.commit.parentCommitId).toBe(firstSave.commit.id);
    expect(currentRepo.headCommitId).toBe(secondSave.commit.id);
    expect(entry?.get('compiledCommitId')).toBe(secondSave.commit.id);
    expect(entry?.get('runtimeArtifact')).toMatchObject({
      code: expect.stringContaining('Second serialized runtime'),
    });
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
      path: 'src/client/js-blocks/sales-kpi/settings.json',
      content: JSON.stringify({
        type: 'object',
        properties: {
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

function baselineSalesKpiFiles() {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: 'ctx.render(<div>Initial</div>);\n',
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
      path: 'src/client/js-blocks/entry-b/index.tsx',
      content: 'ctx.render(<div>B initial</div>);\n',
      language: 'typescript',
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
      path: 'src/client/js-blocks/entry-b/index.tsx',
      content: breakEntryB
        ? `import Missing from './missing';\nctx.render(<Missing>B ${version}</Missing>);\n`
        : `ctx.render(<div>B ${version}</div>);\n`,
      language: 'typescript',
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
