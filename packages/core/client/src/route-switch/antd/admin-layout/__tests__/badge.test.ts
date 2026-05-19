/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { shouldDisplayRouteBadge } from '../badge';

describe('shouldDisplayRouteBadge', () => {
  it('should hide zero badge by default', () => {
    expect(shouldDisplayRouteBadge(0)).toBe(false);
    expect(shouldDisplayRouteBadge('0')).toBe(false);
  });

  it('should show zero badge when showZero is enabled', () => {
    expect(shouldDisplayRouteBadge(0, true)).toBe(true);
    expect(shouldDisplayRouteBadge('0', true)).toBe(true);
  });

  it('should show non-zero badge values', () => {
    expect(shouldDisplayRouteBadge(1)).toBe(true);
    expect(shouldDisplayRouteBadge('待处理')).toBe(true);
  });

  it('should hide empty badge values', () => {
    expect(shouldDisplayRouteBadge(null)).toBe(false);
    expect(shouldDisplayRouteBadge(undefined)).toBe(false);
  });
});
