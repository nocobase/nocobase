/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowSurfaceBadRequestError } from '../flow-surfaces/errors';
import { normalizeFlowSurfaceFilterGroupValue } from '../flow-surfaces/filter-group';

describe('flow surfaces filter group date value whitelist', () => {
  it('should accept date values emitted by the filter UI', () => {
    const filter = {
      logic: '$and',
      items: [
        { path: 'createdAt', operator: '$dateOn', value: '2026-01-01' },
        { path: 'createdAt', operator: '$dateOn', value: '2026-01' },
        { path: 'createdAt', operator: '$dateOn', value: '2026' },
        { path: 'createdAt', operator: '$dateOn', value: '2026-Q1' },
        { path: 'createdAt', operator: '$dateOn', value: '2026Q1' },
        { path: 'createdAt', operator: '$dateOn', value: { type: 'thisWeek' } },
        { path: 'createdAt', operator: '$dateOn', value: { type: 'past', number: 7, unit: 'day' } },
        { path: 'createdAt', operator: '$dateBetween', value: ['2026-01-01', '2026-01-31'] },
      ],
    };

    expect(normalizeFlowSurfaceFilterGroupValue(filter, 'test filter', { strictDateValues: true })).toMatchObject(
      filter,
    );
  });

  it('should reject date values outside the filter UI contract', () => {
    const values = [
      'thisWeek',
      '-7d',
      '2026-13',
      '2026-02-31',
      '2026-Q5',
      '2026-01-01T00:00:00.000Z',
      { $toNow: 'd', $gt: -7 },
      { type: 'thisWeek', unit: 'week' },
      { type: 'past' },
      { type: 'past', number: '7', unit: 'day' },
    ];

    for (const value of values) {
      expect(() =>
        normalizeFlowSurfaceFilterGroupValue(
          {
            logic: '$and',
            items: [{ path: 'createdAt', operator: '$dateOn', value }],
          },
          'test filter',
          { strictDateValues: true },
        ),
      ).toThrow(FlowSurfaceBadRequestError);
    }
  });
});
