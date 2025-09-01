/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { App, ConfigProvider } from 'antd';
import { FlowEngine } from '../../flowEngine';
import { FlowModel, ModelRenderMode } from '../../models/flowModel';
import { DefaultSettingsIcon } from '../settings/wrappers/contextual/DefaultSettingsIcon';
import { FlowEngineProvider } from '../../provider';
import { FlowModelRenderer } from '../FlowModelRenderer';

// ---------------- Partial Mocks ----------------
// Only intercept Dropdown (to capture menu) and Modal.confirm (auto-confirm)
const dropdownMenus: any[] = [];
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    Dropdown: (props: any) => {
      (globalThis as any).__lastDropdownMenu = props.menu;
      dropdownMenus.push(props.menu);
      return React.createElement('span', { 'data-testid': 'dropdown' }, props.children);
    },
    Modal: {
      ...actual.Modal,
      confirm: (opts: any) => {
        if (opts && typeof opts.onOk === 'function') {
          return opts.onOk();
        }
        return {} as any;
      },
      error: vi.fn(),
    },
  };
});

// ---------------- Helpers ----------------
const clickDeleteFromLastDropdown = async () => {
  await waitFor(() => {
    const menu = (globalThis as any).__lastDropdownMenu;
    expect(menu).toBeTruthy();
  });
  const menu = (globalThis as any).__lastDropdownMenu;
  menu.onClick?.({ key: 'delete' });
};

// ---------------- Tests ----------------
describe('Delete problematic model via FlowSettings menu', () => {
  beforeEach(() => {
    dropdownMenus.length = 0;
    (globalThis as any).__lastDropdownMenu = undefined;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('deletes a broken top-level model when rendering via FlowModelRenderer throws', async () => {
    class BrokenModel extends FlowModel {
      render() {
        throw new Error('boom-top');
      }
    }

    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    engine.registerModels({ BrokenModel });
    const model = engine.createModel({ use: 'BrokenModel', uid: 'broken-top-2' }) as BrokenModel;
    // satisfy FlowsFloatContextMenu styles
    model.context.defineProperty('themeToken', { value: { borderRadiusLG: 8 } });

    render(
      <ConfigProvider>
        <App>
          <FlowEngineProvider engine={engine}>
            <FlowModelRenderer model={model} showFlowSettings showErrorFallback skipApplyAutoFlows />
          </FlowEngineProvider>
        </App>
      </ConfigProvider>,
    );

    await clickDeleteFromLastDropdown();
    expect(engine.getModel(model.uid)).toBeUndefined();
  });

  it('deletes a broken child in array when child FlowModelRenderer throws', async () => {
    class ParentModel extends FlowModel<{ subModels: { items: FlowModel[] } }> {
      render() {
        const items = (this.subModels as any).items || [];
        return (
          <div>
            {items.map((m: FlowModel) => (
              <FlowModelRenderer key={m.uid} model={m} showFlowSettings showErrorFallback skipApplyAutoFlows />
            ))}
          </div>
        );
      }
    }
    class BrokenChild extends FlowModel {
      render() {
        throw new Error('boom-child');
      }
    }

    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    engine.registerModels({ ParentModel, BrokenChild });
    const parent = engine.createModel({ use: 'ParentModel', uid: 'parent-3' }) as ParentModel;
    const child = engine.createModel({ use: 'BrokenChild', uid: 'child-3' }) as BrokenChild;
    parent.addSubModel('items', child);
    // theme tokens
    parent.context.defineProperty('themeToken', { value: { borderRadiusLG: 8 } });
    child.context.defineProperty('themeToken', { value: { borderRadiusLG: 8 } });

    render(
      <ConfigProvider>
        <App>
          <FlowEngineProvider engine={engine}>
            <FlowModelRenderer model={parent} skipApplyAutoFlows />
          </FlowEngineProvider>
        </App>
      </ConfigProvider>,
    );

    await clickDeleteFromLastDropdown();
    expect(engine.getModel(child.uid)).toBeUndefined();
    const remain = (parent.subModels as any).items || [];
    expect(remain.find((m: FlowModel) => m.uid === child.uid)).toBeUndefined();
  });

  it('deletes a renderFunction child when child FlowModelRenderer throws before returning fn', async () => {
    class ParentModel extends FlowModel<{ subModels: { cells: FlowModel[] } }> {
      render() {
        const cells = (this.subModels as any).cells || [];
        return (
          <div>
            {cells.map((m: FlowModel) => (
              <FlowModelRenderer key={m.uid} model={m} showFlowSettings showErrorFallback skipApplyAutoFlows />
            ))}
          </div>
        );
      }
    }
    class RenderFnChild extends FlowModel {
      static override renderMode = ModelRenderMode.RenderFunction;
      render() {
        throw new Error('boom-render-fn');
      }
    }

    const engine = new FlowEngine();
    engine.flowSettings.forceEnable();
    engine.registerModels({ ParentModel, RenderFnChild });
    const parent = engine.createModel({ use: 'ParentModel', uid: 'parent-4' }) as ParentModel;
    const child = engine.createModel({ use: 'RenderFnChild', uid: 'cell-4' }) as RenderFnChild;
    parent.addSubModel('cells', child);
    parent.context.defineProperty('themeToken', { value: { borderRadiusLG: 8 } });
    child.context.defineProperty('themeToken', { value: { borderRadiusLG: 8 } });

    render(
      <ConfigProvider>
        <App>
          <FlowEngineProvider engine={engine}>
            <FlowModelRenderer model={parent} skipApplyAutoFlows />
          </FlowEngineProvider>
        </App>
      </ConfigProvider>,
    );

    await clickDeleteFromLastDropdown();
    expect(engine.getModel(child.uid)).toBeUndefined();
    const remain = (parent.subModels as any).cells || [];
    expect(remain.find((m: FlowModel) => m.uid === child.uid)).toBeUndefined();
  });
});
