/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2CalculationInstruction from '../calculation';
import V1CalculationInstruction from '../../../client/nodes/calculation';

describe('CalculationInstruction', () => {
  it('keeps the v1 node as a compatibility entry over the v2 implementation', () => {
    const instruction = new V1CalculationInstruction();

    expect(instruction).toBeInstanceOf(V2CalculationInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.useInitializers).toBe('function');
  });

  it('preserves the calculation-result block menu item contract', () => {
    const instruction = new V2CalculationInstruction();

    expect(
      instruction.getCreateModelMenuItem({
        node: {
          id: 1,
          key: 'n1',
          title: 'Calc revenue',
          config: {},
        },
      }),
    ).toMatchObject({
      key: 'Calc revenue',
      label: 'Calc revenue',
      useModel: 'NodeValueModel',
      createModelOptions: {
        use: 'NodeValueModel',
        stepParams: {
          valueSettings: {
            init: {
              dataSource: '{{$jobsMapByNodeKey.n1}}',
              defaultValue: '{{t("Calculation result", { ns: "workflow" })}}',
            },
          },
          cardSettings: {
            titleDescription: {
              title: '{{t("Calculation", { ns: "workflow" })}}',
            },
          },
        },
      },
    });
  });

  it('exposes the calculation result as a node-result variable', () => {
    const instruction = new V2CalculationInstruction();

    expect(instruction.useVariables({ key: 'n1', title: 'Calculate amount' })).toEqual({
      value: 'n1',
      label: 'Calculate amount',
    });
  });

  it('keeps the result for compatible base type filters', () => {
    const instruction = new V2CalculationInstruction();

    expect(
      instruction.useVariables(
        { key: 'calc1', title: 'Calc 1' },
        {
          types: ['number'],
        },
      ),
    ).toEqual({
      value: 'calc1',
      label: 'Calc 1',
    });
  });

  it('hides the result for unsupported type filters', () => {
    const instruction = new V2CalculationInstruction();

    expect(
      instruction.useVariables(
        { key: 'calc1', title: 'Calc 1' },
        {
          types: ['belongsTo'],
        },
      ),
    ).toBeNull();
  });
});
