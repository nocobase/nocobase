/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { shouldRenderIconInTitle } from '../index';

describe('shouldRenderIconInTitle', () => {
  it('should render icon in title for level 2+ on desktop', () => {
    expect(shouldRenderIconInTitle({ depth: 2, isMobile: false })).toBe(true);
  });

  it('should keep icon in icon prop for level 1 on desktop', () => {
    expect(shouldRenderIconInTitle({ depth: 1, isMobile: false })).toBe(false);
  });

  it('should render icon in title for level 1+ on mobile', () => {
    expect(shouldRenderIconInTitle({ depth: 1, isMobile: true })).toBe(true);
  });

  it('should keep top-level icon in icon prop on mobile', () => {
    expect(shouldRenderIconInTitle({ depth: 0, isMobile: true })).toBe(false);
  });
});
