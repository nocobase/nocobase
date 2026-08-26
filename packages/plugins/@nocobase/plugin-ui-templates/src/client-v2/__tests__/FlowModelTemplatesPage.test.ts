/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  buildTemplateListParams,
  deleteFlowModelTemplate,
  getTemplateFilter,
  isTemplateInUse,
  updateFlowModelTemplate,
  type FlowModelTemplateResource,
} from '../components/FlowModelTemplatesPage';

function makeResource(overrides: Partial<FlowModelTemplateResource> = {}): FlowModelTemplateResource {
  return {
    list: vi.fn().mockResolvedValue({ data: { rows: [] } }),
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('FlowModelTemplatesPage request helpers', () => {
  it('builds block list params with the non-popup filter', () => {
    expect(buildTemplateListParams({ templateType: 'block', page: 2, pageSize: 50 })).toEqual({
      page: 2,
      pageSize: 50,
      sort: '-createdAt',
      filter: {
        $or: [{ type: { $ne: 'popup' } }, { type: { $empty: true } }],
      },
    });
  });

  it('builds popup list params', () => {
    expect(buildTemplateListParams({ templateType: 'popup', page: 1, pageSize: 20 })).toEqual({
      page: 1,
      pageSize: 20,
      sort: '-createdAt',
      filter: { type: 'popup' },
    });
  });

  it('keeps the block and popup filters stable', () => {
    expect(getTemplateFilter('block')).toEqual({
      $or: [{ type: { $ne: 'popup' } }, { type: { $empty: true } }],
    });
    expect(getTemplateFilter('popup')).toEqual({ type: 'popup' });
  });

  it('updates only editable template metadata with uid as filterByTk', async () => {
    const resource = makeResource();

    await updateFlowModelTemplate({
      resource,
      record: { uid: 'tpl-1' },
      values: { name: 'Template A', description: 'Desc' },
    });

    expect(resource.update).toHaveBeenCalledTimes(1);
    expect(resource.update).toHaveBeenCalledWith({
      filterByTk: 'tpl-1',
      values: {
        name: 'Template A',
        description: 'Desc',
      },
    });
  });

  it('deletes by uid and exposes the in-use guard', async () => {
    const resource = makeResource();

    expect(isTemplateInUse({ usageCount: 0 })).toBe(false);
    expect(isTemplateInUse({ usageCount: 2 })).toBe(true);

    await deleteFlowModelTemplate({ resource, record: { uid: 'tpl-2' } });

    expect(resource.destroy).toHaveBeenCalledTimes(1);
    expect(resource.destroy).toHaveBeenCalledWith({ filterByTk: 'tpl-2' });
  });
});
