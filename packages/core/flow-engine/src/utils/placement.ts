/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * antd does not mirror an explicit `placement` such as `bottomLeft` in right-to-left layouts, so a popup that
 * should open under the start of its trigger opens towards the wrong side. `flipPlacement` swaps Left and Right
 * (and left and right) when the direction is rtl, and returns the placement unchanged otherwise.
 */
export function flipPlacement<T extends string | undefined>(placement: T, direction?: string): T {
  if (direction !== 'rtl' || !placement) return placement;
  return placement.replace(/left|right|Left|Right/g, (side) => {
    switch (side) {
      case 'left':
        return 'right';
      case 'right':
        return 'left';
      case 'Left':
        return 'Right';
      default:
        return 'Left';
    }
  }) as T;
}
