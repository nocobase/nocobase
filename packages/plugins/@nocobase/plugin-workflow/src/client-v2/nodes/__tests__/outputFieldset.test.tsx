/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
}));

vi.mock('../../canvas/WorkflowTypedVariableInput', () => ({
  WORKFLOW_TYPED_CONSTANT_TYPES: ['string', 'number', 'boolean', 'date', 'object'],
  WorkflowTypedVariableInput: (props: any) => (
    <div
      data-testid="workflow-typed-variable-input"
      data-value={props.value ?? ''}
      data-placeholder={props.placeholder ?? ''}
      data-nullable={String(props.nullable)}
      data-default-to-first={String(props.defaultToFirstConstantTypeWhenUndefined)}
      data-types={JSON.stringify(props.types)}
    />
  ),
}));

import { OutputFieldset } from '../components/output';

describe('OutputFieldset', () => {
  it('binds the field to config.value and preserves the v1 typed-variable configuration', () => {
    render(
      <Form initialValues={{ value: 'top-level-value', config: { value: 'nested-config-value' } }}>
        <OutputFieldset />
      </Form>,
    );

    expect(screen.getByText('Output value')).toBeInTheDocument();

    const input = screen.getByTestId('workflow-typed-variable-input');
    expect(input).toHaveAttribute('data-value', 'nested-config-value');
    expect(input).toHaveAttribute('data-placeholder', 'Input workflow result');
    expect(input).toHaveAttribute('data-nullable', 'false');
    expect(input).toHaveAttribute('data-default-to-first', 'true');
    expect(input).toHaveAttribute('data-types', '["string","number","boolean","date","object"]');
  });
});
