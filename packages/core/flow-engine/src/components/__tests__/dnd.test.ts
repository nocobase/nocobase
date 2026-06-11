/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { resolveOverlayAnchorTransform } from '../dnd';

describe('resolveOverlayAnchorTransform', () => {
  it('should keep the original transform when anchor point is missing', () => {
    const transform = { x: 24, y: 36, scaleX: 1, scaleY: 1 };

    expect(
      resolveOverlayAnchorTransform({
        activeId: 'menu-item-1',
        active: { id: 'menu-item-1' },
        transform,
        activeNodeRect: { top: 80, left: 120 },
        dragAnchorPoint: null,
      }),
    ).toEqual(transform);
  });

  it('should align the overlay origin to the pointer position when dragging from toolbar handle', () => {
    expect(
      resolveOverlayAnchorTransform({
        activeId: 'menu-item-1',
        active: { id: 'menu-item-1' },
        transform: { x: 20, y: 30, scaleX: 1, scaleY: 1 },
        activeNodeRect: { top: 200, left: 100 },
        dragAnchorPoint: { x: 180, y: 260 },
      }),
    ).toEqual({
      x: 100,
      y: 90,
      scaleX: 1,
      scaleY: 1,
    });
  });
});
