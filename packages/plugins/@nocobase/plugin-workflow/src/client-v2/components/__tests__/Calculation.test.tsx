/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import { CalculationConfig } from '../Calculation';

const holder = vi.hoisted(() => ({
  typedVariableInputProps: [] as Array<{ disabled: boolean; metaTree: unknown; value: unknown; style: unknown }>,
}));

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
  useWorkflowTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@nocobase/client-v2', () => ({
  TypedVariableInput: (props: { disabled?: boolean; metaTree?: unknown; style?: unknown; value?: unknown }) => {
    holder.typedVariableInputProps.push({
      disabled: Boolean(props.disabled),
      metaTree: props.metaTree,
      value: props.value,
      style: props.style,
    });
    return <div data-testid="typed-variable-input" />;
  },
}));

vi.mock('@nocobase/evaluators/client', () => ({
  evaluators: {
    getEntities: () => [],
  },
}));

describe('CalculationConfig', () => {
  it('creates separate workflow variable trees for left and right operands', () => {
    holder.typedVariableInputProps = [];
    const useVariableHook = vi
      .fn()
      .mockImplementation(() => [{ name: '$context', title: 'Trigger variables', paths: ['$context'], type: '' }]);

    render(
      <CalculationConfig
        useVariableHook={useVariableHook}
        value={{
          group: {
            type: 'and',
            calculations: [{ calculator: 'equal', operands: ['{{$context.data.id}}', '{{$context.data.id}}'] }],
          },
        }}
        onChange={() => undefined}
      />,
    );

    expect(screen.getAllByTestId('typed-variable-input')).toHaveLength(2);
    expect(useVariableHook).toHaveBeenCalledTimes(2);
    expect(holder.typedVariableInputProps).toHaveLength(2);
    expect(holder.typedVariableInputProps[0].metaTree).not.toBe(holder.typedVariableInputProps[1].metaTree);
  });

  it('keeps the condition operands wrappable without forcing each operand onto its own row', () => {
    holder.typedVariableInputProps = [];

    const { container } = render(
      <CalculationConfig
        useVariableHook={() => [{ name: '$context', title: 'Trigger variables', paths: ['$context'], type: '' }]}
        value={{
          group: {
            type: 'and',
            calculations: [
              { calculator: 'equal', operands: ['{{$context.data.id}}', '{{$jobsMapByNodeKey.a.result}}'] },
            ],
          },
        }}
        onChange={() => undefined}
      />,
    );

    const fieldset = container.querySelector('fieldset');
    expect(fieldset).not.toBeNull();
    expect(fieldset).toHaveStyle({ display: 'flex', flexWrap: 'wrap' });
    const operands = screen.getAllByTestId('calculation-operand');
    expect(operands).toHaveLength(2);
    expect(operands[0]).toHaveStyle({ flexGrow: '0', flexShrink: '1', flexBasis: 'auto' });
    expect(holder.typedVariableInputProps).toHaveLength(2);
    expect(holder.typedVariableInputProps[0].style).toBeUndefined();
    expect(holder.typedVariableInputProps[1].style).toBeUndefined();
  });

  it('inherits disabled state from the parent form for both operands', () => {
    holder.typedVariableInputProps = [];

    render(
      <Form disabled>
        <CalculationConfig
          useVariableHook={() => [{ name: '$context', title: 'Trigger variables', paths: ['$context'], type: '' }]}
          value={{
            group: {
              type: 'and',
              calculations: [{ calculator: 'equal', operands: ['{{$context.data.id}}', 0] }],
            },
          }}
          onChange={() => undefined}
        />
      </Form>,
    );

    expect(holder.typedVariableInputProps).toHaveLength(2);
    expect(holder.typedVariableInputProps.every((props) => props.disabled)).toBe(true);
  });
});
