/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext } from '@nocobase/flow-engine';

import { ChartResource } from '../ChartResource';

class TestChartResource extends ChartResource<any[]> {
  runCalls = 0;

  override async run() {
    this.runCalls += 1;
    return { data: [], meta: {} };
  }
}

describe('client-v2 ChartResource', () => {
  test('fills aggregated order alias from selected query fields', () => {
    const resource = new ChartResource(new FlowContext());

    expect(
      resource.parseQuery({
        mode: 'builder',
        collectionPath: ['main', 'orders'],
        measures: [{ field: ['price'], aggregation: 'sum', alias: 'Revenue' }],
        dimensions: [{ field: ['createdAt'], format: 'YYYY-MM', alias: 'Month' }],
        orders: [
          { field: 'Revenue', order: 'DESC' },
          { field: ['createdAt'], order: 'ASC' },
        ],
      }),
    ).toMatchObject({
      orders: [
        { field: 'Revenue', alias: 'Revenue', order: 'DESC' },
        { field: ['createdAt'], alias: 'Month', order: 'ASC' },
      ],
    });
  });

  test('removes empty and unparsable filter values', () => {
    const resource = new ChartResource(new FlowContext());

    resource.setFilter({
      $and: [{ status: { $eq: 'paid' } }, { title: { $eq: '{{$nFilter.empty}}' } }, {}, { amount: { $gt: 0 } }],
    });

    expect((resource as any).request.data.filter).toEqual({
      $and: [{ status: { $eq: 'paid' } }, { amount: { $gt: 0 } }],
    });
  });

  test('settles all callers when rapid refresh calls are debounced', async () => {
    const resource = new TestChartResource(new FlowContext());

    await expect(Promise.all([resource.refresh(), resource.refresh()])).resolves.toEqual([undefined, undefined]);

    expect(resource.runCalls).toBe(1);
  });
});
