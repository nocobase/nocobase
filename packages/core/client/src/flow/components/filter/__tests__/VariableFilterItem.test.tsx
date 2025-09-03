/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VariableFilterItem } from '../VariableFilterItem';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { Application } from '../../../../application/Application';
import { CollectionFieldInterface } from '../../../../data-source/collection-field-interface/CollectionFieldInterface';

// Mock VariableInput to a minimal test double (single button)
vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<any>('@nocobase/flow-engine');
  const MockVariableInput = ({ onChange }: any) => (
    <button
      type="button"
      data-testid="variable-input"
      onClick={() =>
        onChange?.('name', {
          interface: 'input',
          uiSchema: { 'x-component': 'Input', 'x-component-props': { placeholder: 'Enter value' } },
          paths: ['collection', 'name'],
        })
      }
    >
      mock-variable-input
    </button>
  );
  return { ...actual, VariableInput: MockVariableInput };
});

function CreateModel() {
  const engine = new FlowEngine();
  const model = new FlowModel({ uid: 'm-variable-filter', flowEngine: engine });
  const app = new Application({});

  // provide app to ctx for operator metadata
  model.context.defineProperty('app', { value: app });

  // Register a minimal 'input' interface with operators used in tests
  class InputInterface extends CollectionFieldInterface {
    name = 'input';
    group = 'basic';
    filterable = {
      operators: [
        { value: '$eq', label: 'Equals' },
        { value: '$null', label: 'Is null', noValue: true },
      ],
    };
  }
  app.addFieldInterfaces([InputInterface]);

  // define collection meta so that getPropertyMetaTree('{{ ctx.collection }}') works
  model.context.defineProperty('collection', {
    meta: {
      title: 'Collection',
      type: 'object',
      properties: {
        name: {
          title: 'Name',
          interface: 'input',
          type: 'string',
          uiSchema: { 'x-component': 'Input', 'x-component-props': { placeholder: 'Enter value' } },
        },
      },
    },
  });

  return model as any;
}

describe('VariableFilterItem', () => {
  beforeEach(() => {
    // Ensure document body for antd portals if needed
    document.body.innerHTML = '';
  });

  it('renders static right input when rightAsVariable=false and updates value on typing', async () => {
    const value = { leftValue: '', operator: '', rightValue: '' } as any;
    const model = CreateModel();

    render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);

    // Click variable input to select a field (mock sets leftValue & meta)
    fireEvent.click(screen.getByTestId('variable-input'));

    // Should render a plain input for right value
    const input = await screen.findByPlaceholderText('Enter value');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(value.rightValue).toBe('abc');
  });

  it('renders right VariableInput when rightAsVariable=true and hides it for noValue operator', async () => {
    const value = { leftValue: '', operator: '', rightValue: '' } as any;
    const model = CreateModel();

    const { rerender } = render(<VariableFilterItem value={value} model={model} rightAsVariable />);

    // Left select -> both left and right variable inputs should be available (2 instances)
    fireEvent.click(screen.getByTestId('variable-input'));

    // Two VariableInput mocks should exist (left + right)
    expect(screen.queryAllByTestId('variable-input')).toHaveLength(2);

    // Set operator to a noValue operator and rerender -> right side should disappear
    value.operator = '$null';
    rerender(<VariableFilterItem value={value} model={model} rightAsVariable />);
    // Only left VariableInput remains
    expect(screen.queryAllByTestId('variable-input')).toHaveLength(1);
  });
});
