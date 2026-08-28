/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2DateCalculationInstruction from '../dateCalculation';
import V1DateCalculationInstruction from '../../../client/DateCalculationInstruction';
import { tExpr } from '../../locale';

describe('DateCalculationInstruction', () => {
  it('keeps the v1 node as a compatibility entry over the v2 implementation', () => {
    const instruction = new V1DateCalculationInstruction();

    expect(instruction).toBeInstanceOf(V2DateCalculationInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.useInitializers).toBe('function');
  });

  it('preserves the result block menu item contract', () => {
    const instruction = new V2DateCalculationInstruction();

    expect(
      instruction.getCreateModelMenuItem({
        node: {
          id: 1,
          key: 'n1',
          title: 'Normalize date',
          config: {},
        },
      }),
    ).toMatchObject({
      key: 'Normalize date',
      label: 'Normalize date',
      useModel: 'NodeValueModel',
      createModelOptions: {
        use: 'NodeValueModel',
        stepParams: {
          valueSettings: {
            init: {
              dataSource: '{{$jobsMapByNodeKey.n1}}',
              defaultValue: tExpr('Date calculation result'),
            },
          },
          cardSettings: {
            titleDescription: {
              title: tExpr('Date calculation'),
            },
          },
        },
      },
    });
  });

  it('uses date as the default input type for new nodes', () => {
    const instruction = new V2DateCalculationInstruction();

    expect(instruction.createDefaultConfig?.()).toEqual({
      input: '{{$system.now}}',
      inputType: 'date',
      steps: [],
    });
  });

  it('preserves the v1 variable exposure contract for supported types', () => {
    const instruction = new V2DateCalculationInstruction();

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
