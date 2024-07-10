/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@testing-library/react-hooks';
import { useOpenMode } from '../useOpenMode';

describe('useOpenMode', () => {
  const pathname = 'nocobase.com/m/abc';

  it('should return isOpenModeVisible as true when not in mobile mode', () => {
    const { result } = renderHook(() => useOpenMode());
    expect(result.current.isOpenModeVisible()).toBe(true);
  });

  it('should return isOpenModeVisible as false when in mobile mode', () => {
    const { result } = renderHook(() => useOpenMode());
    expect(result.current.isOpenModeVisible(pathname)).toBe(false);
  });

  it('should return getDefaultOpenMode as "drawer" when not in mobile mode', () => {
    const { result } = renderHook(() => useOpenMode());
    expect(result.current.getDefaultOpenMode()).toBe('drawer');
  });

  it('should return getDefaultOpenMode as "page" when in mobile mode', () => {
    const { result } = renderHook(() => useOpenMode());
    expect(result.current.getDefaultOpenMode(pathname)).toBe('page');
  });
});
