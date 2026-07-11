/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database, Model } from '@nocobase/database';
import { vi } from 'vitest';

import type {
  LightExtensionPulledFile,
  LightExtensionRepoRecord,
  LightExtensionTreeEntryInput,
} from '../../shared/types';
import { createLightExtensionsResource } from '../resources/lightExtensions';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionCompilePreviewService } from '../services/LightExtensionCompilePreviewService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';

describe('plugin-light-extension compile preview', () => {
  it('previews good and bad entries without runtime state mutations', async () => {
    const repo = createRepo();
    const { db, entriesRepository } = createDbStub([
      createEntryRecord({ id: 'lee_sales_kpi', repoId: repo.id, entryName: 'sales-kpi' }),
      createEntryRecord({
        id: 'lee_sales_trend',
        repoId: repo.id,
        entryName: 'sales-trend',
        compiledCommitId: 'commit_keep_existing',
      }),
    ]);
    const fileService = createFileServiceStub(repo, [
      ...validSalesKpiFiles(),
      {
        path: 'src/client/js-blocks/sales-trend/index.tsx',
        content: "import { missing } from './missing';\nctx.render(<div>{missing}</div>);\n",
      },
    ]);
    const { service, recordCompileEvent } = createPreviewService(db, fileService);

    const result = await service.compilePreview(
      {
        repoId: repo.id,
      },
      {
        requestId: 'req_compile_preview_mixed',
        actorUserId: '1',
      },
    );

    const salesKpi = result.entries.find((entry) => entry.entryName === 'sales-kpi');
    const salesTrend = result.entries.find((entry) => entry.entryName === 'sales-trend');
    expect(result.accepted).toBe(false);
    expect(result.commitId).toBe('vsc_commit_1');
    expect(salesKpi).toMatchObject({
      entryId: 'lee_sales_kpi',
      status: 'success',
      accepted: true,
      artifact: {
        version: 'v2',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        metadata: expect.objectContaining({
          repoId: repo.id,
          entryId: 'lee_sales_kpi',
          kind: 'js-block',
          entryName: 'sales-kpi',
        }),
      },
    });
    expect(JSON.stringify(salesKpi?.artifact)).not.toContain('ctx.render');
    expect(JSON.stringify(salesKpi?.artifact)).not.toContain('sourceMap');
    expect(salesTrend).toMatchObject({
      entryId: 'lee_sales_trend',
      status: 'failed',
      accepted: false,
    });
    expect(salesTrend?.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/js-blocks/sales-trend/index.tsx',
          line: expect.any(Number),
          column: expect.any(Number),
        }),
      ]),
    );
    expect(entriesRepository.create).not.toHaveBeenCalled();
    expect(entriesRepository.update).not.toHaveBeenCalled();
    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: repo.id,
        entryId: 'lee_sales_kpi',
        result: 'success',
      }),
    );
    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: repo.id,
        entryId: 'lee_sales_trend',
        result: 'blocked',
      }),
    );
    expect(JSON.stringify(recordCompileEvent.mock.calls)).not.toContain('ctx.render(<div>{missing}</div>)');
    expect(JSON.stringify(recordCompileEvent.mock.calls)).not.toContain('const title');
    expect(JSON.stringify(recordCompileEvent.mock.calls)).not.toContain('sourceMap');
  });

  it('blocks compile preview entries when workspace validator failures are present', async () => {
    const repo = createRepo();
    const { db } = createDbStub([createEntryRecord({ id: 'lee_sales_kpi', repoId: repo.id, entryName: 'sales-kpi' })]);
    const fileService = createFileServiceStub(repo, [
      ...validSalesKpiFiles(),
      {
        path: 'src/client/not-allowed.js',
        content: "const secret = 'secret-source';\n",
      },
    ]);
    const { service, recordCompileEvent } = createPreviewService(db, fileService);

    const result = await service.compilePreview(
      {
        repoId: repo.id,
      },
      {
        requestId: 'req_compile_preview_validator',
      },
    );

    expect(result.accepted).toBe(false);
    const salesKpi = result.entries.find((entry) => entry.entryName === 'sales-kpi');
    expect(salesKpi).toMatchObject({
      status: 'failed',
      accepted: false,
      failureCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
    });
    expect(salesKpi?.artifact).toBeUndefined();
    expect(salesKpi?.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'path_not_allowed',
          path: 'src/client/not-allowed.js',
        }),
      ]),
    );
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'path_not_allowed',
          path: 'src/client/not-allowed.js',
        }),
      ]),
    );
    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'blocked',
        reasonCode: 'validation_failed',
        requestId: 'req_compile_preview_validator',
      }),
    );
    expect(recordCompileEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'lee_sales_kpi',
        result: 'success',
      }),
    );
    expect(JSON.stringify(recordCompileEvent.mock.calls)).not.toContain('secret-source');
  });

  it('ignores unselected entry validation errors when previewing a selected valid entry', async () => {
    const repo = createRepo();
    const { db } = createDbStub([createEntryRecord({ id: 'lee_sales_kpi', repoId: repo.id, entryName: 'sales-kpi' })]);
    const fileService = createFileServiceStub(repo, [
      ...validSalesKpiFiles(),
      {
        path: 'src/client/js-fields/phone-link/index.tsx',
        content: 'export default function PhoneLink() {\n  const value = ;\n  return value;\n}\n',
      },
    ]);
    const { service, recordCompileEvent } = createPreviewService(db, fileService);

    const result = await service.compilePreview(
      {
        repoId: repo.id,
        entryIds: ['lee_sales_kpi'],
      },
      {
        requestId: 'req_compile_preview_selected_only',
      },
    );

    expect(result.accepted).toBe(true);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({
      entryId: 'lee_sales_kpi',
      status: 'success',
      accepted: true,
    });
    expect(result.diagnostics).toEqual([]);
    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'lee_sales_kpi',
        result: 'success',
      }),
    );
    expect(recordCompileEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({
        reasonCode: 'validation_failed',
        requestId: 'req_compile_preview_selected_only',
      }),
    );
  });

  it('previews JS Item entries after entry preparation recognizes the js-item kind', async () => {
    const repo = createRepo();
    const { db } = createDbStub([
      {
        ...createEntryRecord({ id: 'lee_customer_menu', repoId: repo.id, entryName: 'customer-menu' }),
        kind: 'js-item',
        entryPath: 'src/client/js-items/customer-menu/index.tsx',
      },
    ]);
    const fileService = createFileServiceStub(repo, [
      {
        path: 'src/client/js-items/customer-menu/index.tsx',
        content: 'ctx.render(<button>{ctx.record.name}</button>);\n',
      },
    ]);
    const { service, recordCompileEvent } = createPreviewService(db, fileService);

    const result = await service.compilePreview(
      {
        repoId: repo.id,
        entryIds: ['lee_customer_menu'],
      },
      {
        requestId: 'req_compile_preview_js_item',
      },
    );

    expect(result.accepted).toBe(true);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({
      entryId: 'lee_customer_menu',
      kind: 'js-item',
      status: 'success',
      accepted: true,
      artifact: expect.objectContaining({
        entryPath: 'src/client/js-items/customer-menu/index.tsx',
        metadata: expect.objectContaining({
          kind: 'js-item',
          entryName: 'customer-menu',
          compilerSurfaceStyle: 'render',
        }),
      }),
    });
    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        entryId: 'lee_customer_menu',
        result: 'success',
        requestId: 'req_compile_preview_js_item',
      }),
    );
  });

  it('supports selected entryIds and reports missing selected entries without stopping valid entries', async () => {
    const repo = createRepo();
    const { db } = createDbStub([
      createEntryRecord({ id: 'lee_sales_kpi', repoId: repo.id, entryName: 'sales-kpi' }),
      createEntryRecord({ id: 'lee_sales_trend', repoId: repo.id, entryName: 'sales-trend' }),
    ]);
    const fileService = createFileServiceStub(repo, validSalesKpiFiles());
    const { service } = createPreviewService(db, fileService);

    const result = await service.compilePreview({
      repoId: repo.id,
      entryIds: ['lee_sales_trend', 'lee_sales_kpi', 'lee_unknown'],
    });

    expect(result.entries.map((entry) => entry.entryName)).toEqual(['sales-trend', 'sales-kpi', 'lee_unknown']);
    expect(result.entries[0]).toMatchObject({
      entryId: 'lee_sales_trend',
      status: 'skipped',
      diagnostics: [
        expect.objectContaining({
          code: 'entry_missing',
        }),
      ],
    });
    expect(result.entries[1]).toMatchObject({
      entryId: 'lee_sales_kpi',
      status: 'success',
      accepted: true,
    });
    expect(result.entries[2]).toMatchObject({
      entryId: 'lee_unknown',
      status: 'skipped',
      diagnostics: [
        expect.objectContaining({
          code: 'entry_not_found',
        }),
      ],
    });
  });

  it('denies compilePreview before reading source when ctx.can rejects the action', async () => {
    const repo = createRepo();
    const { db } = createDbStub([]);
    const fileService = createFileServiceStub(repo, validSalesKpiFiles());
    const { service, recordCompileEvent } = createPreviewService(db, fileService);

    await expect(
      service.compilePreview(
        {
          repoId: repo.id,
        },
        {
          requestId: 'req_compile_preview_denied',
          actorUserId: '2',
          can: () => null,
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
      status: 403,
    });

    expect(fileService.pull).not.toHaveBeenCalled();
    expect(recordCompileEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: repo.id,
        result: 'blocked',
        reasonCode: 'permission_denied',
        actorUserId: '2',
      }),
    );
  });

  it('normalizes the lightExtensions compilePreview resource input and passes ctx.can to the service', async () => {
    const compilePreview = vi.fn().mockResolvedValue({ ok: true });
    const resource = createLightExtensionsResource({
      compilePreview,
    } as unknown as LightExtensionCompilePreviewService);
    const can = vi.fn().mockReturnValue({});
    const ctx = {
      action: {
        params: {
          filterByTk: 'ler_sales',
          values: {
            entryIds: ['lee_sales_kpi'],
          },
        },
      },
      auth: {
        user: {
          id: 9,
        },
      },
      can,
      request: {
        headers: {
          'x-request-id': 'req_resource_preview',
          'x-request-source': 'unit-resource',
        },
      },
    } as unknown as Context;

    await resource.actions?.compilePreview?.(ctx, async () => {});

    expect(compilePreview).toHaveBeenCalledWith(
      {
        repoId: 'ler_sales',
        entryIds: ['lee_sales_kpi'],
      },
      expect.objectContaining({
        actorUserId: '9',
        requestId: 'req_resource_preview',
        requestSource: 'unit-resource',
        can,
      }),
    );
    expect((ctx as { body?: unknown }).body).toEqual({ ok: true });
  });
});

