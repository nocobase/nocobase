/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMapConfig } from '../hooks/useMapConfig';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  resource: vi.fn(),
  api: null as any,
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: mocks.api,
  }),
}));

describe('useMapConfig', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('fetches raw configuration only once when caching is disabled', async () => {
    mocks.get.mockResolvedValue({
      data: {
        data: {
          accessKey: 'test-access-key',
          securityJsCode: 'test-security-code',
        },
      },
    });
    mocks.resource.mockReturnValue({ get: mocks.get });
    mocks.api = { resource: mocks.resource };

    const { result } = renderHook(() => useMapConfig('amap', false));

    await waitFor(() => {
      expect(result.current).toEqual({
        accessKey: 'test-access-key',
        securityJsCode: 'test-security-code',
      });
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(mocks.resource).toHaveBeenCalledWith('map-configuration');
    expect(mocks.get).toHaveBeenCalledTimes(1);
    expect(mocks.get).toHaveBeenCalledWith({
      isRaw: true,
      type: 'amap',
    });
  });
});
