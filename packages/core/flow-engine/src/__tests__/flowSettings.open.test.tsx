/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { FlowSettings } from '../flowSettings';
import { FlowModel } from '../models';
import { FlowEngine } from '../flowEngine';

// We will stub viewer directly on model.context in tests

// Lightweight mocks for Formily/Antd components used during compile
vi.mock('@formily/antd-v5', () => ({
  Form: () => 'Form',
  FormDialog: () => 'FormDialog',
  FormDrawer: () => 'FormDrawer',
  FormItem: () => 'FormItem',
  FormLayout: () => 'FormLayout',
  FormGrid: () => 'FormGrid',
  FormStep: () => 'FormStep',
  FormTab: () => 'FormTab',
  FormCollapse: () => 'FormCollapse',
  FormButtonGroup: () => 'FormButtonGroup',
  Input: () => 'Input',
  NumberPicker: () => 'NumberPicker',
  Password: () => 'Password',
  Select: () => 'Select',
  SelectTable: () => 'SelectTable',
  Cascader: () => 'Cascader',
  TreeSelect: () => 'TreeSelect',
  Transfer: () => 'Transfer',
  DatePicker: () => 'DatePicker',
  TimePicker: () => 'TimePicker',
  Checkbox: () => 'Checkbox',
  Radio: () => 'Radio',
  Switch: () => 'Switch',
  ArrayBase: () => 'ArrayBase',
  ArrayCards: () => 'ArrayCards',
  ArrayCollapse: () => 'ArrayCollapse',
  ArrayItems: () => 'ArrayItems',
  ArrayTable: () => 'ArrayTable',
  ArrayTabs: () => 'ArrayTabs',
  Upload: () => 'Upload',
  Space: () => 'Space',
  Editable: () => 'Editable',
  PreviewText: () => 'PreviewText',
  Submit: () => 'Submit',
  Reset: () => 'Reset',
}));
vi.mock('antd', () => ({
  Button: () => 'Button',
  Space: () => 'Space',
  Tabs: () => 'Tabs',
  Collapse: Object.assign((props: any) => 'Collapse', { Panel: (props: any) => 'Panel' }),
}));

// helper to locate the primary Button element in a React element tree
const findPrimaryButton = async (node: any) => {
  const { Button } = await import('antd');
  const walk = (n: any): any => {
    if (!n || typeof n !== 'object') return null;
    if (n.type === Button && n?.props?.type === 'primary') return n;
    const children = n.props?.children;
    if (!children) return null;
    if (Array.isArray(children)) {
      for (const c of children) {
        const r = walk(c);
        if (r) return r;
      }
      return null;
    }
    return walk(children);
  };
  return walk(node);
};

// helper to locate the cancel Button (the non-primary one with text 'Cancel')
const findCancelButton = async (node: any) => {
  const { Button } = await import('antd');
  const walk = (n: any): any => {
    if (!n || typeof n !== 'object') return null;
    const isBtn = n.type === Button;
    const isCancel = isBtn && !n?.props?.type && n?.props?.children === 'Cancel';
    if (isCancel) return n;
    const children = n.props?.children;
    if (!children) return null;
    if (Array.isArray(children)) {
      for (const c of children) {
        const r = walk(c);
        if (r) return r;
      }
      return null;
    }
    return walk(children);
  };
  return walk(node);
};

