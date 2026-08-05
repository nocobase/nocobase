/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import { listJsTemplateCatalog, type ApiClientLike } from '../api/jsTemplatesRequests';

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
});
