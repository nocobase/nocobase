/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getFormulaScopeValues, resolveFormulaTargetNamePath } from '../FormulaFieldModel';

describe('FormulaFieldModel helpers', () => {
  it('prefers absolute subform fieldPathArray over relative row name', () => {
    expect(
      resolveFormulaTargetNamePath({
        context: { fieldPathArray: ['items', 0, 'amount'] },
        name: [0, 'amount'],
        collectionField: { name: 'amount' },
      }),
    ).toEqual(['items', 0, 'amount']);
  });

  it('reconstructs the full target path from subtable row id', () => {
    expect(
      resolveFormulaTargetNamePath({
        id: ['items.amount', 3],
        collectionField: { name: 'amount' },
      }),
    ).toEqual(['items', 3, 'amount']);
  });

  it('uses the current row object as formula scope for nested fields', () => {
    expect(
      getFormulaScopeValues(
        {
          items: [
            { amount: 3, count: 2, total: 6 },
            { amount: 5, count: 4, total: 20 },
          ],
        },
        ['items', 1, 'total'],
      ),
    ).toEqual({ amount: 5, count: 4, total: 20 });
  });
});
