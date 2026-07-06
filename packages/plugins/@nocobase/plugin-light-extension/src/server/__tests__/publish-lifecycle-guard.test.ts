/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createDbStub,
  createEntryRecord,
  createFileServiceStub,
  createPublishService,
  createRepo,
  validSalesKpiFiles,
} from './publish-test-helpers';

describe('plugin-light-extension publish lifecycle guard', () => {
  it('blocks disabled repositories without creating publications or changing scan state', async () => {
    const repo = createRepo({
      lifecycleStatus: 'disabled',
      lastScannedCommitId: 'scan_commit_keep',
    });
    const { db, publicationsRepository, reposRepository } = createDbStub([
      createEntryRecord({ id: 'lee_sales_kpi', repoId: repo.id, entryName: 'sales-kpi' }),
    ]);
    const service = createPublishService(db, createFileServiceStub(repo, validSalesKpiFiles()));

    const result = await service.publish({
      repoId: repo.id,
      entryIds: ['lee_sales_kpi'],
      commitId: 'vsc_commit_1',
      clientRequestId: 'publish_req_disabled_repo',
    });

    expect(result).toMatchObject({
      status: 'failed',
      httpStatus: 422,
      entryResults: [
        expect.objectContaining({
          entryId: 'lee_sales_kpi',
          status: 'conflict',
          reasonCode: 'lifecycle_conflict',
          diagnostics: [
            expect.objectContaining({
              code: 'repo_lifecycle_conflict',
            }),
          ],
        }),
      ],
    });
    expect(publicationsRepository.create).not.toHaveBeenCalled();
    expect(reposRepository.update).not.toHaveBeenCalled();
  });

  it('blocks missing or disabled entries independently of ready entries', async () => {
    const repo = createRepo();
    const { db, publicationsRepository } = createDbStub([
      createEntryRecord({ id: 'lee_sales_kpi', repoId: repo.id, entryName: 'sales-kpi' }),
      createEntryRecord({
        id: 'lee_disabled',
        repoId: repo.id,
        entryName: 'disabled-entry',
        healthStatus: 'disabled',
      }),
    ]);
    const service = createPublishService(db, createFileServiceStub(repo, validSalesKpiFiles()));

    const result = await service.publish({
      repoId: repo.id,
      entryIds: ['lee_sales_kpi', 'lee_disabled'],
      commitId: 'vsc_commit_1',
      clientRequestId: 'publish_req_disabled_entry',
    });

    expect(result.status).toBe('partial_success');
    expect(result.httpStatus).toBe(207);
    expect(result.entryResults[0]).toMatchObject({
      entryId: 'lee_sales_kpi',
      status: 'created',
    });
    expect(result.entryResults[1]).toMatchObject({
      entryId: 'lee_disabled',
      status: 'conflict',
      diagnostics: expect.arrayContaining([
        expect.objectContaining({
          code: 'entry_missing',
        }),
        expect.objectContaining({
          code: 'entry_lifecycle_conflict',
        }),
      ]),
    });
    expect(publicationsRepository.create).toHaveBeenCalledTimes(1);
  });
});
