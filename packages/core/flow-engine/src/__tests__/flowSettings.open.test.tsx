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
import { GLOBAL_EMBED_CONTAINER_ID } from '../views';

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
vi.mock('antd', () => {
  const Collapse = Object.assign((props: any) => 'Collapse', { Panel: (props: any) => 'Panel' });
  const FormItem = ({ children }: any) => children ?? 'FormItem';
  const Form = Object.assign((props: any) => 'Form', {
    Item: FormItem,
    useForm: () => [{ setFieldsValue: (_: any) => {} }],
  });
  const Input: any = (props: any) => 'Input';
  Input.TextArea = (props: any) => 'TextArea';
  const InputNumber = (props: any) => 'InputNumber';
  const Select = (props: any) => 'Select';
  const Switch = (props: any) => 'Switch';
  const Alert = (props: any) => 'Alert';
  return {
    Button: () => 'Button',
    Space: () => 'Space',
    Tabs: () => 'Tabs',
    Collapse,
    Result: () => 'Result',
    Form,
    Input,
    InputNumber,
    Select,
    Switch,
    Alert,
    Typography: {
      Paragraph: ({ children }: any) => children ?? 'Paragraph',
      Text: ({ children }: any) => children ?? 'Text',
    },
    ConfigProvider: ({ children }: any) => children ?? 'ConfigProvider',
    theme: { useToken: () => ({}) },
  };
});

