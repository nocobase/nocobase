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
import { SQLResource } from '../sqlResource';

function createSQLResource() {
  const engine = new FlowEngine();
  return engine.createResource(SQLResource);
}

describe('SQLResource - refresh', () => {
  it('should coalesce multiple refresh calls and settle all awaiters', async () => {
    vi.useFakeTimers();
    try {
      const r = createSQLResource();
      const run = vi.fn().mockResolvedValue({ data: { ok: 1 }, meta: { page: 1 } });
      (r as any).run = run;

      const p1 = r.refresh();
      const p2 = r.refresh();

      await vi.runAllTimersAsync();
      await expect(p1).resolves.toBeUndefined();
      await expect(p2).resolves.toBeUndefined();
      expect(run).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should reject all awaiters on failure', async () => {
    vi.useFakeTimers();
    try {
      const r = createSQLResource();
      const run = vi.fn().mockRejectedValue(new Error('boom'));
      (r as any).run = run;

      const p1 = r.refresh();
      const p2 = r.refresh();

      // Attach handlers before timers run to avoid unhandled rejection warnings.
      const e1 = expect(p1).rejects.toThrow('boom');
      const e2 = expect(p2).rejects.toThrow('boom');
      await vi.runAllTimersAsync();
      await e1;
      await e2;
      expect(run).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