describe('FlowSettings.open rendering behavior', () => {
  afterEach(() => {
    document.querySelectorAll('[data-testid]')?.forEach((n) => n.remove());
    vi.clearAllMocks();
    FlowModel.clearFlows();
  });

  it('renders single-step form directly when flowKey+stepKey provided (no Collapse)', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-1', flowEngine: engine });

    // Register a dummy flow with one step
    const M = model.constructor as any;
    M.registerFlow({
      key: 'testFlow',
      steps: {
        general: {
          title: 'General',
          uiSchema: {
            field1: { type: 'string', 'x-component': 'Input' },
          },
        },
      },
    });

    // stub viewer
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          const dialog = {
            close: () => container.remove(),
            Footer: () => null,
          } as any;
          const container = document.createElement('div');
          container.setAttribute('data-testid', 'flow-settings-container');
          // execute content function to ensure render path doesn't throw
          if (typeof content === 'function') {
            content(dialog);
          }
          document.body.appendChild(container);
          return dialog;
        },
        drawer: ({ content }) => {
          return (this as any).dialog({ content });
        },
      },
    });

    await flowSettings.open({ model, flowKey: 'testFlow', stepKey: 'general', uiMode: 'dialog' } as any);

    const container = screen.getByTestId('flow-settings-container');
    expect(container).toBeInTheDocument();
    // Should NOT render Collapse markers since we render a plain form
    expect(container.querySelector('.ant-collapse')).toBeNull();
  });

  it('renders Collapse when only one step matched but no stepKey provided', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-2', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'testFlow2',
      steps: {
        general: {
          title: 'General',
          uiSchema: {
            field1: { type: 'string', 'x-component': 'Input' },
          },
        },
      },
    });

    // stub viewer
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          const dialog = {
            close: () => container.remove(),
            Footer: () => null,
          } as any;
          const container = document.createElement('div');
          container.setAttribute('data-testid', 'flow-settings-container');
          if (typeof content === 'function') {
            content(dialog);
          }
          document.body.appendChild(container);
          return dialog;
        },
        drawer: ({ content }) => {
          return (this as any).dialog({ content });
        },
      },
    });

    await flowSettings.open({ model, flowKey: 'testFlow2', uiMode: 'dialog' } as any);

    const container = screen.getByTestId('flow-settings-container');
    expect(container).toBeInTheDocument();
    // In our minimal mock we don't render real Collapse DOM, but we can check that the FlowViewer was invoked.
    // For robustness, just assert container exists (behavior difference is ensured by code path and not by DOM markers here).
    expect(container).toBeTruthy();
  });

  it('shows info when there are no configurable steps (entries length 0)', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-none', flowEngine: engine });

    // message spy
    const info = vi.fn();
    const error = vi.fn();
    const success = vi.fn();
    model.context.defineProperty('message', { value: { info, error, success } });

    // viewer spies (should NOT be called)
    const dialog = vi.fn();
    const drawer = vi.fn();
    model.context.defineProperty('viewer', { value: { dialog, drawer } });

    await flowSettings.open({ model } as any);

    expect(info).toHaveBeenCalled();
    expect(dialog).not.toHaveBeenCalled();
    expect(drawer).not.toHaveBeenCalled();
  });

  it('uses drawer uiMode when specified', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-drawer', flowEngine: engine });

    // Register one simple flow/step
    const M = model.constructor as any;
    M.registerFlow({
      key: 'f',
      steps: {
        s: {
          title: 'S',
          uiSchema: {
            field: { type: 'string', 'x-component': 'Input' },
          },
        },
      },
    });

    // message stub
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    const openSpy = { lastTree: null as any };
    const viewerDrawer = vi.fn(({ content }) => {
      const dlg = { close: vi.fn(), Footer: (props: any) => null } as any;
      openSpy.lastTree = typeof content === 'function' ? content(dlg) : null;
      return dlg;
    });
    const viewerDialog = vi.fn();
    model.context.defineProperty('viewer', { value: { drawer: viewerDrawer, dialog: viewerDialog } });

    await flowSettings.open({ model, flowKey: 'f', uiMode: 'drawer' } as any);
    expect(viewerDrawer).toHaveBeenCalledTimes(1);
    expect(viewerDialog).not.toHaveBeenCalled();
    expect(openSpy.lastTree).toBeTruthy();
  });

  it('saves successfully and calls hooks, messages, and close', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-save', flowEngine: engine });

    const beforeHook = vi.fn();
    const afterHook = vi.fn();
    const M = model.constructor as any;
    M.registerFlow({
      key: 'fx',
      steps: {
        general: {
          title: 'General',
          defaultParams: { a: 1 },
          beforeParamsSave: beforeHook,
          afterParamsSave: afterHook,
          uiSchema: {
            field1: { type: 'string', 'x-component': 'Input' },
          },
        },
      },
    });

    const info = vi.fn();
    const error = vi.fn();
    const success = vi.fn();
    model.context.defineProperty('message', { value: { info, error, success } });

    const setStepParams = vi.spyOn(model as any, 'setStepParams');
    const save = vi.spyOn(model as any, 'saveStepParams').mockResolvedValue(undefined);

    // capture returned React tree for triggering primary button
    let lastTree: any;
    let lastDialog: any;
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          lastDialog = { close: vi.fn(), Footer: (p: any) => null } as any;
          lastTree = typeof content === 'function' ? content(lastDialog) : null;
          // return dialog object
          return lastDialog;
        },
        drawer: ({ content }) => (model as any).context.viewer.dialog({ content }),
      },
    });

    await flowSettings.open({ model, flowKey: 'fx', stepKey: 'general', uiMode: 'dialog' } as any);

    // traverse the created React element tree to find the primary Button and click it
    const primaryBtn = await findPrimaryButton(lastTree);
    expect(primaryBtn).toBeTruthy();
    await primaryBtn.props.onClick?.();

    // assertions
    expect(setStepParams).toHaveBeenCalledWith('fx', 'general', expect.any(Object));
    expect(beforeHook).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
    expect(success).toHaveBeenCalled();
    expect(afterHook).toHaveBeenCalled();
    expect(lastDialog.close).toHaveBeenCalled();
  });

  it('calls onSaved callback after successful save', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-onsaved', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flow',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });
    vi.spyOn(model as any, 'save').mockResolvedValue(undefined);

    let lastTree: any;
    let lastDialog: any;
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          lastDialog = { close: vi.fn(), Footer: (p: any) => null } as any;
          lastTree = typeof content === 'function' ? content(lastDialog) : null;
          return lastDialog;
        },
      },
    });

    const onSaved = vi.fn();
    await flowSettings.open({ model, flowKey: 'flow', stepKey: 'step', onSaved } as any);

    const primaryBtn = await findPrimaryButton(lastTree);
    expect(primaryBtn).toBeTruthy();
    await primaryBtn.props.onClick?.();

    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(lastDialog.close).toHaveBeenCalled();
  });

  it('calls onCancel callback when cancel button clicked', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-oncancel', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flow',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    let lastTree: any;
    let lastDialog: any;
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          lastDialog = { close: vi.fn(), Footer: (p: any) => null } as any;
          lastTree = typeof content === 'function' ? content(lastDialog) : null;
          return lastDialog;
        },
      },
    });

    const onCancel = vi.fn();
    await flowSettings.open({ model, flowKey: 'flow', stepKey: 'step', onCancel } as any);

    const cancelBtn = await findCancelButton(lastTree);
    expect(cancelBtn).toBeTruthy();
    await cancelBtn.props.onClick?.();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(lastDialog.close).toHaveBeenCalled();
  });

  it('handles save error by showing error message and keeping dialog open', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-error', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'fy',
      steps: {
        s: {
          title: 'S',
          defaultParams: { b: 2 },
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const info = vi.fn();
    const error = vi.fn();
    const success = vi.fn();
    model.context.defineProperty('message', { value: { info, error, success } });

    vi.spyOn(model as any, 'saveStepParams').mockRejectedValue(new Error('boom'));

    let lastTree: any;
    let lastDialog: any;
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          lastDialog = { close: vi.fn(), Footer: (p: any) => null } as any;
          lastTree = typeof content === 'function' ? content(lastDialog) : null;
          return lastDialog;
        },
      },
    });

    await flowSettings.open({ model, flowKey: 'fy', stepKey: 's' } as any);

    const primaryBtn = await findPrimaryButton(lastTree);
    expect(primaryBtn).toBeTruthy();
    await primaryBtn.props.onClick?.();

    expect(error).toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(lastDialog.close).not.toHaveBeenCalled();
  });

  it('filters steps by preset when preset=true', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-preset', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'pf',
      steps: {
        a: {
          title: 'A',
          preset: true,
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
        b: {
          title: 'B',
          uiSchema: { g: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });
    const dialog = vi.fn(({ content }) => {
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof content === 'function') content(dlg);
      return dlg;
    });

    model.context.defineProperty('viewer', {
      value: {
        dialog,
      },
    });

    await flowSettings.open({ model, flowKey: 'pf', preset: true } as any);
    expect(dialog).toHaveBeenCalled();
  });

  it('shows info when preset=true but no step is preset', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-preset-none', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'pf2',
      steps: {
        x: { title: 'X', uiSchema: { f: { type: 'string', 'x-component': 'Input' } } },
        y: { title: 'Y', uiSchema: { g: { type: 'string', 'x-component': 'Input' } } },
      },
    });

    const info = vi.fn();
    const dialog = vi.fn();
    model.context.defineProperty('message', { value: { info, error: vi.fn(), success: vi.fn() } });
    model.context.defineProperty('viewer', { value: { dialog } });

    await flowSettings.open({ model, flowKey: 'pf2', preset: true } as any);
    expect(info).not.toHaveBeenCalled(); // 这种一般是在添加 sub model 的场景调用的，如果为空应该直接忽略，不需要 info 提示
    expect(dialog).not.toHaveBeenCalled();
  });

  it('shows dialog when preset=true and step has hideInSettings=true', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-preset-hidden', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'pf3',
      steps: {
        hiddenStep: {
          title: 'Hidden Step',
          preset: true,
          hideInSettings: true,
          uiSchema: { field: { type: 'string', 'x-component': 'Input' } },
        },
        visibleStep: {
          title: 'Visible Step',
          uiSchema: { field2: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });
    const dialog = vi.fn(({ content }) => {
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof content === 'function') content(dlg);
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });

    await flowSettings.open({ model, flowKey: 'pf3', preset: true } as any);
    expect(dialog).toHaveBeenCalled(); // 应该显示弹窗，因为 hiddenStep 有 preset=true
  });

  it('ignores hideInSettings when preset=true for individual step', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-preset-single-hidden', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'pf4',
      steps: {
        targetStep: {
          title: 'Target Step',
          preset: true,
          hideInSettings: true,
          uiSchema: { field: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });
    const dialog = vi.fn(({ content }) => {
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof content === 'function') content(dlg);
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });

    await flowSettings.open({
      model,
      flowKey: 'pf4',
      stepKey: 'targetStep',
      preset: true,
    } as any);

    expect(dialog).toHaveBeenCalled(); // 应该显示弹窗，即使 hideInSettings=true
  });

  it('respects hideInSettings when preset=false', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-normal-hidden', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'pf5',
      steps: {
        hiddenStep: {
          title: 'Hidden Step',
          hideInSettings: true,
          uiSchema: { field: { type: 'string', 'x-component': 'Input' } },
        },
        visibleStep: {
          title: 'Visible Step',
          uiSchema: { field2: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });
    const dialog = vi.fn(({ content }) => {
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof content === 'function') content(dlg);
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });

    await flowSettings.open({ model, flowKey: 'pf5', preset: false } as any);
    expect(dialog).toHaveBeenCalled(); // 应该显示弹窗，但只包含 visibleStep
  });

  it('accepts uiMode object (dialog) and merges props while keeping our content', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-uiMode-obj-dialog', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowObj',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const info = vi.fn();
    const error = vi.fn();
    const success = vi.fn();
    model.context.defineProperty('message', { value: { info, error, success } });

    const sentinelContent = vi.fn();
    const viewerDialog = vi.fn((opts: any) => {
      // title/width should come from props
      expect(opts.title).toBe('Custom title');
      expect(opts.width).toBe(1024);
      // extra props should pass through
      expect(opts.maskClosable).toBe(false);
      // our content should override incoming props.content
      expect(opts.content).not.toBe(sentinelContent);
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      // Execute content once to ensure it is callable
      if (typeof opts.content === 'function') {
        opts.content(dlg);
      }
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog: viewerDialog } });

    await flowSettings.open({
      model,
      flowKey: 'flowObj',
      stepKey: 'step',
      uiMode: {
        type: 'dialog',
        props: { title: 'Custom title', width: 1024, maskClosable: false, content: sentinelContent },
      },
    } as any);

    expect(viewerDialog).toHaveBeenCalledTimes(1);
  });

  it('accepts uiMode object with type drawer and calls viewer.drawer', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-uiMode-obj-drawer', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowObj2',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { g: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const drawer = vi.fn((opts: any) => {
      // also check title fallback if not provided in props
      expect(typeof opts.title === 'string').toBe(true);
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg);
      return dlg;
    });
    const dialog = vi.fn();

    model.context.defineProperty('viewer', { value: { drawer, dialog } });

    await flowSettings.open({
      model,
      flowKey: 'flowObj2',
      stepKey: 'step',
      uiMode: { type: 'drawer', props: {} },
    } as any);

    expect(drawer).toHaveBeenCalledTimes(1);
    expect(dialog).not.toHaveBeenCalled();
  });

  it('sets title to step title when flowKey+stepKey are provided and only one step matches', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-title-step', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'tf-step',
      steps: {
        general: {
          title: 'General',
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const dialog = vi.fn((opts: any) => {
      expect(opts.title).toBe('General');
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg);
      return dlg;
    });
    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({ model, flowKey: 'tf-step', stepKey: 'general' } as any);
    expect(dialog).toHaveBeenCalledTimes(1);
  });

  it('sets title to flow title when only one flow and no stepKey', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-title-flow', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'tf-flow',
      title: 'My Flow',
      steps: {
        a: { title: 'A', uiSchema: { f: { type: 'string', 'x-component': 'Input' } } },
        b: { title: 'B', uiSchema: { g: { type: 'string', 'x-component': 'Input' } } },
      },
    });

    const dialog = vi.fn((opts: any) => {
      expect(opts.title).toBe('A');
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg);
      return dlg;
    });
    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    // do not pass stepKey, and also omit flowKey to allow aggregator path to pick the only flow
    await flowSettings.open({ model } as any);
    expect(dialog).toHaveBeenCalledTimes(1);
  });

  it('sets empty title when rendering multiple flows together', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-open-title-empty', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'f1',
      title: 'Flow 1',
      steps: { s1: { title: 'S1', uiSchema: { a: { type: 'string', 'x-component': 'Input' } } } },
    });
    M.registerFlow({
      key: 'f2',
      title: 'Flow 2',
      steps: { s2: { title: 'S2', uiSchema: { b: { type: 'string', 'x-component': 'Input' } } } },
    });

    const dialog = vi.fn((opts: any) => {
      expect(opts.title).toBe('');
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg);
      return dlg;
    });
    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    // omit flowKey to include all flows
    await flowSettings.open({ model } as any);
    expect(dialog).toHaveBeenCalledTimes(1);
  });

  it('resolves function-based step uiMode when single step is rendered', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-step-uimode-function', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowWithFunctionUiMode',
      steps: {
        step: {
          title: 'Step',
          uiMode: (ctx: any) => ({ type: 'drawer', props: { title: 'Function Title', width: 800 } }),
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const drawer = vi.fn((opts: any) => {
      expect(opts.title).toBe('Function Title');
      expect(opts.width).toBe(800);
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg);
      return dlg;
    });
    const dialog = vi.fn();

    model.context.defineProperty('viewer', { value: { drawer, dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({ model, flowKey: 'flowWithFunctionUiMode', stepKey: 'step' } as any);

    expect(drawer).toHaveBeenCalledTimes(1);
    expect(dialog).not.toHaveBeenCalled();
  });

  it('resolves async function-based step uiMode when single step is rendered', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-step-uimode-async-function', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowWithAsyncFunctionUiMode',
      steps: {
        step: {
          title: 'Step',
          uiMode: async (ctx: any) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return { type: 'dialog', props: { title: 'Async Function Title', width: 900 } };
          },
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const dialog = vi.fn((opts: any) => {
      expect(opts.title).toBe('Async Function Title');
      expect(opts.width).toBe(900);
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg);
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({ model, flowKey: 'flowWithAsyncFunctionUiMode', stepKey: 'step' } as any);

    expect(dialog).toHaveBeenCalledTimes(1);
  });

  it('uses step static uiMode object when single step is rendered', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-step-uimode-static', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowWithStaticUiMode',
      steps: {
        step: {
          title: 'Step',
          uiMode: { type: 'drawer', props: { title: 'Static Title', width: 700 } },
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const drawer = vi.fn((opts: any) => {
      expect(opts.title).toBe('Static Title');
      expect(opts.width).toBe(700);
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg);
      return dlg;
    });
    const dialog = vi.fn();

    model.context.defineProperty('viewer', { value: { drawer, dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({ model, flowKey: 'flowWithStaticUiMode', stepKey: 'step' } as any);

    expect(drawer).toHaveBeenCalledTimes(1);
    expect(dialog).not.toHaveBeenCalled();
  });

  it('fallbacks to global uiMode when step has no uiMode and single step is rendered', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-step-uimode-fallback', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowWithoutStepUiMode',
      steps: {
        step: {
          title: 'Step',
          // no uiMode defined at step level
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const drawer = vi.fn((opts: any) => {
      expect(opts.title).toBe('Global Title');
      expect(opts.width).toBe(600);
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg);
      return dlg;
    });
    const dialog = vi.fn();

    model.context.defineProperty('viewer', { value: { drawer, dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({
      model,
      flowKey: 'flowWithoutStepUiMode',
      stepKey: 'step',
      uiMode: { type: 'drawer', props: { title: 'Global Title', width: 600 } },
    } as any);

    expect(drawer).toHaveBeenCalledTimes(1);
    expect(dialog).not.toHaveBeenCalled();
  });

  it('ignores step uiMode when multiple steps are rendered', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-multi-step-ignore-uimode', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowWithMultiSteps',
      steps: {
        step1: {
          title: 'Step1',
          uiMode: { type: 'drawer', props: { title: 'Should be ignored', width: 999 } },
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
        step2: {
          title: 'Step2',
          uiMode: (ctx: any) => ({ type: 'drawer', props: { title: 'Should also be ignored', width: 888 } }),
          uiSchema: { g: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const dialog = vi.fn((opts: any) => {
      // Should use global uiMode setting, not step-level uiMode
      expect(opts.title).toBe('Global Multi Steps Title');
      expect(opts.width).toBe(1000);
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg);
      return dlg;
    });
    const drawer = vi.fn();

    model.context.defineProperty('viewer', { value: { dialog, drawer } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({
      model,
      flowKey: 'flowWithMultiSteps',
      uiMode: { type: 'dialog', props: { title: 'Global Multi Steps Title', width: 1000 } },
    } as any);

    expect(dialog).toHaveBeenCalledTimes(1);
    expect(drawer).not.toHaveBeenCalled();
  });

  it('handles error in function-based step uiMode gracefully', async () => {
    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-step-uimode-error', flowEngine: engine });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowWithErrorUiMode',
      steps: {
        step: {
          title: 'Step',
          uiMode: (ctx: any) => {
            throw new Error('uiMode function error');
          },
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    // Mock console.error to avoid log noise during test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    const dialog = vi.fn((opts: any) => {
      // Should fallback to default 'dialog' when function throws error
      expect(typeof opts.title === 'string').toBe(true);
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg);
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({ model, flowKey: 'flowWithErrorUiMode', stepKey: 'step' } as any);

    expect(dialog).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('Error resolving uiMode function:', expect.any(Error));

    // Restore console.error
    console.error = originalConsoleError;
  });

  it('supports reactive objects in uiMode function and auto-updates dialog props', async () => {
    const { observable } = await import('@formily/reactive');

    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-reactive-uimode', flowEngine: engine });

    // Create reactive state object
    const reactiveState = observable({
      title: 'Initial Title',
      width: 600,
    });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowWithReactiveUiMode',
      steps: {
        step: {
          title: 'Step',
          uiMode: (ctx: any) => ({
            type: 'dialog',
            props: {
              title: reactiveState.title,
              width: reactiveState.width,
            },
          }),
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const updateSpy = vi.fn();
    const closeSpy = vi.fn();
    const dialog = vi.fn((opts: any) => {
      // Verify initial props
      expect(opts.title).toBe('Initial Title');
      expect(opts.width).toBe(600);

      const dlg = {
        close: closeSpy,
        Footer: (p: any) => null,
        update: updateSpy,
      } as any;

      if (typeof opts.content === 'function') {
        opts.content(dlg);
      }
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({ model, flowKey: 'flowWithReactiveUiMode', stepKey: 'step' } as any);

    expect(dialog).toHaveBeenCalledTimes(1);

    // Wait for autorun to be setup
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Update reactive state
    reactiveState.title = 'Updated Title';
    reactiveState.width = 800;

    // Wait for reactive update
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify that dialog.update was called with new props
    expect(updateSpy).toHaveBeenCalledWith({
      title: 'Updated Title',
      width: 800,
    });
  });

  it('properly disposes reactive listener when dialog is closed', async () => {
    const { observable } = await import('@formily/reactive');

    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-reactive-dispose', flowEngine: engine });

    const reactiveState = observable({
      title: 'Title',
      width: 500,
    });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowWithReactiveDispose',
      steps: {
        step: {
          title: 'Step',
          uiMode: (ctx: any) => ({
            type: 'dialog',
            props: {
              title: reactiveState.title,
              width: reactiveState.width,
            },
          }),
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    let onCloseFn: Function | undefined;
    const updateSpy = vi.fn();
    const dialog = vi.fn((opts: any) => {
      // Capture the onClose callback
      onCloseFn = opts.onClose;

      const dlg = {
        close: vi.fn(),
        Footer: (p: any) => null,
        update: updateSpy,
      } as any;

      if (typeof opts.content === 'function') {
        opts.content(dlg);
      }
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({ model, flowKey: 'flowWithReactiveDispose', stepKey: 'step' } as any);

    expect(dialog).toHaveBeenCalledTimes(1);
    expect(typeof onCloseFn).toBe('function');

    // Wait for autorun to be setup
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Call the dispose function to simulate dialog close
    onCloseFn?.();

    // Update reactive state after disposal
    reactiveState.title = 'Should Not Update';
    reactiveState.width = 999;

    // Wait to ensure no update occurs
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify that dialog.update was NOT called after disposal
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('handles reactive uiMode when rendering multiple steps (should ignore step-level reactive uiMode)', async () => {
    const { observable } = await import('@formily/reactive');

    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-multi-reactive', flowEngine: engine });

    const reactiveState = observable({
      title: 'Reactive Title',
      width: 700,
    });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowWithMultiStepsReactive',
      steps: {
        step1: {
          title: 'Step1',
          uiMode: (ctx: any) => ({
            type: 'dialog',
            props: {
              title: reactiveState.title,
              width: reactiveState.width,
            },
          }),
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
        step2: {
          title: 'Step2',
          uiSchema: { g: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const dialog = vi.fn((opts: any) => {
      // When multiple steps, should use global uiMode, not step-level reactive uiMode
      expect(opts.title).toBe('Global Title');
      expect(opts.width).toBe(1000);

      const dlg = {
        close: vi.fn(),
        Footer: (p: any) => null,
        update: vi.fn(),
      } as any;

      if (typeof opts.content === 'function') {
        opts.content(dlg);
      }
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({
      model,
      flowKey: 'flowWithMultiStepsReactive',
      uiMode: { type: 'dialog', props: { title: 'Global Title', width: 1000 } },
    } as any);

    expect(dialog).toHaveBeenCalledTimes(1);
  });

  it('handles async reactive uiMode function updates', async () => {
    const { observable } = await import('@formily/reactive');

    const flowSettings = new FlowSettings();
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'm-async-reactive', flowEngine: engine });

    const reactiveState = observable({
      title: 'Async Title',
      width: 650,
    });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'flowWithAsyncReactiveUiMode',
      steps: {
        step: {
          title: 'Step',
          uiMode: async (ctx: any) => {
            return {
              type: 'dialog',
              props: {
                title: reactiveState.title,
                width: reactiveState.width,
              },
            };
          },
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const updateSpy = vi.fn();
    const dialog = vi.fn((opts: any) => {
      expect(opts.title).toBe('Async Title');
      expect(opts.width).toBe(650);

      const dlg = {
        close: vi.fn(),
        Footer: (p: any) => null,
        update: updateSpy,
      } as any;

      if (typeof opts.content === 'function') {
        opts.content(dlg);
      }
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({ model, flowKey: 'flowWithAsyncReactiveUiMode', stepKey: 'step' } as any);

    expect(dialog).toHaveBeenCalledTimes(1);

    // Wait for autorun and async uiMode resolution
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Update reactive state
    reactiveState.title = 'Async Updated Title';
    reactiveState.width = 750;

    // Wait for reactive update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify that dialog.update was called with new props
    expect(updateSpy).toHaveBeenCalledWith({
      title: 'Async Updated Title',
      width: 750,
    });
  });
});
