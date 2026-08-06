/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import {
  deleteJsTemplate,
  detachJsTemplateToInline,
  listJsTemplateCatalog,
  listJsTemplateUsageLocations,
  type ApiClientLike,
} from '../api/jsTemplatesRequests';
import type { DetachJsTemplateToInlineInput } from '../../shared/types';

describe('JS Template catalog requests', () => {
  it('loads the dedicated entry-centric catalog action without reusing the runtime selectable catalog', async () => {
    const catalog = [
      {
        id: 'jtt_entry',
        projectId: 'jtp_source',
        projectName: 'source',
        projectTitle: 'Source',
        projectLifecycleStatus: 'enabled',
        kind: 'js-block',
        templateName: 'entry',
        title: 'Entry',
        description: null,
        healthStatus: 'ready',
        status: 'ready',
        usageCount: 3,
      },
    ];
    const request = vi.fn(async () => ({ data: { data: catalog } }));

    await expect(listJsTemplateCatalog({ request } as ApiClientLike)).resolves.toEqual(catalog);
    expect(request).toHaveBeenCalledWith({
      url: 'jsTemplates:listCatalog',
      method: 'post',
    });
  });

  it('loads one paginated template-level Usage list', async () => {
    const result = {
      data: [],
      meta: { page: 2, pageSize: 10, count: 11, totalPage: 2, effectiveCount: 13, hiddenCount: 2 },
    };
    const request = vi.fn(async () => ({ data: { data: result } }));

    await expect(
      listJsTemplateUsageLocations({ request } as ApiClientLike, {
        templateId: 'jtt_entry',
        page: 2,
        pageSize: 10,
      }),
    ).resolves.toEqual(result);
    expect(request).toHaveBeenCalledWith({
      url: 'jsTemplateUsages:listUsages',
      method: 'post',
      data: { templateId: 'jtt_entry', page: 2, pageSize: 10 },
    });
  });

  it('deletes one Template Entry through the authoritative server action', async () => {
    const result = { project: { id: 'jtp_source' }, templateId: 'jtt_entry' };
    const request = vi.fn(async () => ({ data: { data: result } }));

    await expect(deleteJsTemplate({ request } as ApiClientLike, 'jtt_entry')).resolves.toEqual(result);
    expect(request).toHaveBeenCalledWith({
      url: 'jsTemplates:delete',
      method: 'post',
      data: { templateId: 'jtt_entry' },
    });
  });

  it('sends only the five-field detach contract even when a caller object contains forged source fields', async () => {
    const request = vi.fn(async () => ({ data: { data: { runtimeVersion: 'v2' } } }));
    const input = {
      idempotencyKey: 'detach-sales-v1',
      locator: {
        kind: 'flowModel.step',
        modelUid: 'fm_sales',
        flowKey: 'runJs',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      projectId: 'jtp_source',
      templateId: 'jtt_entry',
      expectedProjectHeadCommitId: 'commit_1',
      files: [{ path: 'forged.ts', content: 'throw new Error();' }],
      entryPath: 'forged.ts',
      kind: 'js-action',
      version: 'forged',
    } satisfies DetachJsTemplateToInlineInput & Record<string, unknown>;

    await detachJsTemplateToInline({ request }, input);

    expect(request).toHaveBeenCalledWith({
      url: 'jsTemplates:detachToInline',
      method: 'post',
      data: {
        idempotencyKey: 'detach-sales-v1',
        locator: input.locator,
        projectId: 'jtp_source',
        templateId: 'jtt_entry',
        expectedProjectHeadCommitId: 'commit_1',
      },
    });
  });
});
