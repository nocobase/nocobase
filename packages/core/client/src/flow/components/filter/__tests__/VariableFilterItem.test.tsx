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
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VariableFilterItem, VariableFilterItemValue } from '../VariableFilterItem';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { Application } from '../../../../application/Application';
import { CollectionFieldInterface } from '../../../../data-source/collection-field-interface/CollectionFieldInterface';
import { observable } from '@formily/reactive';

// Mock VariableInput to a minimal test double (single button)
vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<any>('@nocobase/flow-engine');
  const MockVariableInput = (props: any) => {
    const { onChange } = props;
    (globalThis as any).__LAST_VARIABLE_INPUT_PROPS__ = props;

    return (
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
              name: 'name',
              title: 'Name',
              type: 'string',
            },
          )
        }
      >
        mock-variable-input
      </button>
    );
  };
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
  class FormulaInterface extends CollectionFieldInterface {
    name = 'formula';
    group = 'advanced';
    filterable = {
      operators: [
        { value: '$gt', label: '>' },
        { value: '$empty', label: 'is empty', noValue: true },
      ],
    };
  }
  app.addFieldInterfaces([InputInterface, FormulaInterface]);

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
        formulaField: {
          title: 'Formula field',
          interface: 'formula',
          type: 'string',
          // MetaTreeNode likely doesn't have 'options' directly, but FormulaFieldModel reads it from options?
          // Checking usage in VariableFilterItem line 317: (leftMeta as any)?.options?.dataType
          // So strict MetaTreeNode might not have it, we may need to cast or use 'any' if valid in runtime.
          // However, here we are defining property options for collection config, NOT MetaTreeNode directly yet.
          options: { dataType: 'string' },
          uiSchema: { 'x-component': 'Input', 'x-component-props': { placeholder: 'Enter value' } },
        },
      },
    },
  });

  return model;
}

