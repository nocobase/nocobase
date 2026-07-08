/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginVscFileServer, { VscFileService, VscPermissionHookRegistry } from '@nocobase/plugin-vsc-file';
import { MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { LIGHT_EXTENSION_ACL_SNIPPET } from '../../constants';
import type { LightExtensionTreeEntryInput } from '../../shared/types';
import PluginLightExtensionServer from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionEntryScanner, isAtOrAfterScanStart } from '../services/LightExtensionEntryScanner';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension entry scanner', () => {
  let app: MockServer;
  let auditService: LightExtensionAuditService;
  let repoService: LightExtensionRepoService;
  let fileService: LightExtensionFileService;
  let scanner: LightExtensionEntryScanner;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginVscFileServer, PluginLightExtensionServer],
    });
    auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    repoService = new LightExtensionRepoService(app.db, auditService, permissionService);
    fileService = new LightExtensionFileService(app.db, auditService, permissionService, repoService);
    scanner = new LightExtensionEntryScanner(
      app.db,
      auditService,
      fileService,
      repoService,
      new LightExtensionValidator(),
    );
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('creates and updates stable entry snapshots without creating publications', async () => {
    const repo = await repoService.createRepo(
      {
        name: 'Scanner Demo',
        initialFiles: validSalesKpiFiles(),
      },
      {
        requestId: 'req_scanner_create',
      },
    );

    const firstScan = await scanner.scanRepo(
      {
        repoId: repo.id,
      },
      {
        requestId: 'req_scanner_first',
      },
    );
    const firstEntry = firstScan.entries[0].entry;
    await app.db.getRepository('lightExtensionEntries').update({
      filterByTk: firstEntry.id,
      values: {
        activePublicationId: 'leep_keep_existing_active',
      },
    });
    const push = await fileService.push(
      {
        repoId: repo.id,
        baseCommitId: firstScan.repo.headCommitId,
        message: 'update scanner demo',
        files: [
          {
            path: 'src/client/js-blocks/sales-kpi/meta.json',
            content: JSON.stringify({
              title: 'Updated KPI',
              tags: ['updated'],
            }),
          },
          {
            path: 'src/client/js-blocks/sales-kpi/settings.json',
            content: JSON.stringify({
              type: 'object',
              properties: {
                threshold: {
                  type: 'number',
                  'x-component': 'InputNumber',
                },
              },
            }),
          },
        ],
      },
      {
        requestId: 'req_scanner_push_update',
      },
    );
    const secondScan = await scanner.scanRepo(
      {
        repoId: repo.id,
      },
      {
        requestId: 'req_scanner_second',
      },
    );
    const persisted = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: firstEntry.id,
    });

    expect(firstScan.accepted).toBe(true);
    expect(firstEntry).toMatchObject({
      repoId: repo.id,
      kind: 'js-block',
      entryName: 'sales-kpi',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      metaPath: 'src/client/js-blocks/sales-kpi/meta.json',
      settingsPath: 'src/client/js-blocks/sales-kpi/settings.json',
      title: 'Sales KPI',
      healthStatus: 'ready',
    });
    expect(firstEntry.settingsSchema).toMatchObject({
      type: 'object',
      properties: {
        region: {
          type: 'string',
        },
      },
    });
    expect(firstScan.repo.lastScannedCommitId).toBe(firstScan.commitId);
    expect(secondScan.accepted).toBe(true);
    expect(secondScan.entries[0].entry.id).toBe(firstEntry.id);
    expect(secondScan.entries[0].entry.title).toBe('Updated KPI');
    expect(secondScan.repo.lastScannedCommitId).toBe(push.commit.id);
    expect(persisted?.get('activePublicationId')).toBe('leep_keep_existing_active');
    expect(await app.db.getRepository('lightExtensionEntryPublications').count({ filter: { repoId: repo.id } })).toBe(
      0,
    );
  });

  it('serializes concurrent scans for the same repository', async () => {
    const repo = await repoService.createRepo({
      name: 'Concurrent Scan Demo',
      initialFiles: validSalesKpiFiles(),
    });

    const [firstScan, secondScan] = await Promise.all([
      scanner.scanRepo({ repoId: repo.id }, { requestId: 'req_concurrent_scan_first' }),
      scanner.scanRepo({ repoId: repo.id }, { requestId: 'req_concurrent_scan_second' }),
    ]);

    const entries = await scanner.listEntries(repo.id);

    expect(firstScan.accepted).toBe(true);
    expect(secondScan.accepted).toBe(true);
    expect(entries).toHaveLength(1);
    expect(firstScan.entries[0].entry.id).toBe(secondScan.entries[0].entry.id);
    expect(entries[0].entryName).toBe('sales-kpi');
  });

  it('marks missing entries without deleting the stable entry row', async () => {
    const repo = await repoService.createRepo({
      name: 'Missing Entry Demo',
      initialFiles: validSalesKpiFiles(),
    });
    const firstScan = await scanner.scanRepo({ repoId: repo.id });
    const firstEntryId = firstScan.entries[0].entry.id;
    await fileService.push({
      repoId: repo.id,
      baseCommitId: firstScan.repo.headCommitId,
      message: 'delete entry files',
      files: validSalesKpiFiles().map((file) => ({
        path: file.path,
        operation: 'delete',
      })),
    });

    const secondScan = await scanner.scanRepo({ repoId: repo.id });
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: firstEntryId,
    });

    expect(secondScan.accepted).toBe(false);
    expect(secondScan.repo.healthStatus).toBe('scan_failed');
    expect(secondScan.diagnostics).toContainEqual(expect.objectContaining({ code: 'entry_missing' }));
    expect(secondScan.entries).toContainEqual(
      expect.objectContaining({
        created: false,
        entry: expect.objectContaining({
          id: firstEntryId,
          healthStatus: 'missing',
        }),
      }),
    );
    expect(entry).toBeTruthy();
    expect(entry?.get('healthStatus')).toBe('missing');
    expect(await app.db.getRepository('lightExtensionEntries').count({ filter: { repoId: repo.id } })).toBe(1);
  });

  it('keeps repo health partial when errors coexist with a ready entry', async () => {
    const repo = await repoService.createRepo({
      name: 'Repo Level Partial Demo',
      initialFiles: validSalesKpiFiles(),
    });
    await seedRawSourceFiles(app, repoService, repo.id, [
      {
        path: 'src/client/not-allowed.js',
        content: 'export const ignored = true;\n',
      },
    ]);

    const scan = await scanner.scanRepo({ repoId: repo.id });

    expect(scan.accepted).toBe(false);
    expect(scan.repo.healthStatus).toBe('partial_failed');
    expect(scan.entries.find((item) => item.entry.entryName === 'sales-kpi')?.entry.healthStatus).toBe('ready');
    expect(scan.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'path_not_allowed',
        path: 'src/client/not-allowed.js',
      }),
    );
  });

  it('persists staged client kind entries and marks enabled Phase 3 entries ready', async () => {
    const repo = await repoService.createRepo({
      name: 'Disabled Kind Scan Demo',
      initialFiles: [
        {
          path: 'src/client/js-fields/phone-link/index.tsx',
          content: 'export default function PhoneLink() { return null; }\n',
        },
        {
          path: 'src/client/js-actions/batch-approve/index.ts',
          content: 'export default async function batchApprove() { return true; }\n',
        },
        {
          path: 'src/client/js-items/customer-menu/index.tsx',
          content: 'export default function CustomerMenuItem() { return null; }\n',
        },
        {
          path: 'src/client/runjs/sales-kpi/index.ts',
          content: 'export default async function run() { return 1; }\n',
        },
        {
          path: 'src/client/runjs/sales-kpi/README.md',
          content: '# runjs\n',
        },
        {
          path: 'src/client/events/log-page-open/index.ts',
          content: 'export default function onPageOpen() { return true; }\n',
        },
      ],
    });

    const scan = await scanner.scanRepo({ repoId: repo.id });

    expect(scan.accepted).toBe(true);
    expect(scan.entries.map((item) => `${item.entry.kind}:${item.entry.entryName}:${item.entry.healthStatus}`)).toEqual(
      [
        'event:log-page-open:disabled',
        'js-action:batch-approve:ready',
        'js-field:phone-link:ready',
        'js-item:customer-menu:ready',
        'runjs:sales-kpi:disabled',
      ],
    );
    expect(scan.diagnostics.filter((item) => item.code === 'kind_not_enabled')).toEqual([
      expect.objectContaining({
        kind: 'event',
        entryName: 'log-page-open',
        path: 'src/client/events/log-page-open',
      }),
      expect.objectContaining({
        kind: 'runjs',
        entryName: 'sales-kpi',
        path: 'src/client/runjs/sales-kpi',
      }),
    ]);
  });

  it('persists good entries while reporting bad entry diagnostics and partial repo health', async () => {
    const repo = await repoService.createRepo({
      name: 'Partial Scan Demo',
      initialFiles: validSalesKpiFiles(),
    });
    await seedRawSourceFiles(app, repoService, repo.id, [
      {
        path: 'src/client/js-blocks/bad-kpi/index.tsx',
        content: "import React from 'react';\nexport default function BadKpi() { return null; }\n",
      },
    ]);

    const scan = await scanner.scanRepo({ repoId: repo.id });
    const entries = await scanner.listEntries(repo.id);

    expect(scan.accepted).toBe(false);
    expect(scan.repo.healthStatus).toBe('partial_failed');
    expect(entries.find((entry) => entry.entryName === 'sales-kpi')?.healthStatus).toBe('ready');
    expect(entries.find((entry) => entry.entryName === 'bad-kpi')?.healthStatus).toBe('failed');
    expect(scan.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'import_not_allowed',
        path: 'src/client/js-blocks/bad-kpi/index.tsx',
      }),
    );
  });

  it('records scan audit summaries for successful and blocked scans', async () => {
    const successRepo = await repoService.createRepo({
      name: 'Successful Scan Audit Demo',
      initialFiles: validSalesKpiFiles(),
    });
    const blockedRepo = await repoService.createRepo({
      name: 'Blocked Scan Audit Demo',
    });
    await seedRawSourceFiles(app, repoService, blockedRepo.id, [
      {
        path: 'src/client/js-blocks/bad-kpi/index.tsx',
        content: "import React from 'react';\nexport default function BadKpi() { return null; }\n",
      },
    ]);

    await scanner.scanRepo({ repoId: successRepo.id }, { requestId: 'req_scan_audit_success' });
    await scanner.scanRepo({ repoId: blockedRepo.id }, { requestId: 'req_scan_audit_blocked' });

    const successLog = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: successRepo.id,
        action: 'scan',
        requestId: 'req_scan_audit_success',
      },
    });
    const blockedLog = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: blockedRepo.id,
        action: 'scan',
        requestId: 'req_scan_audit_blocked',
      },
    });

    expect(successLog?.get('result')).toBe('success');
    expect(successLog?.get('reasonCode')).toBeFalsy();
    expect(successLog?.get('details')).toMatchObject({
      entryCount: 1,
      diagnosticCount: 0,
      errorCount: 0,
      warningCount: 0,
    });
    expect(blockedLog?.get('result')).toBe('blocked');
    expect(blockedLog?.get('reasonCode')).toBe('validation_failed');
    expect(blockedLog?.get('details')).toMatchObject({
      entryCount: 1,
      diagnosticCount: expect.any(Number),
      errorCount: expect.any(Number),
      warningCount: 0,
      diagnostics: expect.arrayContaining([
        expect.objectContaining({
          code: 'import_not_allowed',
          path: 'src/client/js-blocks/bad-kpi/index.tsx',
          entryName: 'bad-kpi',
        }),
      ]),
    });
  });

  it('keeps scan audit diagnostic summaries stable and capped', async () => {
    const repo = await repoService.createRepo({
      name: 'Large Diagnostic Scan Audit Demo',
    });
    await seedRawSourceFiles(
      app,
      repoService,
      repo.id,
      Array.from({ length: 25 }, (_, index) => ({
        path: `src/client/not-allowed-${String(index).padStart(2, '0')}.js`,
        content: 'export const ignored = true;\n',
      })).reverse(),
    );

    await scanner.scanRepo({ repoId: repo.id }, { requestId: 'req_scan_audit_many_diagnostics' });

    const log = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: repo.id,
        action: 'scan',
        requestId: 'req_scan_audit_many_diagnostics',
      },
    });
    const details = log?.get('details') as { diagnostics?: Array<Record<string, unknown>> } | undefined;

    expect(details?.diagnostics).toHaveLength(20);
    expect(details?.diagnostics?.[0]).toMatchObject({
      code: 'path_not_allowed',
      path: 'src/client/not-allowed-00.js',
    });
    expect(details?.diagnostics?.[19]).toMatchObject({
      code: 'path_not_allowed',
      path: 'src/client/not-allowed-19.js',
    });
    expect(details?.diagnostics?.some((item) => 'message' in item || 'details' in item)).toBe(false);
  });

  it('records blocked scan audits when source pull aborts', async () => {
    const repo = await repoService.createRepo({
      name: 'Aborted Scan Audit Demo',
      initialFiles: validSalesKpiFiles(),
    });
    const failingFileService = {
      pull: async () => {
        throw new Error('simulated pull failure');
      },
    } as LightExtensionFileService;
    const failingScanner = new LightExtensionEntryScanner(
      app.db,
      auditService,
      failingFileService,
      repoService,
      new LightExtensionValidator(),
    );

    await expect(failingScanner.scanRepo({ repoId: repo.id }, { requestId: 'req_scan_audit_aborted' })).rejects.toThrow(
      'simulated pull failure',
    );

    const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repo.id,
    });
    const log = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: repo.id,
        action: 'scan',
        requestId: 'req_scan_audit_aborted',
      },
    });

    expect(repoRecord?.get('healthStatus')).toBe('scan_failed');
    expect(repoRecord?.get('lastError')).toBe('simulated pull failure');
    expect(log?.get('result')).toBe('blocked');
    expect(log?.get('reasonCode')).toBe('scan_aborted');
    expect(log?.get('details')).toMatchObject({
      entryCount: 0,
      diagnosticCount: 1,
      errorCount: 1,
      diagnostics: [
        expect.objectContaining({
          code: 'scan_aborted',
        }),
      ],
    });
  });

  it('uses the caller transaction for aborted scan recording without waiting on the repo lock', async () => {
    const repo = await repoService.createRepo({
      name: 'External Transaction Abort Demo',
      initialFiles: validSalesKpiFiles(),
    });
    const failingFileService = {
      pull: async () => {
        throw new Error('simulated transactional pull failure');
      },
    } as LightExtensionFileService;
    const failingScanner = new LightExtensionEntryScanner(
      app.db,
      auditService,
      failingFileService,
      repoService,
      new LightExtensionValidator(),
    );
    const transaction = await app.db.sequelize.transaction();

    try {
      const result = await Promise.race([
        failingScanner
          .scanRepo({ repoId: repo.id }, { requestId: 'req_scan_abort_external_transaction', transaction })
          .catch((error: unknown) => error),
        new Promise((resolve) => {
          setTimeout(() => resolve('timeout'), 500);
        }),
      ]);

      expect(result).not.toBe('timeout');
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('simulated transactional pull failure');
    } finally {
      await transaction.rollback();
    }
  });

  it('does not mask source scan errors when best-effort abort recording fails early', async () => {
    const repo = await repoService.createRepo({
      name: 'Abort Record Failure Demo',
      initialFiles: validSalesKpiFiles(),
    });
    const originalGetModel = app.db.getModel.bind(app.db);
    let getModelSpy: { mockRestore: () => void } | undefined;
    const failingFileService = {
      pull: async () => {
        getModelSpy = vi.spyOn(app.db, 'getModel').mockImplementation((name: Parameters<typeof app.db.getModel>[0]) => {
          const model = originalGetModel(name);
          if (name !== 'lightExtensionRepos') {
            return model;
          }

          return new Proxy(model, {
            get(target, property, receiver) {
              if (property === 'findByPk') {
                return async () => {
                  throw new Error('repo exists check failed');
                };
              }
              return Reflect.get(target, property, receiver);
            },
          });
        });
        throw new Error('simulated pull failure before record failure');
      },
    } as LightExtensionFileService;
    const failingScanner = new LightExtensionEntryScanner(
      app.db,
      auditService,
      failingFileService,
      repoService,
      new LightExtensionValidator(),
    );

    try {
      await expect(
        failingScanner.scanRepo({ repoId: repo.id }, { requestId: 'req_scan_abort_record_failure' }),
      ).rejects.toThrow('simulated pull failure before record failure');
    } finally {
      getModelSpy?.mockRestore();
    }
  });

  it('does not let stale aborted scans overwrite newer scan status', async () => {
    const repo = await repoService.createRepo({
      name: 'Stale Aborted Scan Demo',
      initialFiles: validSalesKpiFiles(),
    });
    const newerScannedAt = new Date(Math.floor((Date.now() + 60_000) / 1000) * 1000);
    await app.db.getRepository('lightExtensionRepos').update({
      filterByTk: repo.id,
      values: {
        healthStatus: 'ready',
        lastError: null,
        lastScannedAt: newerScannedAt,
      },
    });
    const failingFileService = {
      pull: async () => {
        throw new Error('simulated stale pull failure');
      },
    } as LightExtensionFileService;
    const failingScanner = new LightExtensionEntryScanner(
      app.db,
      auditService,
      failingFileService,
      repoService,
      new LightExtensionValidator(),
    );

    await expect(failingScanner.scanRepo({ repoId: repo.id }, { requestId: 'req_scan_stale_abort' })).rejects.toThrow(
      'simulated stale pull failure',
    );

    const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repo.id,
    });
    const log = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: repo.id,
        action: 'scan',
        requestId: 'req_scan_stale_abort',
      },
    });

    expect(repoRecord?.get('healthStatus')).toBe('ready');
    expect(repoRecord?.get('lastError')).toBeFalsy();
    expect(new Date(String(repoRecord?.get('lastScannedAt'))).getTime()).toBe(newerScannedAt.getTime());
    expect(log?.get('result')).toBe('blocked');
  });

  it('treats same-second older scan timestamps as stale for aborted scan guards', () => {
    expect(isAtOrAfterScanStart(new Date('2026-07-06T00:00:00.100Z'), new Date('2026-07-06T00:00:00.900Z'))).toBe(
      false,
    );
    expect(isAtOrAfterScanStart(new Date('2026-07-06T00:00:00.900Z'), new Date('2026-07-06T00:00:00.100Z'))).toBe(true);
  });

  it('still records blocked scan audit when the abort status update fails', async () => {
    const repo = await repoService.createRepo({
      name: 'Abort Audit Best Effort Demo',
      initialFiles: validSalesKpiFiles(),
    });
    const originalGetRepository = app.db.getRepository.bind(app.db);
    const getRepositorySpy = vi
      .spyOn(app.db, 'getRepository')
      .mockImplementation((name: Parameters<typeof app.db.getRepository>[0]) => {
        const repository = originalGetRepository(name);
        if (name !== 'lightExtensionRepos') {
          return repository;
        }

        return new Proxy(repository, {
          get(target, property, receiver) {
            if (property === 'findOne') {
              return async () => {
                throw new Error('simulated repo status update failure');
              };
            }
            return Reflect.get(target, property, receiver);
          },
        }) as ReturnType<typeof app.db.getRepository>;
      });

    try {
      await expect(
        scanner.scanRepo({ repoId: repo.id }, { requestId: 'req_scan_abort_update_failed' }),
      ).rejects.toThrow('simulated repo status update failure');
    } finally {
      getRepositorySpy.mockRestore();
    }

    const log = await app.db.getRepository('lightExtensionLogs').findOne({
      filter: {
        repoId: repo.id,
        action: 'scan',
        requestId: 'req_scan_abort_update_failed',
      },
    });

    expect(log?.get('result')).toBe('blocked');
    expect(log?.get('reasonCode')).toBe('scan_aborted');
  });

  it('persists entry-level path and limit diagnostics onto the entry row', async () => {
    const repo = await repoService.createRepo({
      name: 'Entry Diagnostics Demo',
      initialFiles: [
        {
          path: 'src/client/js-blocks/styled-kpi/index.tsx',
          content: 'export default function StyledKpi() { return null; }\n',
        },
      ],
    });
    await seedRawSourceFiles(app, repoService, repo.id, [
      {
        path: 'src/client/js-blocks/styled-kpi/style.css',
        content: '.root {}',
      },
    ]);

    const scan = await scanner.scanRepo({ repoId: repo.id });
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filter: {
        repoId: repo.id,
        entryName: 'styled-kpi',
      },
    });
    const diagnostics = entry?.get('diagnostics') as Array<{ code?: string; path?: string }> | undefined;

    expect(scan.accepted).toBe(false);
    expect(entry?.get('healthStatus')).toBe('failed');
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'path_extension_not_allowed',
        path: 'src/client/js-blocks/styled-kpi/style.css',
      }),
    );
  });

  it('rejects explicit refs for persistent scans', async () => {
    const repo = await repoService.createRepo({
      name: 'Historical Ref Scan Demo',
      initialFiles: validSalesKpiFiles(),
    });

    await expect(scanner.scanRepo({ repoId: repo.id, ref: repo.headCommitId || 'head' })).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      status: 400,
    });
    await expect(scanner.scanRepo({ repoId: repo.id, ref: '' })).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      status: 400,
    });

    const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repo.id,
    });
    const scanLogCount = await app.db.getRepository('lightExtensionLogs').count({
      filter: {
        repoId: repo.id,
        action: 'scan',
      },
    });

    expect(repoRecord?.get('healthStatus')).toBe('draft');
    expect(repoRecord?.get('lastError')).toBeFalsy();
    expect(repoRecord?.get('lastScannedAt')).toBeFalsy();
    expect(scanLogCount).toBe(0);
  });

  it('rejects archived and missing repositories for scans without mutating scan state or orphan audit logs', async () => {
    const repo = await repoService.createRepo(
      {
        name: 'Archived Scan Demo',
        initialFiles: validSalesKpiFiles(),
      },
      {
        requestId: 'req_scan_archive_create',
      },
    );

    await repoService.archiveRepo(
      {
        repoId: repo.id,
        expectedLifecycleStatus: 'enabled',
      },
      {
        requestId: 'req_scan_archive_archive',
      },
    );

    await expect(scanner.scanRepo({ repoId: repo.id }, { requestId: 'req_scan_archive_reject' })).rejects.toMatchObject(
      {
        code: 'LIGHT_EXTENSION_REPO_ARCHIVED',
        status: 409,
      },
    );
    await expect(
      scanner.scanRepo({ repoId: 'ler_missing_for_scan' }, { requestId: 'req_scan_missing_reject' }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_REPO_NOT_FOUND',
      status: 404,
    });

    const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repo.id,
    });
    const archivedScanLogCount = await app.db.getRepository('lightExtensionLogs').count({
      filter: {
        repoId: repo.id,
        action: 'scan',
      },
    });
    const missingScanLogCount = await app.db.getRepository('lightExtensionLogs').count({
      filter: {
        repoId: 'ler_missing_for_scan',
        action: 'scan',
      },
    });

    expect(repoRecord?.get('healthStatus')).toBe('draft');
    expect(repoRecord?.get('lastError')).toBeFalsy();
    expect(repoRecord?.get('lastScannedAt')).toBeFalsy();
    expect(archivedScanLogCount).toBe(0);
    expect(missingScanLogCount).toBe(0);
  });

  it('serves capabilities through the documented GET endpoint', async () => {
    const response = await app.agent().get('/api/light-extensions/capabilities');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      supportedKinds: expect.arrayContaining(['js-block', 'js-field', 'js-action', 'js-item', 'runjs', 'event']),
      enabledKinds: ['js-block', 'js-field', 'js-action', 'js-item'],
      validatorVersion: 'light-extension-validator-v1',
      sdkTemplateVersion: 'light-extension-sdk-template-v1',
      writePolicy: {
        validateFinalWorkspaceOnPush: true,
        allowDeleteExistingInvalidPaths: true,
      },
    });
    expect(response.body.allowedPaths.entries['js-block']).toContain('src/client/js-blocks/<entryName>/index.tsx');
    expect(response.body.allowedPaths.entries['js-field']).toContain('src/client/js-fields/<entryName>/index.tsx');
  });

  it('returns a validation error response from the scan resource after persisting diagnostics', async () => {
    const createResponse = await app
      .agent()
      .resource('lightExtensionRepos')
      .create({
        values: {
          name: 'Resource Scan Demo',
        },
      });
    const repo = createResponse.body.data;
    await seedRawSourceFiles(app, repoService, repo.id, [
      {
        path: 'src/client/js-blocks/bad-kpi/index.tsx',
        content: "import React from 'react';\nexport default function BadKpi() { return null; }\n",
      },
    ]);
    const scanResponse = await app
      .agent()
      .resource('lightExtensionEntries')
      .scan({
        values: {
          repoId: repo.id,
        },
      });
    const persistedEntry = await app.db.getRepository('lightExtensionEntries').findOne({
      filter: {
        repoId: repo.id,
        entryName: 'bad-kpi',
      },
    });

    expect(scanResponse.status).toBe(422);
    expect(scanResponse.body.errors[0]).toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'import_not_allowed',
            path: 'src/client/js-blocks/bad-kpi/index.tsx',
          }),
        ]),
      },
    });
    expect(persistedEntry?.get('healthStatus')).toBe('failed');
  });

  it('includes missing stable entry rows in scan resource validation errors', async () => {
    const createResponse = await app
      .agent()
      .resource('lightExtensionRepos')
      .create({
        values: {
          name: 'Resource Missing Scan Demo',
          initialFiles: validSalesKpiFiles(),
        },
      });
    const repo = createResponse.body.data;
    const firstScanResponse = await app
      .agent()
      .resource('lightExtensionEntries')
      .scan({
        values: {
          repoId: repo.id,
        },
      });
    const entryId = firstScanResponse.body.data.entries[0].entry.id;
    await app
      .agent()
      .resource('lightExtensionFiles')
      .push({
        values: {
          repoId: repo.id,
          baseCommitId: firstScanResponse.body.data.repo.headCommitId,
          message: 'delete resource missing scan demo',
          files: validSalesKpiFiles().map((file) => ({
            path: file.path,
            operation: 'delete',
          })),
        },
      });

    const missingScanResponse = await app
      .agent()
      .resource('lightExtensionEntries')
      .scan({
        values: {
          repoId: repo.id,
        },
      });

    expect(missingScanResponse.status).toBe(422);
    expect(missingScanResponse.body.errors[0]).toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: {
        entries: expect.arrayContaining([
          expect.objectContaining({
            id: entryId,
            healthStatus: 'missing',
          }),
        ]),
      },
    });
  });

  it('returns an invalid input response when the scan resource receives a ref', async () => {
    const createResponse = await app
      .agent()
      .resource('lightExtensionRepos')
      .create({
        values: {
          name: 'Resource Ref Scan Demo',
          initialFiles: validSalesKpiFiles(),
        },
      });
    const repo = createResponse.body.data;

    const scanResponse = await app
      .agent()
      .resource('lightExtensionEntries')
      .scan({
        values: {
          repoId: repo.id,
          ref: repo.headCommitId || 'head',
        },
      });
    const emptyRefScanResponse = await app
      .agent()
      .resource('lightExtensionEntries')
      .scan({
        values: {
          repoId: repo.id,
          ref: '',
        },
      });

    expect(scanResponse.status).toBe(400);
    expect(scanResponse.body.errors[0]).toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      status: 400,
    });
    expect(emptyRefScanResponse.status).toBe(400);
    expect(emptyRefScanResponse.body.errors[0]).toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      status: 400,
    });
  });
});

