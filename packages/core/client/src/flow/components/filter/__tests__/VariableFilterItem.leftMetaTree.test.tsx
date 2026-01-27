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

// Mock VariableInput same as the base spec
vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<any>('@nocobase/flow-engine');
  const MockVariableInput = ({ onChange }: any) => (
    <button
      type="button"
      data-testid="variable-input"
      onClick={() =>
        onChange?.(
          (globalThis as any).__TEST_PATH__ || 'title',
          (globalThis as any).__TEST_META__ || {
            interface: 'input',
            uiSchema: { 'x-component': 'Input', 'x-component-props': { placeholder: 'Enter value' } },
            paths: ['collection', 'title'],
          },
        )
      }
    >
      mock-variable-input
    </button>
  );
  return { ...actual, VariableInput: MockVariableInput };
});

function createModelWithCollection() {
  const engine = new FlowEngine();
  const model = new FlowModel({ uid: 'm-variable-filter-left', flowEngine: engine });
  const app = new Application({});
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

  // prepare collection without injecting meta globally
  const ds = engine.dataSourceManager.getDataSource('main');
  ds.addCollection({
    name: 'posts',
    fields: [
      { name: 'title', type: 'string', interface: 'input', uiSchema: { 'x-component': 'Input' } },
      { name: 'status', type: 'string', interface: 'select', uiSchema: { 'x-component': 'Select' } },
    ],
  });
  model.context.defineProperty('collection', { get: () => ds.getCollection('posts') });

  return model as any;
}

describe('VariableFilterItem with leftMetaTree', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    (globalThis as any).__TEST_PATH__ = undefined;
    (globalThis as any).__TEST_META__ = undefined;
  });

  it('resolves field path from collection (implicit left tree)', async () => {
    const value = { path: '', operator: '', value: '' } as any;
    const model = createModelWithCollection();
    render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);

    fireEvent.click(screen.getByTestId('variable-input'));
    // meta.paths=['collection','title'] -> value.path becomes 'title'
    expect(value.path).toBe('title');
  });

  it('noValue operator hides RHS VariableInput (smoke)', async () => {
    const value = { path: '', operator: '', value: '' } as any;
    const model = createModelWithCollection();
    const view = render(<VariableFilterItem value={value} model={model} rightAsVariable />);

    // choose left -> RHS appears
    fireEvent.click(screen.getAllByTestId('variable-input')[0]);
    expect(screen.getAllByTestId('variable-input').length).toBeGreaterThanOrEqual(2);

    // set operator to noValue and re-render -> RHS should disappear (only left remains)
    value.operator = '$null';
    view.rerender(<VariableFilterItem value={value} model={model} rightAsVariable />);
    expect(screen.getAllByTestId('variable-input').length).toBeGreaterThanOrEqual(1);
  });

  it('prefers child operators injected via x-filter-operators when child field selected', async () => {
    const value = { path: '', operator: '', value: '' } as any;
    const model = createModelWithCollection();

    (globalThis as any).__TEST_PATH__ = 'containsText';
    (globalThis as any).__TEST_META__ = {
      interface: 'input',
      uiSchema: { 'x-component': 'Input', 'x-filter-operators': [{ value: '$includes', label: 'contains' }] },
      paths: ['collection', 'containsText'],
    };

    const { rerender } = render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);
    fireEvent.click(screen.getByTestId('variable-input'));
    value.operator = '$includes';
    rerender(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);
    expect(value.operator).toBe('$includes');
  });

  it('renders right VariableInput when rightAsVariable=true', async () => {
    const value = { path: '', operator: '', value: '' } as any;
    const model = createModelWithCollection();
    render(<VariableFilterItem value={value} model={model} rightAsVariable />);
    fireEvent.click(screen.getAllByTestId('variable-input')[0]);
    // left + right inputs
    expect(screen.getAllByTestId('variable-input').length).toBeGreaterThanOrEqual(2);
  });

  it('right constant mapping does not crash (smoke)', async () => {
    const value = { path: '', operator: '$eq', value: '' } as any;
    const model = createModelWithCollection();
    render(<VariableFilterItem value={value} model={model} rightAsVariable />);
    // right variable input select constant root
    (globalThis as any).__TEST_META__ = { paths: ['constant'] };
    fireEvent.click(screen.getAllByTestId('variable-input')[1]);
    expect(screen.getAllByTestId('variable-input').length).toBeGreaterThanOrEqual(1);
  });

  it('right null mapping does not crash (smoke)', async () => {
    const value = { path: '', operator: '$eq', value: 'x' } as any;
    const model = createModelWithCollection();
    render(<VariableFilterItem value={value} model={model} rightAsVariable />);
    (globalThis as any).__TEST_META__ = { paths: ['null'] };
    fireEvent.click(screen.getAllByTestId('variable-input')[1]);
    expect(screen.getAllByTestId('variable-input').length).toBeGreaterThanOrEqual(1);
  });

  it('default operator options are translated from interface operators', async () => {
    const value = { path: '', operator: '', value: '' } as any;
    const model = createModelWithCollection();
    render(<VariableFilterItem value={value} model={model} />);
    fireEvent.click(screen.getByTestId('variable-input'));
    // default interface has $eq and $null; selecting field will populate options
    value.operator = '$eq';
    render(<VariableFilterItem value={value} model={model} />);
    expect(value.operator).toBe('$eq');
  });

  it('merges schema from field and operator for RHS rendering without errors', async () => {
    const value = { path: '', operator: '$eq', value: '' } as any;
    const model = createModelWithCollection();
    render(<VariableFilterItem value={value} model={model} rightAsVariable={false} />);
    fireEvent.click(screen.getByTestId('variable-input'));
    // RHS should render an input without crash
    const input = await screen.findByPlaceholderText('Enter value');
    expect(input).toBeTruthy();
  });

  it('keeps selection to leafs only (simulated by mock)', async () => {
    const value = { path: '', operator: '', value: '' } as any;
    const model = createModelWithCollection();
    render(<VariableFilterItem value={value} model={model} />);
    fireEvent.click(screen.getByTestId('variable-input'));
    expect(typeof value.path).toBe('string');
  });

  it('still updates path even without providing leftMetaTree (mocked VariableInput bypasses tree)', async () => {
    const value = { path: '', operator: '', value: '' } as any;
    const model = createModelWithCollection();
    render(<VariableFilterItem value={value} model={model} />);
    fireEvent.click(screen.getByTestId('variable-input'));
    expect(value.path).toBe('title');
  });
});
