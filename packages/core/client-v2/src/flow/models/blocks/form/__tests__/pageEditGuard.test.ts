/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { registerPageEditGuard } from '../pageEditGuard';

describe('page edit navigation', () => {
  it('keeps both drafts on cancel, discards both on confirmation, skips popup navigation', async () => {
    const router = createMemoryRouter([{ path: '*' }], { initialEntries: ['/admin/a'] });
    const confirm = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const a = { dirty: () => true, confirm, discard: vi.fn() };
    const b = { dirty: () => true, confirm: vi.fn(), discard: vi.fn() };
    // The Node Request implementation does not accept a signal constructed by happy-dom.
    vi.stubGlobal(
      'Request',
      class extends Request {
        constructor(input: RequestInfo | URL, init?: RequestInit) {
          super(input, { ...init, signal: undefined });
        }
      },
    );
    const removeA = registerPageEditGuard(router, a);
    const removeB = registerPageEditGuard(router, b);
    try {
      await router.navigate('/admin/a/view/popup');
      expect(confirm).not.toHaveBeenCalled();
      await router.navigate('/admin/b');
      await vi.waitFor(() => expect(router.state.blockers.get('nocobase-page-edit-form')?.state).toBe('unblocked'));
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(router.state.location.pathname).toBe('/admin/a/view/popup');
      expect(a.discard).not.toHaveBeenCalled();
      await router.navigate('/admin/b');
      await vi.waitFor(() => expect(router.state.location.pathname).toBe('/admin/b'));
      expect(a.discard).toHaveBeenCalledTimes(1);
      expect(b.discard).toHaveBeenCalledTimes(1);
      expect(b.confirm).not.toHaveBeenCalled();
    } finally {
      removeA();
      removeB();
      router.dispose();
      vi.unstubAllGlobals();
    }
  });
});