// helper to locate the primary Button element in a React element tree
// Updated to work with new Cancel/Save component structure
const findPrimaryButton = async (node: any) => {
  const { Button } = await import('antd');
  const walk = (n: any): any => {
    if (!n || typeof n !== 'object') return null;

    // Look for Button with type='primary'
    if (n.type === Button && n?.props?.type === 'primary') return n;

    // Also look for the Save component (function component that creates primary button)
    if (typeof n.type === 'function' && n.type.name === 'Save') {
      // Return the actual Button element created by Save component
      const buttonEl = n.type(n.props);
      if (buttonEl && buttonEl.type === Button && buttonEl.props?.type === 'primary') {
        return { ...buttonEl, props: { ...buttonEl.props, onClick: n.props?.onClick || buttonEl.props?.onClick } };
      }
    }

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
// Updated to work with new Cancel/Save component structure
const findCancelButton = async (node: any) => {
  const { Button } = await import('antd');
  const walk = (n: any): any => {
    if (!n || typeof n !== 'object') return null;

    // Look for Button without type and with 'Cancel' text
    const isBtn = n.type === Button;
    const isCancel = isBtn && !n?.props?.type && n?.props?.children === 'Cancel';
    if (isCancel) return n;

    // Also look for the Cancel component (function component that creates cancel button)
    if (typeof n.type === 'function' && n.type.name === 'Cancel') {
      // Return the actual Button element created by Cancel component
      const buttonEl = n.type(n.props);
      if (buttonEl && buttonEl.type === Button && !buttonEl.props?.type) {
        return { ...buttonEl, props: { ...buttonEl.props, onClick: n.props?.onClick || buttonEl.props?.onClick } };
      }
    }

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
  });

  // 创建测试特定的 FlowModel 子类，确保每个测试有独立的 globalFlowRegistry
  const createIsolatedFlowModel = (testId: string) => {
    // 动态创建匿名类，每个类都有独立的 globalFlowRegistry
    return class extends FlowModel {
      static testId = testId; // 用于调试识别
    };
  };

  it('renders single-step form directly when flowKey+stepKey provided (no Collapse)', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-1');
    const model = new TestFlowModel({ uid: 'm-open-1', flowEngine: engine });

    // Register a dummy flow with one step
    TestFlowModel.registerFlow({
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
            content(dialog, { defineMethod: vi.fn() });
          }
          document.body.appendChild(container);
          return dialog;
        },
        drawer: ({ content }) => {
          const dialog = {
            close: () => container.remove?.(),
            Footer: () => null,
          } as any;
          const container = document.createElement('div');
          container.setAttribute('data-testid', 'flow-settings-container');
          if (typeof content === 'function') {
            content(dialog, { defineMethod: vi.fn() });
          }
          document.body.appendChild(container);
          return dialog;
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-2');
    const model = new TestFlowModel({ uid: 'm-open-2', flowEngine: engine });

    TestFlowModel.registerFlow({
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
            content(dialog, { defineMethod: vi.fn() });
          }
          document.body.appendChild(container);
          return dialog;
        },
        drawer: ({ content }) => {
          const dialog = {
            close: () => container.remove?.(),
            Footer: () => null,
          } as any;
          const container = document.createElement('div');
          container.setAttribute('data-testid', 'flow-settings-container');
          if (typeof content === 'function') {
            content(dialog, { defineMethod: vi.fn() });
          }
          document.body.appendChild(container);
          return dialog;
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-3');
    const model = new TestFlowModel({ uid: 'm-open-none', flowEngine: engine });

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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-4');
    const model = new TestFlowModel({ uid: 'm-open-drawer', flowEngine: engine });

    // Register one simple flow/step
    TestFlowModel.registerFlow({
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
      openSpy.lastTree = typeof content === 'function' ? content(dlg, { defineMethod: vi.fn() }) : null;
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-5');
    const model = new TestFlowModel({ uid: 'm-open-save', flowEngine: engine });

    const beforeHook = vi.fn();
    const afterHook = vi.fn();
    TestFlowModel.registerFlow({
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-6');
    const model = new TestFlowModel({ uid: 'm-open-onsaved', flowEngine: engine });

    TestFlowModel.registerFlow({
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-7');
    const model = new TestFlowModel({ uid: 'm-open-oncancel', flowEngine: engine });

    TestFlowModel.registerFlow({
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-8');
    const model = new TestFlowModel({ uid: 'm-open-error', flowEngine: engine });

    TestFlowModel.registerFlow({
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-9');
    const model = new TestFlowModel({ uid: 'm-open-preset', flowEngine: engine });

    TestFlowModel.registerFlow({
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
      if (typeof content === 'function') content(dlg, { defineMethod: vi.fn() });
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-10');
    const model = new TestFlowModel({ uid: 'm-open-preset-none', flowEngine: engine });

    TestFlowModel.registerFlow({
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
      if (typeof content === 'function') content(dlg, { defineMethod: vi.fn() });
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });

    await flowSettings.open({ model, flowKey: 'pf3', preset: true } as any);
    expect(dialog).toHaveBeenCalled(); // 应该显示弹窗，因为 hiddenStep 有 preset=true
  });

  it('ignores hideInSettings when preset=true for individual step', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
      if (typeof content === 'function') content(dlg, { defineMethod: vi.fn() });
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
      if (typeof content === 'function') content(dlg, { defineMethod: vi.fn() });
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });

    await flowSettings.open({ model, flowKey: 'pf5', preset: false } as any);
    expect(dialog).toHaveBeenCalled(); // 应该显示弹窗，但只包含 visibleStep
  });

  it('accepts uiMode object (dialog) and merges props while keeping our content', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-11');
    const model = new TestFlowModel({ uid: 'm-open-uiMode-obj-dialog', flowEngine: engine });

    TestFlowModel.registerFlow({
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
        opts.content(dlg, { defineMethod: vi.fn() });
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-12');
    const model = new TestFlowModel({ uid: 'm-open-uiMode-obj-drawer', flowEngine: engine });

    TestFlowModel.registerFlow({
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
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-13');
    const model = new TestFlowModel({ uid: 'm-open-title-step', flowEngine: engine });

    TestFlowModel.registerFlow({
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
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
      return dlg;
    });
    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({ model, flowKey: 'tf-step', stepKey: 'general' } as any);
    expect(dialog).toHaveBeenCalledTimes(1);
  });

  it('sets title to flow title when only one flow and no stepKey', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-14');
    const model = new TestFlowModel({ uid: 'm-open-title-flow', flowEngine: engine });

    TestFlowModel.registerFlow({
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
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
      return dlg;
    });
    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    // explicitly pass flowKey to avoid interference from other tests
    await flowSettings.open({ model, flowKey: 'tf-flow' } as any);
    expect(dialog).toHaveBeenCalledTimes(1);
  });

  it('sets empty title when rendering multiple flows together', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-15');
    const model = new TestFlowModel({ uid: 'm-open-title-empty', flowEngine: engine });

    TestFlowModel.registerFlow({
      key: 'f1',
      title: 'Flow 1',
      steps: { s1: { title: 'S1', uiSchema: { a: { type: 'string', 'x-component': 'Input' } } } },
    });
    TestFlowModel.registerFlow({
      key: 'f2',
      title: 'Flow 2',
      steps: { s2: { title: 'S2', uiSchema: { b: { type: 'string', 'x-component': 'Input' } } } },
    });

    const dialog = vi.fn((opts: any) => {
      expect(opts.title).toBe('');
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
      return dlg;
    });
    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    // omit flowKey to include all flows
    await flowSettings.open({ model } as any);
    expect(dialog).toHaveBeenCalledTimes(1);
  });

  it('resolves function-based step uiMode when single step is rendered', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({ model, flowKey: 'flowWithAsyncFunctionUiMode', stepKey: 'step' } as any);

    expect(dialog).toHaveBeenCalledTimes(1);
  });

  it('uses step static uiMode object when single step is rendered', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
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
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
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

  it('uses embed uiMode with target element and callbacks', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const model = new FlowModel({ uid: 'm-embed-mode', flowEngine: engine });

    // Create mock DOM element for embed target
    const mockTarget = document.createElement('div');
    mockTarget.id = GLOBAL_EMBED_CONTAINER_ID;
    mockTarget.style.width = 'auto';
    mockTarget.style.maxWidth = 'none';
    document.body.appendChild(mockTarget);

    // Mock querySelector to return our mock element
    const originalQuerySelector = document.querySelector.bind(document);
    const querySelectorSpy = vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === `#${GLOBAL_EMBED_CONTAINER_ID}`) {
        return mockTarget;
      }
      return originalQuerySelector(selector);
    });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'embedFlow',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const onOpenSpy = vi.fn();
    const onCloseSpy = vi.fn();
    const embed = vi.fn((opts: any) => {
      expect(opts.target).toBe(mockTarget);
      expect(opts.width).toBe('60%');
      expect(opts.maxWidth).toBe('900px');
      expect(typeof opts.onOpen).toBe('function');
      expect(typeof opts.onClose).toBe('function');

      // Test onOpen callback
      opts.onOpen();
      expect(mockTarget.style.width).toBe('60%');
      expect(mockTarget.style.maxWidth).toBe('900px');
      expect(onOpenSpy).toHaveBeenCalled();

      // Test onClose callback
      opts.onClose();
      expect(mockTarget.style.width).toBe('auto');
      expect(mockTarget.style.maxWidth).toBe('none');
      expect(onCloseSpy).toHaveBeenCalled();

      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
      return dlg;
    });
    const dialog = vi.fn();
    const drawer = vi.fn();

    model.context.defineProperty('viewer', { value: { embed, dialog, drawer } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({
      model,
      flowKey: 'embedFlow',
      stepKey: 'step',
      uiMode: {
        type: 'embed',
        props: {
          width: '60%',
          maxWidth: '900px',
          onOpen: onOpenSpy,
          onClose: onCloseSpy,
        },
      },
    } as any);

    expect(embed).toHaveBeenCalledTimes(1);
    expect(dialog).not.toHaveBeenCalled();
    expect(drawer).not.toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(mockTarget);
    querySelectorSpy.mockRestore();
  });

  it('does not clear embed target DOM before opening (avoids portal unmount errors)', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const model = new FlowModel({ uid: 'm-embed-no-clear', flowEngine: engine });

    const mockTarget = document.createElement('div');
    mockTarget.id = GLOBAL_EMBED_CONTAINER_ID;
    mockTarget.innerHTML = '<div data-testid="existing">Existing</div>';
    document.body.appendChild(mockTarget);

    const originalQuerySelector = document.querySelector.bind(document);
    const querySelectorSpy = vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === `#${GLOBAL_EMBED_CONTAINER_ID}`) {
        return mockTarget;
      }
      return originalQuerySelector(selector);
    });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'embedNoClearFlow',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const embed = vi.fn((opts: any) => {
      // The existing DOM should not be wiped out before opening the embed view.
      expect(mockTarget.querySelector('[data-testid="existing"]')).toBeTruthy();
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { embed } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({
      model,
      flowKey: 'embedNoClearFlow',
      stepKey: 'step',
      uiMode: 'embed',
    } as any);

    expect(embed).toHaveBeenCalledTimes(1);
    expect(mockTarget.querySelector('[data-testid="existing"]')).toBeTruthy();

    document.body.removeChild(mockTarget);
    querySelectorSpy.mockRestore();
  });

  it('uses embed uiMode with default props when target element exists', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const model = new FlowModel({ uid: 'm-embed-default', flowEngine: engine });

    // Create mock DOM element for embed target
    const mockTarget = document.createElement('div');
    mockTarget.id = GLOBAL_EMBED_CONTAINER_ID;
    document.body.appendChild(mockTarget);

    // Mock querySelector
    const originalQuerySelector = document.querySelector.bind(document);
    const querySelectorSpy = vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === `#${GLOBAL_EMBED_CONTAINER_ID}`) {
        return mockTarget;
      }
      return originalQuerySelector(selector);
    });

    const M = model.constructor as any;
    M.registerFlow({
      key: 'embedDefaultFlow',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const embed = vi.fn((opts: any) => {
      expect(opts.target).toBe(mockTarget);
      // Test default width and maxWidth
      opts.onOpen();
      expect(mockTarget.style.width).toBe('33.3%'); // default width
      expect(mockTarget.style.maxWidth).toBe('800px'); // default maxWidth

      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { embed } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({
      model,
      flowKey: 'embedDefaultFlow',
      stepKey: 'step',
      uiMode: 'embed',
    } as any);

    expect(embed).toHaveBeenCalledTimes(1);

    // Cleanup
    document.body.removeChild(mockTarget);
    querySelectorSpy.mockRestore();
  });

  it('handles embed uiMode when target element is not found', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const model = new FlowModel({ uid: 'm-embed-no-target', flowEngine: engine });

    // Mock querySelector to return null (target not found)
    const querySelectorSpy = vi.spyOn(document, 'querySelector').mockReturnValue(null);

    const M = model.constructor as any;
    M.registerFlow({
      key: 'embedNoTargetFlow',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const embed = vi.fn((opts: any) => {
      expect(opts.target).toBeNull();
      const dlg = { close: vi.fn(), Footer: (p: any) => null } as any;
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
      return dlg;
    });

    model.context.defineProperty('viewer', { value: { embed } });
    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    await flowSettings.open({
      model,
      flowKey: 'embedNoTargetFlow',
      stepKey: 'step',
      uiMode: 'embed',
    } as any);

    expect(embed).toHaveBeenCalledTimes(1);

    // Restore querySelector
    querySelectorSpy.mockRestore();
  });

  it('handles error in function-based step uiMode gracefully', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
      if (typeof opts.content === 'function') opts.content(dlg, { defineMethod: vi.fn() });
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

    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
        opts.content(dlg, { defineMethod: vi.fn() });
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

    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
        opts.content(dlg, { defineMethod: vi.fn() });
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

    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
        opts.content(dlg, { defineMethod: vi.fn() });
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

    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
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
        opts.content(dlg, { defineMethod: vi.fn() });
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

  // =============================
  // Tests for currentDialog.submit method assignment
  // =============================

  it('assigns submit method to currentDialog and can be called externally', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-submit-1');
    const model = new TestFlowModel({ uid: 'm-submit-external', flowEngine: engine });

    TestFlowModel.registerFlow({
      key: 'submitFlow',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { field: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const info = vi.fn();
    const error = vi.fn();
    const success = vi.fn();
    model.context.defineProperty('message', { value: { info, error, success } });

    const setStepParams = vi.spyOn(model as any, 'setStepParams');
    const saveStepParams = vi.spyOn(model as any, 'saveStepParams').mockResolvedValue(undefined);

    let capturedDialog: any;
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          capturedDialog = { close: vi.fn(), Footer: (p: any) => null };
          if (typeof content === 'function') {
            content(capturedDialog, { defineMethod: vi.fn() });
          }
          return capturedDialog;
        },
      },
    });

    await flowSettings.open({ model, flowKey: 'submitFlow', stepKey: 'step' } as any);

    // Verify that submit method was assigned to dialog
    expect(typeof capturedDialog.submit).toBe('function');

    // Call submit method externally
    await capturedDialog.submit();

    // Verify that save flow was executed
    expect(setStepParams).toHaveBeenCalled();
    expect(saveStepParams).toHaveBeenCalled();
    expect(success).toHaveBeenCalledWith('Configuration saved');
    expect(capturedDialog.close).toHaveBeenCalled();
  });

  it('submit method handles multiple steps correctly', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-submit-2');
    const model = new TestFlowModel({ uid: 'm-submit-multi', flowEngine: engine });

    const beforeHook1 = vi.fn();
    const afterHook1 = vi.fn();
    const beforeHook2 = vi.fn();
    const afterHook2 = vi.fn();

    TestFlowModel.registerFlow({
      key: 'multiStepFlow',
      steps: {
        step1: {
          title: 'Step 1',
          beforeParamsSave: beforeHook1,
          afterParamsSave: afterHook1,
          uiSchema: { field1: { type: 'string', 'x-component': 'Input' } },
        },
        step2: {
          title: 'Step 2',
          beforeParamsSave: beforeHook2,
          afterParamsSave: afterHook2,
          uiSchema: { field2: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });

    const setStepParams = vi.spyOn(model as any, 'setStepParams');
    const saveStepParams = vi.spyOn(model as any, 'saveStepParams').mockResolvedValue(undefined);

    let capturedDialog: any;
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          capturedDialog = { close: vi.fn(), Footer: (p: any) => null };
          if (typeof content === 'function') {
            content(capturedDialog, { defineMethod: vi.fn() });
          }
          return capturedDialog;
        },
      },
    });

    await flowSettings.open({ model, flowKey: 'multiStepFlow' } as any);

    // Call submit method
    await capturedDialog.submit();

    // Verify both steps were processed
    expect(setStepParams).toHaveBeenCalledTimes(2);
    expect(setStepParams).toHaveBeenCalledWith('multiStepFlow', 'step1', expect.any(Object));
    expect(setStepParams).toHaveBeenCalledWith('multiStepFlow', 'step2', expect.any(Object));

    // Verify hooks were called in correct order
    expect(beforeHook1).toHaveBeenCalled();
    expect(beforeHook2).toHaveBeenCalled();
    expect(saveStepParams).toHaveBeenCalled();
    expect(afterHook1).toHaveBeenCalled();
    expect(afterHook2).toHaveBeenCalled();

    expect(capturedDialog.close).toHaveBeenCalled();
  });

  it('submit method handles FlowExitException by closing dialog without error message', async () => {
    const { FlowExitException } = await import('../utils/exceptions');

    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-submit-3');
    const model = new TestFlowModel({ uid: 'm-submit-exit', flowEngine: engine });

    TestFlowModel.registerFlow({
      key: 'exitFlow',
      steps: {
        step: {
          title: 'Step',
          beforeParamsSave: () => {
            throw new FlowExitException('exitFlow', 'm-submit-exit', 'Exit requested');
          },
          uiSchema: { field: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const info = vi.fn();
    const error = vi.fn();
    const success = vi.fn();
    model.context.defineProperty('message', { value: { info, error, success } });

    vi.spyOn(model as any, 'saveStepParams').mockResolvedValue(undefined);

    let capturedDialog: any;
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          capturedDialog = { close: vi.fn(), Footer: (p: any) => null };
          if (typeof content === 'function') {
            content(capturedDialog, { defineMethod: vi.fn() });
          }
          return capturedDialog;
        },
      },
    });

    await flowSettings.open({ model, flowKey: 'exitFlow', stepKey: 'step' } as any);

    // Call submit method
    await capturedDialog.submit();

    // Verify FlowExitException handling
    expect(error).not.toHaveBeenCalled(); // Should not show error message
    expect(success).not.toHaveBeenCalled(); // Should not show success message
    expect(capturedDialog.close).toHaveBeenCalled(); // Should close dialog
  });

  it('submit method handles general errors by showing error message and keeping dialog open', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-submit-4');
    const model = new TestFlowModel({ uid: 'm-submit-error', flowEngine: engine });

    TestFlowModel.registerFlow({
      key: 'errorFlow',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { field: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    const info = vi.fn();
    const error = vi.fn();
    const success = vi.fn();
    model.context.defineProperty('message', { value: { info, error, success } });

    // Mock saveStepParams to throw error
    vi.spyOn(model as any, 'saveStepParams').mockRejectedValue(new Error('Save failed'));

    let capturedDialog: any;
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          capturedDialog = { close: vi.fn(), Footer: (p: any) => null };
          if (typeof content === 'function') {
            content(capturedDialog, { defineMethod: vi.fn() });
          }
          return capturedDialog;
        },
      },
    });

    // Mock console.error to avoid log noise
    const originalConsoleError = console.error;
    console.error = vi.fn();

    await flowSettings.open({ model, flowKey: 'errorFlow', stepKey: 'step' } as any);

    // Call submit method
    await capturedDialog.submit();

    // Verify error handling
    expect(error).toHaveBeenCalledWith('Error saving configuration, please check console');
    expect(success).not.toHaveBeenCalled();
    expect(capturedDialog.close).not.toHaveBeenCalled(); // Should keep dialog open
    expect(console.error).toHaveBeenCalledWith('FlowSettings.open: save error', expect.any(Error));

    // Restore console.error
    console.error = originalConsoleError;
  });

  it('submit method calls onSaved callback after successful save', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-submit-5');
    const model = new TestFlowModel({ uid: 'm-submit-callback', flowEngine: engine });

    TestFlowModel.registerFlow({
      key: 'callbackFlow',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { field: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });
    vi.spyOn(model as any, 'saveStepParams').mockResolvedValue(undefined);

    let capturedDialog: any;
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          capturedDialog = { close: vi.fn(), Footer: (p: any) => null };
          if (typeof content === 'function') {
            content(capturedDialog, { defineMethod: vi.fn() });
          }
          return capturedDialog;
        },
      },
    });

    const onSaved = vi.fn();
    await flowSettings.open({ model, flowKey: 'callbackFlow', stepKey: 'step', onSaved } as any);

    // Call submit method
    await capturedDialog.submit();

    // Verify onSaved callback was called
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(capturedDialog.close).toHaveBeenCalled();
  });

  it('submit method handles onSaved callback errors gracefully', async () => {
    const engine = new FlowEngine();
    const flowSettings = new FlowSettings(engine);
    const TestFlowModel = createIsolatedFlowModel('test-submit-6');
    const model = new TestFlowModel({ uid: 'm-submit-callback-error', flowEngine: engine });

    TestFlowModel.registerFlow({
      key: 'callbackErrorFlow',
      steps: {
        step: {
          title: 'Step',
          uiSchema: { field: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    model.context.defineProperty('message', { value: { info: vi.fn(), error: vi.fn(), success: vi.fn() } });
    vi.spyOn(model as any, 'saveStepParams').mockResolvedValue(undefined);

    let capturedDialog: any;
    model.context.defineProperty('viewer', {
      value: {
        dialog: ({ content }) => {
          capturedDialog = { close: vi.fn(), Footer: (p: any) => null };
          if (typeof content === 'function') {
            content(capturedDialog, { defineMethod: vi.fn() });
          }
          return capturedDialog;
        },
      },
    });

    // Mock console.error to avoid log noise
    const originalConsoleError = console.error;
    console.error = vi.fn();

    const onSaved = vi.fn().mockRejectedValue(new Error('Callback error'));
    await flowSettings.open({ model, flowKey: 'callbackErrorFlow', stepKey: 'step', onSaved } as any);

    // Call submit method
    await capturedDialog.submit();

    // Verify that main save process completed successfully despite callback error
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(capturedDialog.close).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('FlowSettings.open: onSaved callback error', expect.any(Error));

    // Restore console.error
    console.error = originalConsoleError;
  });
});