describe('plugin-light-extension capabilities HTTP permissions', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'users',
        'auth',
        'acl',
        'data-source-manager',
        'system-settings',
        PluginVscFileServer,
        PluginLightExtensionServer,
      ],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('requires the light-extension ACL snippet for the documented GET endpoint', async () => {
    const restrictedAgent = await createRoleAgent(app, 'lightExtensionRestricted');
    const adminAgent = await createRoleAgent(app, 'lightExtensionAdmin', [LIGHT_EXTENSION_ACL_SNIPPET]);

    const restrictedResponse = await restrictedAgent.get('/api/light-extensions/capabilities');
    const adminResponse = await adminAgent.get('/api/light-extensions/capabilities');

    expect(restrictedResponse.status).toBe(403);
    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body).toMatchObject({
      supportedKinds: expect.arrayContaining(['js-block', 'js-field', 'js-action', 'js-item', 'runjs', 'event']),
      enabledKinds: ['js-block', 'js-field', 'js-action', 'js-item'],
      validatorVersion: 'light-extension-validator-v1',
    });
  });

  it('serves the documented GET endpoint under a configured API base path', async () => {
    const originalApiBasePath = process.env.API_BASE_PATH;
    process.env.API_BASE_PATH = '/api/';
    const customApp = await createMockServer({
      name: 'light-extension-custom-api',
      resourcer: {
        prefix: '/custom-api',
      },
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'users',
        'auth',
        'acl',
        'data-source-manager',
        'system-settings',
        PluginVscFileServer,
        PluginLightExtensionServer,
      ],
    });

    try {
      const adminAgent = await createRoleAgent(customApp, 'lightExtensionCustomApiAdmin', [
        LIGHT_EXTENSION_ACL_SNIPPET,
      ]);
      const response = await adminAgent.get('/custom-api/light-extensions/capabilities');
      const defaultPrefixResponse = await adminAgent.get('/api/light-extensions/capabilities');

      expect(response.status).toBe(200);
      expect(defaultPrefixResponse.status).not.toBe(200);
      expect(response.body).toMatchObject({
        enabledKinds: ['js-block', 'js-field', 'js-action', 'js-item'],
        validatorVersion: 'light-extension-validator-v1',
      });
    } finally {
      await customApp.destroy();
      if (typeof originalApiBasePath === 'undefined') {
        delete process.env.API_BASE_PATH;
      } else {
        process.env.API_BASE_PATH = originalApiBasePath;
      }
    }
  });

  it('honors role mode when resolving roles for the documented GET endpoint', async () => {
    await createRole(app, 'lightExtensionLimited');
    await createRole(app, 'lightExtensionAllowed', [LIGHT_EXTENSION_ACL_SNIPPET]);
    const user = await app.db.getRepository('users').create({
      values: {
        nickname: 'lightExtensionMultiRole',
        roles: ['lightExtensionLimited', 'lightExtensionAllowed'],
      },
    });
    await setUserDefaultRole(app, String(user.get('id')), 'lightExtensionLimited');

    const defaultResponse = await (await app.agent().login(user)).get('/api/light-extensions/capabilities');
    const limitedResponse = await (await app.agent().login(user))
      .set('x-role', 'lightExtensionLimited')
      .get('/api/light-extensions/capabilities');
    const allowedResponse = await (await app.agent().login(user))
      .set('x-role', 'lightExtensionAllowed')
      .get('/api/light-extensions/capabilities');
    const invalidRoleResponse = await (await app.agent().login(user))
      .set('x-role', 'lightExtensionMissing')
      .get('/api/light-extensions/capabilities');

    expect(defaultResponse.status).toBe(403);
    expect(limitedResponse.status).toBe(403);
    expect(allowedResponse.status).toBe(200);
    expect(invalidRoleResponse.status).toBe(401);

    await setRoleMode(app, 'allow-use-union');
    const allowUseUnionResponse = await (await app.agent().login(user))
      .set('x-role', '__union__')
      .get('/api/light-extensions/capabilities');
    expect(allowUseUnionResponse.status).toBe(200);

    await setRoleMode(app, 'only-use-union');
    const onlyUseUnionResponse = await (await app.agent().login(user)).get('/api/light-extensions/capabilities');
    expect(onlyUseUnionResponse.status).toBe(200);
  });

  it('enforces ACL for the entries scan and capabilities resources', async () => {
    const restrictedAgent = await createRoleAgent(app, 'lightExtensionResourceRestricted');
    const adminAgent = await createRoleAgent(app, 'lightExtensionResourceAdmin', [LIGHT_EXTENSION_ACL_SNIPPET]);
    const createResponse = await adminAgent.resource('lightExtensionRepos').create({
      values: {
        name: 'Resource ACL Scan Demo',
        initialFiles: validSalesKpiFiles(),
      },
    });
    const repo = createResponse.body.data;

    const restrictedScan = await restrictedAgent.resource('lightExtensionEntries').scan({
      values: {
        repoId: repo.id,
      },
    });
    const adminScan = await adminAgent.resource('lightExtensionEntries').scan({
      values: {
        repoId: repo.id,
      },
    });
    const entryId = adminScan.body.data.entries[0].entry.id;
    const restrictedList = await restrictedAgent.resource('lightExtensionEntries').list({
      values: {
        repoId: repo.id,
      },
    });
    const adminList = await adminAgent.resource('lightExtensionEntries').list({
      values: {
        repoId: repo.id,
      },
    });
    const restrictedGet = await restrictedAgent.resource('lightExtensionEntries').get({
      values: {
        entryId,
      },
    });
    const adminGetByEntryId = await adminAgent.resource('lightExtensionEntries').get({
      values: {
        entryId,
      },
    });
    const adminGetByFilterByTk = await adminAgent.resource('lightExtensionEntries').get({
      filterByTk: entryId,
    });
    const restrictedCapabilities = await restrictedAgent.resource('lightExtensionCapabilities').get();
    const adminCapabilities = await adminAgent.resource('lightExtensionCapabilities').get();

    expect(restrictedScan.status).toBe(403);
    expect(adminScan.status).toBe(200);
    expect(restrictedList.status).toBe(403);
    expect(adminList.status).toBe(200);
    expect(adminList.body.data[0].id).toBe(entryId);
    expect(restrictedGet.status).toBe(403);
    expect(adminGetByEntryId.status).toBe(200);
    expect(adminGetByEntryId.body.data.id).toBe(entryId);
    expect(adminGetByFilterByTk.status).toBe(200);
    expect(adminGetByFilterByTk.body.data.id).toBe(entryId);
    expect(restrictedCapabilities.status).toBe(403);
    expect(adminCapabilities.status).toBe(200);
  });
});

