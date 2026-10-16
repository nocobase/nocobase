/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ConfigProvider } from 'antd';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDirectionalPlacement } from '../useDirectionalPlacement';

const withDirection =
  (direction: 'ltr' | 'rtl') =>
  ({ children }: { children: React.ReactNode }) => <ConfigProvider direction={direction}>{children}</ConfigProvider>;

describe('useDirectionalPlacement', () => {
  it('keeps the placement without a provider or in ltr', () => {
    expect(renderHook(() => useDirectionalPlacement('bottomLeft')).result.current).toBe('bottomLeft');
    const { result } = renderHook(() => useDirectionalPlacement('bottomLeft'), { wrapper: withDirection('ltr') });
    expect(result.current).toBe('bottomLeft');
  });

  it('mirrors the placement in rtl', () => {
    const { result } = renderHook(() => useDirectionalPlacement('bottomLeft'), { wrapper: withDirection('rtl') });
    expect(result.current).toBe('bottomRight');
  });
});
