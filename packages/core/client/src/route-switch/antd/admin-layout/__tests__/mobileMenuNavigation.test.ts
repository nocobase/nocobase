/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { MOBILE_MENU_CLOSE_DELAY_MS, runAfterMobileMenuClosed } from '../mobileMenuNavigation';

describe('runAfterMobileMenuClosed', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should run callback immediately when not in mobile mode', () => {
    const closeMobileMenu = vi.fn();
    const callback = vi.fn();

    runAfterMobileMenuClosed({
      isMobile: false,
      closeMobileMenu,
      callback,
    });

    expect(closeMobileMenu).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should close menu first and run callback after default delay in mobile mode', () => {
    vi.useFakeTimers();
    const closeMobileMenu = vi.fn();
    const callback = vi.fn();

    runAfterMobileMenuClosed({
      isMobile: true,
      closeMobileMenu,
      callback,
    });

    expect(closeMobileMenu).toHaveBeenCalledTimes(1);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(MOBILE_MENU_CLOSE_DELAY_MS - 1);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should support custom delay value in mobile mode', () => {
    vi.useFakeTimers();
    const closeMobileMenu = vi.fn();
    const callback = vi.fn();

    runAfterMobileMenuClosed({
      isMobile: true,
      closeMobileMenu,
      callback,
      delayMs: 80,
    });

    vi.advanceTimersByTime(79);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
