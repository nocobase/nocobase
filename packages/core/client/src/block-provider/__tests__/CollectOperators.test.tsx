/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@nocobase/test/client';
import React from 'react';
import { CollectOperators, useOperators } from '../CollectOperators';

describe('CollectOperators', () => {
  it('should collect and get operators correctly', () => {
    const defaultOperators = {
      field1: 'operator1',
      field2: 'operator2',
    };

    const TestComponent = () => {
      const { collectOperator, getOperators, getOperator } = useOperators();

      collectOperator('field3', 'operator3');

      const operators = getOperators();
      const operator = getOperator('field1') as string;

      return (
        <div>
          <span data-testid="operators">{JSON.stringify(operators)}</span>
          <span data-testid="operator">{operator}</span>
        </div>
      );
    };

    const { getByTestId } = render(
      <CollectOperators defaultOperators={defaultOperators}>
        <TestComponent />
      </CollectOperators>,
    );

    const operatorsElement = getByTestId('operators');
    const operatorElement = getByTestId('operator');

    expect(JSON.parse(operatorsElement.textContent)).toEqual({
      ...defaultOperators,
      field3: 'operator3',
    });
    expect(operatorElement.textContent).toBe('operator1');
  });
});
