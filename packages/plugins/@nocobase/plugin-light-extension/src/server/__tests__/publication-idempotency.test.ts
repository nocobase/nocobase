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

describe('plugin-light-extension publication idempotency', () => {
  it('reuses an existing publication for the same entry commit artifact and settings defaults', async () => {
    const repo = createRepo();
    const existingPublication = {
      id: 'lep_existing',
      repoId: repo.id,
      entryId: 'lee_sales_kpi',
      commitId: 'vsc_commit_1',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      target: 'client',
      kind: 'js-block',
      surfaceStyle: 'render',
      runtimeVersion: 'v2',
      artifact: {
        code: "const title = 'Sales KPI';\nctx.render(<div>{title}</div>);\n",
        version: 'v2',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        filesHash: 'files_hash_existing',
        diagnostics: [],
        metadata: {
          publicationContract: 'light-extension.external-runjs.v1',
        },
      },
      settingsSchemaSnapshot: {
        type: 'object',
      },
      settingsDefaultsSnapshot: {
        threshold: 5,
      },
      settingsSchemaHash: 'schema_hash_existing',
      settingsDefaultsHash: 'defaults_hash_existing',
      filesHash: 'files_hash_existing',
      runtimeCodeHash: 'runtime_hash_existing',
      diagnostics: [],
    };
    const { db, publicationsRepository } = createDbStub(
      [createEntryRecord({ id: 'lee_sales_kpi', repoId: repo.id, entryName: 'sales-kpi' })],
      existingPublication,
    );
    const service = createPublishService(db, createFileServiceStub(repo, validSalesKpiFiles()));

    const result = await service.publish({
      repoId: repo.id,
      entryIds: ['lee_sales_kpi'],
      commitId: 'vsc_commit_1',
      clientRequestId: 'publish_req_retry',
    });

    expect(result.status).toBe('success');
    expect(result.httpStatus).toBe(200);
    expect(result.entryResults).toEqual([
      expect.objectContaining({
        entryId: 'lee_sales_kpi',
        status: 'reused',
        publication: expect.objectContaining({
          id: 'lep_existing',
        }),
      }),
    ]);
    expect(publicationsRepository.create).not.toHaveBeenCalled();
  });
});
