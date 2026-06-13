/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import {
  clampHorizontalScrollLeft,
  getMaxHorizontalScrollLeft,
  mapHorizontalScrollLeft,
} from '../models/components/GanttBlock.helpers';

describe('GanttBlock horizontal scroll helpers', () => {
  test('maps scroll positions proportionally between containers with different widths', () => {
    expect(
      mapHorizontalScrollLeft({
        scrollLeft: 300,
        fromMaxScrollLeft: 300,
        toMaxScrollLeft: 500,
      }),
    ).toBe(500);

    expect(
      mapHorizontalScrollLeft({
        scrollLeft: 150,
        fromMaxScrollLeft: 300,
        toMaxScrollLeft: 500,
      }),
    ).toBe(250);
  });

  test('clamps horizontal scroll positions using the real max scroll distance', () => {
    expect(getMaxHorizontalScrollLeft(1200, 700)).toBe(500);
    expect(clampHorizontalScrollLeft(999, 500)).toBe(500);
    expect(clampHorizontalScrollLeft(-10, 500)).toBe(0);
  });
});
