/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V1AggregateInstruction from '../../client/AggregateInstruction';
import V2AggregateInstruction from '../AggregateInstruction';

describe('AggregateInstruction', () => {
  it('keeps the v1 node as a compatibility entry over the v2 implementation', () => {
    const instruction = new V1AggregateInstruction();

    expect(instruction).toBeInstanceOf(V2AggregateInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.useInitializers).toBe('function');
  });

  it('preserves the v1 default config', () => {
    const instruction = new V2AggregateInstruction();

    expect(instruction.createDefaultConfig()).toEqual({
      aggregator: 'count',
      associated: false,
      precision: 2,
    });
  });

  it('exposes the aggregate result as a scalar workflow variable', () => {
    const instruction = new V2AggregateInstruction();

    expect(
      instruction.useVariables(
        {
          id: 1,
          key: 'n1',
          title: 'Aggregate posts',
          config: { collection: 'posts' },
        },
        { types: ['number'] },
      ),
    ).toEqual({
      value: 'n1',
      label: 'Aggregate posts',
    });
  });

  it('does not expose the aggregate result for unsupported variable type filters', () => {
    const instruction = new V2AggregateInstruction();

    expect(
      instruction.useVariables(
        {
          id: 1,
          key: 'n1',
          title: 'Aggregate posts',
          config: { collection: 'posts' },
        },
        {
          types: [
            {
              type: 'reference',
              options: {
                collection: 'posts',
              },
            },
          ],
        },
      ),
    ).toBeNull();
  });

  it('preserves the aggregate-result block menu item contract', () => {
    const instruction = new V2AggregateInstruction();

    expect(
      instruction.getCreateModelMenuItem({
        node: {
          id: 1,
          key: 'n1',
          title: 'Aggregate posts',
          config: { collection: 'posts' },
        },
      }),
    ).toMatchObject({
      key: '#1',
      label: 'Aggregate posts',
      useModel: 'NodeValueModel',
      createModelOptions: {
        stepParams: {
          valueSettings: {
            init: {
              dataSource: '{{$jobsMapByNodeKey.n1}}',
              defaultValue: '{{t("Query result", { ns: "workflow-aggregate" })}}',
            },
          },
          cardSettings: {
            titleDescription: {
              title: '{{t("Aggregate", { ns: "workflow-aggregate" })}}',
            },
          },
        },
      },
    });
  });

  it('does not create model entries before an aggregate collection is selected', () => {
    const instruction = new V2AggregateInstruction();

    expect(
      instruction.getCreateModelMenuItem({
        node: {
          id: 1,
          key: 'n1',
          title: 'Aggregate posts',
          config: {},
        },
      }),
    ).toBeNull();
  });
});
