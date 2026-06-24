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

describe('CalculationInstruction', () => {
  it('exposes the calculation result as a node-result variable', () => {
    const instruction = new V2CalculationInstruction();

    expect(instruction.useVariables({ key: 'n1', title: 'Calculate amount' })).toEqual({
      value: 'n1',
      label: 'Calculate amount',
    });
  });

  it('keeps the result for compatible base type filters', () => {
    const instruction = new V2CalculationInstruction();

    expect(instruction.useVariables({ key: 'n1', title: 'Calculate amount' }, { types: ['number'] })).toEqual({
      value: 'n1',
      label: 'Calculate amount',
    });
  });

  it('hides the result for unsupported type filters', () => {
    const instruction = new V2CalculationInstruction();

    expect(instruction.useVariables({ key: 'n1', title: 'Calculate amount' }, { types: ['unsupported'] })).toBeNull();
  });
});