describe('VariableFilterItem', () => {
  beforeEach(() => {
    // Ensure document body for antd portals if needed
    document.body.innerHTML = '';
    delete (globalThis as any).__LAST_VARIABLE_INPUT_PROPS__;
  });

  it('returns undefined path for empty left value in converter', () => {
    const value: VariableFilterItemValue = { path: '', operator: '', value: '' };
    const model = CreateModel();

    render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);

    const leftVariableInputProps = (globalThis as any).__LAST_VARIABLE_INPUT_PROPS__;
    const resolvePathFromValue = leftVariableInputProps?.converters?.resolvePathFromValue;

    expect(typeof resolvePathFromValue).toBe('function');
    expect(resolvePathFromValue('')).toBeUndefined();
    expect(resolvePathFromValue('   ')).toBeUndefined();
    expect(resolvePathFromValue('name')).toEqual(['collection', 'name']);
  });

  it('renders static right input when rightAsVariable=false and updates value on typing', async () => {
    const value: VariableFilterItemValue = { path: '', operator: '', value: '' };
    const model = CreateModel();

    render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);

    // Click variable input to select a field (mock sets leftValue & meta)
    fireEvent.click(screen.getByTestId('variable-input'));

    // Should render a plain input for right value
    const input = await screen.findByPlaceholderText('Enter value');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(value.value).toBe('abc');
  });

  it('keeps numeric string when x-component uses InputNumber with stringMode', async () => {
    const prevMeta = (globalThis as any).__TEST_META__;
    const prevPath = (globalThis as any).__TEST_PATH__;
    (globalThis as any).__TEST_PATH__ = 'price';
    (globalThis as any).__TEST_META__ = {
      interface: 'input',
      uiSchema: { 'x-component': 'InputNumber', 'x-component-props': { stringMode: true } },
      paths: ['collection', 'price'],
      name: 'price',
      title: 'Price',
      type: 'number',
    };

    const value: VariableFilterItemValue = { path: 'price', operator: '$eq', value: '123.45' };
    const model = CreateModel();

    render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);
    fireEvent.click(screen.getByTestId('variable-input'));

    await waitFor(() => {
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('123.45');
      expect(value.value).toBe('123.45');
    });

    (globalThis as any).__TEST_META__ = prevMeta;
    (globalThis as any).__TEST_PATH__ = prevPath;
  });

  it('normalizes synthetic event value when formula field renders Input from app components', async () => {
    const value: VariableFilterItemValue = { path: '', operator: '', value: '' };
    const model = CreateModel();

    // Use a simpler functional component type to avoid 'any'
    const EventInput: React.FC<any> = ({ onChange, value: inputValue, ...rest }) => (
      <input data-testid="formula-input" value={inputValue ?? ''} onChange={(e) => onChange?.(e)} {...rest} />
    );
    // Cast to any is unavoidable here if addComponents is not strictly typed in Application class for arbitrary components,
    // but at least we scope it.
    (model.context.app as unknown as Application).addComponents({ Input: EventInput });

    (globalThis as any).__TEST_PATH__ = 'formulaField';
    (globalThis as any).__TEST_META__ = {
      interface: 'formula',
      uiSchema: { 'x-component': 'Input', 'x-component-props': { placeholder: 'Enter value' } },
      options: { dataType: 'string' },
      paths: ['collection', 'formulaField'],
      // Satisfy MetaTreeNode interface
      name: 'formulaField',
      title: 'Formula field',
      type: 'string',
    };

    render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);
    fireEvent.click(screen.getByTestId('variable-input'));

    const input = await screen.findByPlaceholderText('Enter value');
    fireEvent.change(input, { target: { value: '3.14' } });
    expect(value.value).toBe('3.14');

    delete (globalThis as any).__TEST_PATH__;
    delete (globalThis as any).__TEST_META__;
  });

  it('renders right VariableInput when rightAsVariable=true and hides it for noValue operator', async () => {
    const value = observable({ path: '', operator: '', value: '' }) as any;
    const model = CreateModel();

    const { rerender } = render(<VariableFilterItem value={value} model={model} rightAsVariable />);

    // Left select -> both left and right variable inputs should be available (2 instances)
    fireEvent.click(screen.getAllByTestId('variable-input')[0]);

    // Two VariableInput mocks should exist (left + right)
    expect(screen.queryAllByTestId('variable-input')).toHaveLength(2);

    // Set operator to a noValue operator and rerender -> right side should disappear
    const nextValue: VariableFilterItemValue = { ...value, operator: '$null' };
    rerender(<VariableFilterItem value={nextValue} model={model} rightAsVariable />);
    // Only left VariableInput remains（右侧在 noValue 操作符下不渲染）
    expect(screen.queryAllByTestId('variable-input')).toHaveLength(1);
  });

  it('keeps noValue operator value when operator schema changes x-component', async () => {
    const value = observable({ path: '', operator: '', value: '' }) as any;
    const model = CreateModel();

    // 注册一个布尔型接口，提供 noValue=true 且 schema 为 Select 的操作符
    class CheckboxInterface extends CollectionFieldInterface {
      name = 'checkbox';
      group = 'choices';
      filterable = {
        operators: [
          {
            value: '$isTruly',
            label: 'Yes',
            noValue: true,
            schema: {
              'x-component': 'Select',
              'x-component-props': {
                options: [
                  { label: 'Yes', value: true },
                  { label: 'No', value: false },
                ],
              },
            },
          },
        ],
      };
    }
    (model.context.app as any).addFieldInterfaces([CheckboxInterface]);

    // 模拟选择 Checkbox 字段，初始 uiSchema 的 x-component 是 Checkbox
    const prevMeta = (globalThis as any).__TEST_META__;
    const prevPath = (globalThis as any).__TEST_PATH__;
    (globalThis as any).__TEST_PATH__ = 'flag';
    (globalThis as any).__TEST_META__ = {
      interface: 'checkbox',
      uiSchema: { 'x-component': 'Checkbox' },
      paths: ['collection', 'flag'],
    };

    const { rerender } = render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);

    // 选择字段后，effect 会将 operator 设为 $isTruly，并写入占位值 true（对应 x-component: Checkbox）
    fireEvent.click(screen.getByTestId('variable-input'));
    await waitFor(() => {
      expect(value.operator).toBe('$isTruly');
    });

    // rerender 触发 mergedSchema 的 x-component 从 Checkbox 切到 Select（来自 operator schema）
    rerender(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);

    // 旧逻辑会在上述切换时清空 value；修复后应保持 true
    expect(value.value).toBe(true);

    // 还原全局 mock 以避免污染其它用例
    (globalThis as any).__TEST_META__ = prevMeta;
    (globalThis as any).__TEST_PATH__ = prevPath;
  });

  it('resets operator and value when operators of current field become empty', async () => {
    const value: VariableFilterItemValue = { path: '', operator: '$eq', value: 'abc' };
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
    (model2.context.app as unknown as Application).addFieldInterfaces([InputInterfaceAlt]);
    rerender(<VariableFilterItem value={value} model={model2} rightAsVariable={false} />);

    // effect: 当当前 operator 不在新列表中时，自动回退到第一个可用操作符
    expect(value.operator).toBe('$null');
    expect(value.value).toBe(true);
  });

  it('prefers child operators injected via x-filter-operators over interface defaults', async () => {
    const value = observable({ path: '', operator: '', value: '' }) as any;
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
      name: 'containsText',
      title: 'Contains text',
      type: 'string',
    };

    const { rerender } = render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);
    fireEvent.click(screen.getByTestId('variable-input'));

    // 选择子项后，将 operator 设置为子项自带的 $includes
    value.operator = '$includes';
    rerender(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);

    // 由于 $includes 存在于子项的 x-filter-operators 中，effect 不应清空它
    expect(value.operator).toBe('$includes');
  });

  it('renders correct right-side component for formula dataType (number and boolean) and updates on change', async () => {
    const value: VariableFilterItemValue = { path: '', operator: '$gt', value: '' };
    const model = CreateModel();

    // Number case
    (globalThis as any).__TEST_PATH__ = 'formulaField';
    (globalThis as any).__TEST_META__ = {
      interface: 'formula',
      uiSchema: { 'x-component': 'Input', 'x-component-props': { placeholder: 'Enter value' } },
      options: { dataType: 'double' },
      paths: ['collection', 'formulaField'],
      name: 'formulaField',
      title: 'Formula field',
      type: 'number',
    };

    const { rerender } = render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);
    fireEvent.click(screen.getByTestId('variable-input'));

    // Expect an InputNumber (role spinbutton) to be rendered
    await waitFor(() => {
      expect(screen.getByRole('spinbutton')).toBeTruthy();
    });

    // Now change to boolean dataType and re-select the field
    (globalThis as any).__TEST_META__ = {
      ...(globalThis as any).__TEST_META__,
      options: { dataType: 'boolean' },
    };
    fireEvent.click(screen.getByTestId('variable-input'));

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeTruthy();
    });

    // Finally change to string and ensure Input is shown
    (globalThis as any).__TEST_META__ = {
      ...(globalThis as any).__TEST_META__,
      options: { dataType: 'string' },
    };
    fireEvent.click(screen.getByTestId('variable-input'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter value')).toBeTruthy();
    });

    // cleanup
    delete (globalThis as any).__TEST_PATH__;
    delete (globalThis as any).__TEST_META__;
  });
});
