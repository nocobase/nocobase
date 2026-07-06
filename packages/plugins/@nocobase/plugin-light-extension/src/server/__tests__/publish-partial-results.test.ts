/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { vi } from 'vitest';

import { createLightExtensionsResource } from '../resources/lightExtensions';
import { LightExtensionCompilePreviewService } from '../services/LightExtensionCompilePreviewService';
import { LightExtensionPublishService } from '../services/LightExtensionPublishService';
import {
  createDbStub,
  createEntryRecord,
  createFileServiceStub,
  createPublishService,
  createRepo,
  validSalesKpiFiles,
} from './publish-test-helpers';

describe('plugin-light-extension publish partial results', () => {
  it('returns 207 partial_success with created publication for good entries and diagnostics for failed entries', async () => {
    const repo = createRepo();
    const { db, publicationsRepository, reposRepository } = createDbStub([
      createEntryRecord({ id: 'lee_sales_kpi', repoId: repo.id, entryName: 'sales-kpi' }),
      createEntryRecord({ id: 'lee_sales_trend', repoId: repo.id, entryName: 'sales-trend' }),
    ]);
    const service = createPublishService(
      db,
      createFileServiceStub(repo, [
        ...validSalesKpiFiles(),
        {
          path: 'src/client/js-blocks/sales-trend/index.tsx',
          content: "import { missing } from './missing';\nctx.render(<div>{missing}</div>);\n",
        },
      ]),
    );

    const result = await service.publish({
      repoId: repo.id,
      entryIds: ['lee_sales_kpi', 'lee_sales_trend'],
      commitId: 'vsc_commit_1',
      clientRequestId: 'publish_req_1',
    });

    expect(result).toMatchObject({
      status: 'partial_success',
      httpStatus: 207,
      clientRequestId: 'publish_req_1',
    });
    expect(result.entryResults[0]).toMatchObject({
      entryId: 'lee_sales_kpi',
      status: 'created',
      publication: expect.objectContaining({
        id: 'lep_created_1',
        settingsSchemaHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        settingsDefaultsHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
    expect(JSON.stringify(result.entryResults[0].publication?.artifact)).not.toContain('ctx.render');
    expect(result.entryResults[1]).toMatchObject({
      entryId: 'lee_sales_trend',
      status: 'failed',
      diagnostics: [
        expect.objectContaining({
          code: 'RUNJS_IMPORT_NOT_FOUND',
        }),
      ],
    });
    expect(publicationsRepository.create).toHaveBeenCalledTimes(1);
    expect(reposRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        filterByTk: repo.id,
        values: {
          lastPublishedAt: expect.any(Date),
        },
      }),
    );
  });

  it('activates the created publication when activate is true', async () => {
    const repo = createRepo();
    const { db, entryModels, logsRepository } = createDbStub([
      createEntryRecord({ id: 'lee_sales_kpi', repoId: repo.id, entryName: 'sales-kpi' }),
    ]);
    const service = createPublishService(db, createFileServiceStub(repo, validSalesKpiFiles()));

    const result = await service.publish(
      {
        repoId: repo.id,
        entryIds: ['lee_sales_kpi'],
        commitId: 'vsc_commit_1',
        clientRequestId: 'publish_req_activate',
        activate: true,
        expectedCurrentPublicationIdByEntry: {
          lee_sales_kpi: null,
        },
      },
      {
        requestId: 'req_publish_activate',
        actorUserId: '7',
        can: () => ({}),
      },
    );

    expect(result.status).toBe('success');
    expect(result.entryResults[0]).toMatchObject({
      entryId: 'lee_sales_kpi',
      status: 'created',
      publication: expect.objectContaining({
        id: 'lep_created_1',
      }),
    });
    expect(entryModels[0].update).toHaveBeenCalledWith(
      {
        activePublicationId: 'lep_created_1',
      },
      expect.any(Object),
    );
    expect(logsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({
          action: 'activatePublication',
          result: 'success',
          entryId: 'lee_sales_kpi',
          publicationId: 'lep_created_1',
        }),
      }),
    );
    expect(logsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({
          action: 'publish',
          result: 'success',
        }),
      }),
    );
  });

  it('sets the resource HTTP status from the publish result', async () => {
    const publish = vi.fn().mockResolvedValue({
      httpStatus: 207,
      status: 'partial_success',
    });
    const resource = createLightExtensionsResource(
      {
        compilePreview: vi.fn(),
      } as unknown as LightExtensionCompilePreviewService,
      {
        publish,
      } as unknown as LightExtensionPublishService,
    );
    const ctx = {
      action: {
        params: {
          filterByTk: 'ler_sales',
          values: {
            entryIds: ['lee_sales_kpi'],
            commitId: 'vsc_commit_1',
            clientRequestId: 'publish_req_resource',
          },
        },
      },
    } as unknown as Context;

    await resource.actions?.publish?.(ctx, async () => {});

    expect((ctx as { status?: number }).status).toBe(207);
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: 'ler_sales',
        entryIds: ['lee_sales_kpi'],
        commitId: 'vsc_commit_1',
        clientRequestId: 'publish_req_resource',
      }),
      expect.any(Object),
    );
  });
});
