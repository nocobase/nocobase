/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChartResource } from '../flow/resources/ChartResource';
import { FlowContext } from '@nocobase/flow-engine';

describe('ChartResource', () => {
  test('should fill aggregated order alias from selected query fields', () => {
    const resource = new ChartResource(new FlowContext());

    expect(
      resource.parseQuery({
        mode: 'builder',
        collectionPath: ['main', 'orders'],
        measures: [{ field: ['price'], aggregation: 'sum', alias: 'Revenue' }],
        dimensions: [{ field: ['createdAt'], format: 'YYYY-MM', alias: 'Month' }],
        orders: [{ field: 'Revenue', order: 'DESC' }, { field: ['createdAt'], order: 'ASC' }],
      }),
    ).toMatchObject({
      orders: [
        { field: 'Revenue', alias: 'Revenue', order: 'DESC' },
        { field: ['createdAt'], alias: 'Month', order: 'ASC' },
      ],
    });
  });
});
