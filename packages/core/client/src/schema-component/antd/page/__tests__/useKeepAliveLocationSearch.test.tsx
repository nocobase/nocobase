/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@nocobase/test/client';
import { useKeepAliveLocationSearch } from '../Page';

const { mockKeepAliveState, mockLocationSearch } = vi.hoisted(() => ({
  mockKeepAliveState: { active: true },
  mockLocationSearch: vi.fn(() => '?f=1'),
}));

vi.mock('../../../../route-switch/antd/admin-layout/KeepAlive', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../route-switch/antd/admin-layout/KeepAlive')>();
  return {
    ...actual,
    useKeepAlive: () => mockKeepAliveState,
  };
});

vi.mock('../../../../application/CustomRouterContextProvider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../application/CustomRouterContextProvider')>();
  return {
    ...actual,
    useLocationSearch: () => mockLocationSearch(),
  };
});

describe('useKeepAliveLocationSearch', () => {
  beforeEach(() => {
    mockKeepAliveState.active = true;
    mockLocationSearch.mockReset();
    mockLocationSearch.mockReturnValue('?f=1');
  });

  it('should keep the previous search string while the keep-alive page is inactive', () => {
    const { result, rerender } = renderHook(() => useKeepAliveLocationSearch());

    expect(result.current).toBe('?f=1');

    mockKeepAliveState.active = false;
    mockLocationSearch.mockReturnValue('?f=2');
    rerender();

    expect(result.current).toBe('?f=1');

    mockKeepAliveState.active = true;
    rerender();

    expect(result.current).toBe('?f=2');
  });
});
