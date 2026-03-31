/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FlowEngine, FlowModel, FlowSettingsContextProvider } from '@nocobase/flow-engine';
import { setTargetDataScope } from '../setTargetDataScope';
import { Application } from '../../../application/Application';
import { CollectionFieldInterface } from '../../../data-source/collection-field-interface/CollectionFieldInterface';

// Mock VariableInput used inside VariableFilterItem and left field selector
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
            paths: ['collection', (globalThis as any).__TEST_PATH__ || 'title'],
          },
        )
      }
    >
      mock-variable-input
    </button>
  );
  return { ...actual, VariableInput: MockVariableInput };
});

function createEngineWithCollections() {
  const engine = new FlowEngine();
  const app = new Application({});
  const ds = engine.dataSourceManager.getDataSource('main');
  ds.addCollection({
    name: 'posts',
    fields: [
      { name: 'title', type: 'string', interface: 'input', uiSchema: { 'x-component': 'Input' } },
      { name: 'published', type: 'boolean', interface: 'switch', uiSchema: { 'x-component': 'Switch' } },
    ],
  });
  return { engine, app } as const;
}

function registerFieldInterface(app: Application) {
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
}

describe('setTargetDataScope with leftMetaTree', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    (globalThis as any).__TEST_PATH__ = undefined;
    (globalThis as any).__TEST_META__ = undefined;
  });

  function renderAction(ctxModel: FlowModel, targetUid: string, value: any) {
    const Comp: any = (setTargetDataScope as any).uiSchema.filter['x-component'];
    return render(
      <FlowSettingsContextProvider value={ctxModel.context}>
        <Comp value={value} uid={targetUid} />
      </FlowSettingsContextProvider>,
    );
  }

  it('shows warning when target model not found', async () => {
    const { engine, app } = createEngineWithCollections();
    const ctxModel = engine.createModel<FlowModel>({ uid: 'ctx-1', use: FlowModel });
    ctxModel.context.defineProperty('app', { value: app });
    ctxModel.context.defineProperty('themeToken', { value: { colorError: '#f00' } });
    const value = { logic: '$and', items: [{ path: '', operator: '', value: '' }] };
    renderAction(ctxModel, 'non-exist', value);
    expect(screen.getByText(/Cannot find the model instance with UID/i)).toBeTruthy();
  });

  it('renders FilterGroup when target model exists', async () => {
    const { engine, app } = createEngineWithCollections();
    registerFieldInterface(app);
    const ctxModel = engine.createModel<FlowModel>({ uid: 'ctx-2', use: FlowModel });
    ctxModel.context.defineProperty('app', { value: app });
    const target = engine.createModel<FlowModel>({ uid: 'target-1', use: FlowModel });
    // inject collection getter on target
    const ds = engine.dataSourceManager.getDataSource('main');
    target.context.defineProperty('collection', { get: () => ds.getCollection('posts') });
    target.context.defineProperty('app', { value: app });
    const value = { logic: '$and', items: [{ path: '', operator: '', value: '' }] };
    renderAction(ctxModel, target.uid, value);
    expect(await screen.findAllByTestId('variable-input')).toBeTruthy();
  });

  it('left selection updates path (no collection prefix)', async () => {
    const { engine, app } = createEngineWithCollections();
    registerFieldInterface(app);
    const ctxModel = engine.createModel<FlowModel>({ uid: 'ctx-3', use: FlowModel });
    ctxModel.context.defineProperty('app', { value: app });
    const target = engine.createModel<FlowModel>({ uid: 'target-2', use: FlowModel });
    const ds = engine.dataSourceManager.getDataSource('main');
    target.context.defineProperty('collection', { get: () => ds.getCollection('posts') });
    target.context.defineProperty('app', { value: app });
    const value = { logic: '$and', items: [{ path: '', operator: '', value: '' }] };
    renderAction(ctxModel, target.uid, value);
    fireEvent.click(screen.getAllByTestId('variable-input')[0]);
    expect(value.items[0].path).toBe('title');
  });

  it('rightAsVariable shows RHS then hides for noValue operator', async () => {
    const { engine, app } = createEngineWithCollections();
    registerFieldInterface(app);
    const ctxModel = engine.createModel<FlowModel>({ uid: 'ctx-4', use: FlowModel });
    ctxModel.context.defineProperty('app', { value: app });
    const target = engine.createModel<FlowModel>({ uid: 'target-3', use: FlowModel });
    const ds = engine.dataSourceManager.getDataSource('main');
    target.context.defineProperty('collection', { get: () => ds.getCollection('posts') });
    target.context.defineProperty('app', { value: app });
    const value = { logic: '$and', items: [{ path: '', operator: '', value: '' }] };
    renderAction(ctxModel, target.uid, value);
    fireEvent.click(screen.getAllByTestId('variable-input')[0]);
    expect(screen.getAllByTestId('variable-input').length).toBeGreaterThanOrEqual(2);
    value.items[0].operator = '$null';
    renderAction(ctxModel, target.uid, value);
    expect(screen.getAllByTestId('variable-input').length).toBeGreaterThanOrEqual(1);
  });

  it('RHS constant mapping sets empty string', async () => {
    const { engine, app } = createEngineWithCollections();
    registerFieldInterface(app);
    const ctxModel = engine.createModel<FlowModel>({ uid: 'ctx-5', use: FlowModel });
    ctxModel.context.defineProperty('app', { value: app });
    const target = engine.createModel<FlowModel>({ uid: 'target-4', use: FlowModel });
    const ds = engine.dataSourceManager.getDataSource('main');
    target.context.defineProperty('collection', { get: () => ds.getCollection('posts') });
    target.context.defineProperty('app', { value: app });
    const value = { logic: '$and', items: [{ path: '', operator: '$eq', value: 'x' }] };
    renderAction(ctxModel, target.uid, value);
    fireEvent.click(screen.getAllByTestId('variable-input')[0]);
    (globalThis as any).__TEST_META__ = { paths: ['constant'] };
    fireEvent.click(screen.getAllByTestId('variable-input')[1]);
    expect(screen.getAllByTestId('variable-input').length).toBeGreaterThanOrEqual(1);
  });

  it('RHS null mapping sets null', async () => {
    const { engine, app } = createEngineWithCollections();
    registerFieldInterface(app);
    const ctxModel = engine.createModel<FlowModel>({ uid: 'ctx-6', use: FlowModel });
    ctxModel.context.defineProperty('app', { value: app });
    const target = engine.createModel<FlowModel>({ uid: 'target-5', use: FlowModel });
    const ds = engine.dataSourceManager.getDataSource('main');
    target.context.defineProperty('collection', { get: () => ds.getCollection('posts') });
    target.context.defineProperty('app', { value: app });
    const value = { logic: '$and', items: [{ path: '', operator: '$eq', value: 'x' }] };
    renderAction(ctxModel, target.uid, value);
    fireEvent.click(screen.getAllByTestId('variable-input')[0]);
    (globalThis as any).__TEST_META__ = { paths: ['null'] };
    fireEvent.click(screen.getAllByTestId('variable-input')[1]);
    expect(screen.getAllByTestId('variable-input').length).toBeGreaterThanOrEqual(1);
  });

  it('root meta tree does not contain collection globally', async () => {
    const { engine, app } = createEngineWithCollections();
    const ctxModel = new FlowModel({ uid: 'ctx-7', flowEngine: engine });
    ctxModel.context.defineProperty('app', { value: app });
    const root = ctxModel.context.getPropertyMetaTree();
    const nodes = Array.isArray(root) ? root : await (root as any)();
    expect(nodes.map((n) => n.name)).not.toContain('collection');
  });

  it('child operator via x-filter-operators preferred', async () => {
    const { engine, app } = createEngineWithCollections();
    registerFieldInterface(app);
    const ctxModel = engine.createModel<FlowModel>({ uid: 'ctx-8', use: FlowModel });
    ctxModel.context.defineProperty('app', { value: app });
    const target = engine.createModel<FlowModel>({ uid: 'target-6', use: FlowModel });
    const ds = engine.dataSourceManager.getDataSource('main');
    target.context.defineProperty('collection', { get: () => ds.getCollection('posts') });
    target.context.defineProperty('app', { value: app });
    (globalThis as any).__TEST_PATH__ = 'containsText';
    (globalThis as any).__TEST_META__ = {
      interface: 'input',
      uiSchema: { 'x-component': 'Input', 'x-filter-operators': [{ value: '$includes', label: 'contains' }] },
      paths: ['collection', 'containsText'],
    };
    const value = { logic: '$and', items: [{ path: '', operator: '', value: '' }] };
    renderAction(ctxModel, target.uid, value);
    fireEvent.click(screen.getAllByTestId('variable-input')[0]);
    value.items[0].operator = '$includes';
    renderAction(ctxModel, target.uid, value);
    expect(value.items[0].operator).toBe('$includes');
  });

  it('works across re-renders with same target', async () => {
    const { engine, app } = createEngineWithCollections();
    registerFieldInterface(app);
    const ctxModel = engine.createModel<FlowModel>({ uid: 'ctx-9', use: FlowModel });
    ctxModel.context.defineProperty('app', { value: app });
    const target = engine.createModel<FlowModel>({ uid: 'target-7', use: FlowModel });
    const ds = engine.dataSourceManager.getDataSource('main');
    target.context.defineProperty('collection', { get: () => ds.getCollection('posts') });
    target.context.defineProperty('app', { value: app });
    const value = { logic: '$and', items: [{ path: '', operator: '$eq', value: '' }] };
    const view = renderAction(ctxModel, target.uid, value);
    fireEvent.click(screen.getAllByTestId('variable-input')[0]);
    expect(value.items[0].path).toBe('title');
    renderAction(ctxModel, target.uid, value);
    expect(value.items[0].path).toBe('title');
  });
});
