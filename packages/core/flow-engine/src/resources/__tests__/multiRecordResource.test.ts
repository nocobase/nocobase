/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { MultiRecordResource } from '../multiRecordResource';

function createMultiRecordResource() {
  const engine = new FlowEngine();
  return engine.createResource(MultiRecordResource);
}

describe('MultiRecordResource - refresh', () => {
  it('should coalesce multiple refresh calls and settle all awaiters', async () => {
    vi.useFakeTimers();
    try {
      const r = createMultiRecordResource();
      const api = {
        request: vi.fn().mockResolvedValue({
          data: { data: [], meta: { count: 0, page: 1, pageSize: 20 } },
        }),
      };

      r.setAPIClient(api as any);
      r.setResourceName('posts');

      const p1 = r.refresh();
      const p2 = r.refresh();

      await vi.runAllTimersAsync();
      await expect(p1).resolves.toBeUndefined();
      await expect(p2).resolves.toBeUndefined();
      expect(api.request).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