function createPreviewService(db: Database, fileService: LightExtensionFileService) {
  const auditService = new LightExtensionAuditService(db);
  const recordCompileEvent = vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
  const permissionService = new LightExtensionPermissionService(auditService);
  const bridge = new LightExtensionWorkspaceCompilerBridge(auditService, permissionService);
  const service = new LightExtensionCompilePreviewService(db, auditService, fileService, permissionService, bridge);

  return {
    service,
    recordCompileEvent,
  };
}

function createDbStub(entries: Record<string, unknown>[]) {
  const entriesRepository = {
    find: vi.fn().mockResolvedValue(entries.map(createModel)),
    create: vi.fn(),
    update: vi.fn(),
  };
  const db = {
    getRepository: (name: string) => {
      if (name === 'lightExtensionEntries') {
        return entriesRepository;
      }

      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;

  return {
    db,
    entriesRepository,
  };
}

function createFileServiceStub(repo: LightExtensionRepoRecord, files: LightExtensionTreeEntryInput[]) {
  const pulledFiles: LightExtensionPulledFile[] = files.map((file) => ({
    path: file.path,
    pathHash: `${file.path}:hash`,
    pathLowerHash: `${file.path.toLowerCase()}:hash`,
    blobHash: `${file.path}:blob`,
    size: file.content?.length || 0,
    language: file.language || 'typescript',
    mode: file.mode || '100644',
    content: file.content,
  }));

  return {
    pull: vi.fn().mockResolvedValue({
      repo,
      commit: {
        id: 'vsc_commit_1',
      },
      tree: {
        hash: 'tree_hash_1',
        entryCount: pulledFiles.length,
        byteSize: pulledFiles.reduce((total, file) => total + file.size, 0),
      },
      unchanged: false,
      files: pulledFiles,
    }),
  } as unknown as LightExtensionFileService;
}

function createRepo(): LightExtensionRepoRecord {
  return {
    id: 'ler_sales',
    name: 'Sales',
    normalizedName: 'sales',
    title: 'Sales',
    description: null,
    lifecycleStatus: 'enabled',
    healthStatus: 'ready',
    headCommitId: 'vsc_commit_1',
  };
}

function createEntryRecord(input: {
  id: string;
  repoId: string;
  entryName: string;
  compiledCommitId?: string | null;
}): Record<string, unknown> {
  return {
    id: input.id,
    repoId: input.repoId,
    target: 'client',
    kind: 'js-block',
    entryName: input.entryName,
    entryPath: `src/client/js-blocks/${input.entryName}/index.tsx`,
    metaPath: null,
    settingsPath: null,
    title: input.entryName,
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: null,
    compiledCommitId: input.compiledCommitId || null,
    runtimeArtifact: input.compiledCommitId
      ? {
          code: 'ctx.render("existing");',
          version: 'v2',
          entryPath: `src/client/js-blocks/${input.entryName}/index.tsx`,
        }
      : null,
    runtimeVersion: input.compiledCommitId ? 'v2' : null,
    surfaceStyle: input.compiledCommitId ? 'render' : null,
    runtimeCodeHash: input.compiledCommitId ? 'runtime_hash_existing' : null,
    filesHash: input.compiledCommitId ? 'files_hash_existing' : null,
    settingsDefaultsHash: input.compiledCommitId ? 'settings_defaults_hash_existing' : null,
    compiledAt: input.compiledCommitId ? new Date('2026-07-06T00:00:00.000Z') : null,
    healthStatus: 'ready',
    diagnostics: [],
    createdAt: null,
    updatedAt: null,
  };
}

function createModel(values: Record<string, unknown>): Model {
  return {
    get: (key: string) => values[key],
  } as unknown as Model;
}

function validSalesKpiFiles(): LightExtensionTreeEntryInput[] {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: "const title = 'Sales KPI';\nctx.render(<div>{title}</div>);\n",
    },
    {
      path: 'src/client/js-blocks/sales-kpi/meta.json',
      content: JSON.stringify({
        title: 'Sales KPI',
      }),
    },
  ];
}