function validSalesKpiFiles() {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: 'export default function SalesKpi() { return null; }\n',
    },
    {
      path: 'src/client/js-blocks/sales-kpi/meta.json',
      content: JSON.stringify({
        title: 'Sales KPI',
        description: 'Sales KPI block',
        category: 'sales',
        tags: ['sales', 'kpi'],
        sort: 10,
      }),
    },
    {
      path: 'src/client/js-blocks/sales-kpi/settings.json',
      content: JSON.stringify({
        type: 'object',
        properties: {
          region: {
            type: 'string',
            title: 'Region',
            'x-component': 'Input',
          },
        },
      }),
    },
  ];
}

async function seedRawSourceFiles(
  app: MockServer,
  repoService: LightExtensionRepoService,
  repoId: string,
  files: LightExtensionTreeEntryInput[],
) {
  const repo = await repoService.getInternalRepo(repoId);
  const permissionHooks = new VscPermissionHookRegistry();
  permissionHooks.register(() => ({
    allowed: true,
    ownerType: 'light-extension',
  }));
  const vscFileService = new VscFileService(app.db, permissionHooks);
  const push = await vscFileService.push(
    {
      repoId: repo.vscRepoId,
      baseCommitId: repo.headCommitId,
      message: 'seed raw scanner source',
      files,
      allowEmptyCommit: true,
      metadata: {
        lightExtensionRepoId: repo.id,
        testSeed: true,
      },
    },
    {
      request: {
        resourceName: 'test',
        actionName: 'seedRawSource',
      },
    },
  );

  await app.db.getRepository('lightExtensionRepos').update({
    filterByTk: repo.id,
    values: {
      headCommitId: push.repository.headCommitId || null,
      version: repo.version + 1,
    },
  });

  return push;
}

async function createRoleAgent(app: MockServer, roleName: string, snippets: string[] = []) {
  await createRole(app, roleName, snippets);
  const user = await app.db.getRepository('users').create({
    values: {
      nickname: roleName,
      roles: [roleName],
    },
  });

  return (await app.agent().login(user)).set('x-role', roleName);
}

async function createRole(app: MockServer, roleName: string, snippets: string[] = []) {
  const role = app.acl.define({
    role: roleName,
  });
  for (const snippet of snippets) {
    role.snippets.add(snippet);
  }
  await app.db.getRepository('roles').create({
    values: {
      name: roleName,
      snippets,
    },
  });
}

async function setUserDefaultRole(app: MockServer, userId: string, roleName: string) {
  await app.db.getRepository('rolesUsers').update({
    filter: {
      userId,
    },
    values: {
      default: false,
    },
  });
  await app.db.getRepository('rolesUsers').update({
    filter: {
      userId,
      roleName,
    },
    values: {
      default: true,
    },
  });
}

async function setRoleMode(app: MockServer, roleMode: string) {
  await app.db.getRepository('systemSettings').update({
    filter: {
      id: 1,
    },
    values: {
      roleMode,
    },
  });
}
