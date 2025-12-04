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
        onChange?.(
          (globalThis as any).__TEST_PATH__ || 'name',
          (globalThis as any).__TEST_META__ || {
            interface: 'input',
            uiSchema: { 'x-component': 'Input', 'x-component-props': { placeholder: 'Enter value' } },
            paths: ['collection', 'name'],
          },
        )
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
      children: [
        {
          name: 'containsText',
          title: 'Contains text',
          schema: { 'x-component': 'Input' },
          operators: [{ value: '$includes', label: 'contains' }],
        },
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
    const value = { path: '', operator: '', value: '' } as any;
    const model = CreateModel();

    render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);

    // Click variable input to select a field (mock sets leftValue & meta)
    fireEvent.click(screen.getByTestId('variable-input'));

    // Should render a plain input for right value
    const input = await screen.findByPlaceholderText('Enter value');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(value.value).toBe('abc');
  });

  it('renders right VariableInput when rightAsVariable=true and hides it for noValue operator', async () => {
    const value = { path: '', operator: '', value: '' } as any;
    const model = CreateModel();

    const { rerender } = render(<VariableFilterItem value={value} model={model} rightAsVariable />);

    // Left select -> both left and right variable inputs should be available (2 instances)
    fireEvent.click(screen.getAllByTestId('variable-input')[0]);

    // Two VariableInput mocks should exist (left + right)
    expect(screen.queryAllByTestId('variable-input')).toHaveLength(2);

    // Set operator to a noValue operator and rerender -> right side should disappear
    const nextValue: any = { ...value, operator: '$null' };
    rerender(<VariableFilterItem value={nextValue} model={model} rightAsVariable />);
    // Only left VariableInput remains（右侧在 noValue 操作符下不渲染）
    expect(screen.queryAllByTestId('variable-input')).toHaveLength(1);
  });

  it('resets operator and value when operators of current field become empty', async () => {
    const value = { path: '', operator: '$eq', value: 'abc' } as any;
    const model1 = CreateModel();

    const { rerender } = render(<VariableFilterItem value={value} model={model1} rightAsVariable={false} />);
    // 选择字段，当前接口有 $eq 操作符
    fireEvent.click(screen.getByTestId('variable-input'));
    expect(value.operator).toBe('$eq');

    // 构造一个没有 operators 的同名接口，替换 app，使当前字段不再有任何可用操作符
    const model2 = CreateModel();
    class InputInterfaceAlt extends CollectionFieldInterface {
      name = 'input';
      group = 'basic';
      filterable = {
        operators: [{ value: '$null', label: 'Is null', noValue: true }],
      };
    }
    (model2.context.app as any).addFieldInterfaces([InputInterfaceAlt]);
    rerender(<VariableFilterItem value={value} model={model2} rightAsVariable={false} />);

    // effect: 当当前 operator 不在新列表中时，自动回退到第一个可用操作符
    expect(value.operator).toBe('$null');
    expect(value.value).toBe(true);
  });

  it('prefers child operators injected via x-filter-operators over interface defaults', async () => {
    const value = { path: '', operator: '', value: '' } as any;
    const model = CreateModel();

    // 通过全局变量注入 child meta（包含 x-filter-operators）
    (globalThis as any).__TEST_PATH__ = 'containsText';
    (globalThis as any).__TEST_META__ = {
      interface: 'input',
      uiSchema: {
        'x-component': 'Input',
        'x-filter-operators': [{ value: '$includes', label: 'contains' }],
      },
      paths: ['collection', 'containsText'],
    };

    const { rerender } = render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);
    fireEvent.click(screen.getByTestId('variable-input'));

    // 选择子项后，将 operator 设置为子项自带的 $includes
    value.operator = '$includes';
    rerender(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);

    // 由于 $includes 存在于子项的 x-filter-operators 中，effect 不应清空它
    expect(value.operator).toBe('$includes');
  });
});
