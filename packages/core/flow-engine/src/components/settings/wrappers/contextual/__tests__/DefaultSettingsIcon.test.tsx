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
import { render, cleanup, waitFor, act } from '@testing-library/react';
import { App, ConfigProvider } from 'antd';

import { FlowEngine } from '../../../../../flowEngine';
import { FlowModel } from '../../../../../models/flowModel';
import { DefaultSettingsIcon } from '../DefaultSettingsIcon';

// ---- Mock antd to capture Dropdown menu props ----
const dropdownMenus: any[] = [];
vi.mock('antd', async (importOriginal) => {
  const Dropdown = (props: any) => {
    (globalThis as any).__lastDropdownMenu = props.menu;
    dropdownMenus.push(props.menu);
    return React.createElement('span', { 'data-testid': 'dropdown' }, props.children);
  };

  const App = Object.assign(({ children }: any) => React.createElement(React.Fragment, null, children), {
    useApp: () => ({ message: { success: () => {}, error: () => {}, info: () => {} } }),
  });

  const ConfigProvider = ({ children }: any) => React.createElement(React.Fragment, null, children);
  const Modal = {
    confirm: (opts: any) => {
      if (opts && typeof opts.onOk === 'function') return opts.onOk();
    },
    error: vi.fn(),
  };
  const Typography = {
    Paragraph: ({ children }: any) => React.createElement('p', null, children ?? 'Paragraph'),
    Text: ({ children }: any) => React.createElement('span', null, children ?? 'Text'),
  };
  const Collapse = Object.assign((props: any) => React.createElement('div', null, props.children ?? 'Collapse'), {
    Panel: (props: any) => React.createElement('div', null, props.children ?? 'Panel'),
  });
  const Space = ({ children }: any) => React.createElement('div', null, children);
  const FormItem = (props: any) => React.createElement('div', null, props.children ?? 'FormItem');
  const Form = Object.assign((props: any) => React.createElement('form', null, props.children ?? 'Form'), {
    Item: FormItem,
    useForm: () => [{ setFieldsValue: (_: any) => {} }],
  });
  const Input: any = (props: any) => React.createElement('input', props);
  Input.TextArea = (props: any) => React.createElement('textarea', props);
  const InputNumber = (props: any) => React.createElement('input', { ...props, type: 'number' });
  const Select = (props: any) => React.createElement('select', props);
  const Switch = (props: any) => React.createElement('input', { ...props, type: 'checkbox' });
  const Alert = (props: any) => React.createElement('div', { role: 'alert' }, props.message ?? 'Alert');
  const Button = (props: any) => React.createElement('button', props, props.children ?? 'Button');
  const Result = (props: any) => React.createElement('div', null, props.children ?? 'Result');

  // Keep other components from original mock/default
  return {
    Dropdown,
    App,
    ConfigProvider,
    Modal,
    Typography,
    Collapse,
    Space,
    Form,
    Input,
    InputNumber,
    Select,
    Switch,
    Alert,
    Button,
    Result,
    theme: { useToken: () => ({}) },
  };
});

describe('DefaultSettingsIcon - only static flows are shown', () => {
  beforeEach(() => {
    dropdownMenus.length = 0;
    (globalThis as any).__lastDropdownMenu = undefined;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('excludes instance (dynamic) flows from the settings menu', async () => {
    class TestFlowModel extends FlowModel {}

    const engine = new FlowEngine();
    const model = new TestFlowModel({ uid: 'model-static-only', flowEngine: engine });

    // register one static flow with a visible step
    TestFlowModel.registerFlow({
      key: 'static1',
      title: 'Static Flow',
      steps: {
        general: {
          title: 'General',
          uiSchema: {
            field: { type: 'string', 'x-component': 'Input' },
          },
        },
      },
    });

    // add a dynamic (instance) flow which should NOT appear in menu
    model.flowRegistry.addFlow('dyn1', {
      title: 'Dynamic Flow',
      steps: {
        general: {
          title: 'General (Dyn)',
          uiSchema: {
            field: { type: 'string', 'x-component': 'Input' },
          },
        },
      },
    });

    render(
      React.createElement(
        ConfigProvider as any,
        null,
        React.createElement(
          App as any,
          null,
          React.createElement(DefaultSettingsIcon as any, {
            model,
            // 关闭常用操作，避免干扰断言
            showDeleteButton: false,
            showCopyUidButton: false,
          }),
        ),
      ),
    );

    // 等待菜单渲染完成，并且只包含静态流的步骤
    await waitFor(() => {
      const menu = (globalThis as any).__lastDropdownMenu;
      expect(menu).toBeTruthy();
      const items = (menu?.items || []) as any[];
      const keys = items.map((it) => String(it.key || ''));
      expect(keys.some((k) => k.startsWith('static1:'))).toBe(true);
      expect(keys.some((k) => k.startsWith('dyn1:'))).toBe(false);
    });

    const menu = (globalThis as any).__lastDropdownMenu;
    const items = (menu?.items || []) as any[];

    // 静态流的 step 存在（key: `${flowKey}:${stepKey}`），动态流 step 不存在
    expect(items.some((it) => String(it.key || '').startsWith('static1:'))).toBe(true);
    expect(items.some((it) => String(it.key || '').startsWith('dyn1:'))).toBe(false);
  });

  it('filters out steps with hideInSettings and keeps visible ones', async () => {
    class TestFlowModel extends FlowModel {}
    const engine = new FlowEngine();
    const model = new TestFlowModel({ uid: 'm-hide', flowEngine: engine });

    TestFlowModel.registerFlow({
      key: 'flowA',
      title: 'Flow A',
      steps: {
        hidden: { title: 'Hidden', hideInSettings: true, uiSchema: { a: { type: 'string', 'x-component': 'Input' } } },
        visible: { title: 'Visible', uiSchema: { b: { type: 'string', 'x-component': 'Input' } } },
      },
    });

    render(
      React.createElement(
        ConfigProvider as any,
        null,
        React.createElement(App as any, null, React.createElement(DefaultSettingsIcon as any, { model })),
      ),
    );

    await waitFor(() => {
      const menu = (globalThis as any).__lastDropdownMenu;
      const items = (menu?.items || []) as any[];
      expect(items.some((it) => String(it.key || '') === 'flowA:visible')).toBe(true);
      expect(items.some((it) => String(it.key || '') === 'flowA:hidden')).toBe(false);
    });
  });

  it('includes step when uiSchema provided by action (step.use)', async () => {
    class TestFlowModel extends FlowModel {}
    const engine = new FlowEngine();
    const model = new TestFlowModel({ uid: 'm-action', flowEngine: engine });

    // Step has no uiSchema but uses an action that provides uiSchema
    TestFlowModel.registerFlow({
      key: 'flowB',
      title: 'Flow B',
      steps: {
        useAction: { title: 'Use Action', use: 'act' },
      },
    });

    // Stub getAction to provide uiSchema
    (model as any).getAction = vi.fn().mockReturnValue({
      name: 'act',
      title: 'Action Title',
      uiSchema: { x: { type: 'string', 'x-component': 'Input' } },
    });

    render(
      React.createElement(
        ConfigProvider as any,
        null,
        React.createElement(App as any, null, React.createElement(DefaultSettingsIcon as any, { model })),
      ),
    );

    await waitFor(() => {
      const menu = (globalThis as any).__lastDropdownMenu;
      const items = (menu?.items || []) as any[];
      expect(items.some((it) => String(it.key || '') === 'flowB:useAction')).toBe(true);
    });
  });

  it('clicking a step item opens flow settings with correct args', async () => {
    class TestFlowModel extends FlowModel {}
    const engine = new FlowEngine();
    const model = new TestFlowModel({ uid: 'm-open', flowEngine: engine });
    const openSpy = vi.spyOn(model, 'openFlowSettings').mockResolvedValue(undefined as any);

    TestFlowModel.registerFlow({
      key: 'flowC',
      title: 'Flow C',
      steps: {
        general: { title: 'General', uiSchema: { f: { type: 'string', 'x-component': 'Input' } } },
      },
    });

    render(
      React.createElement(
        ConfigProvider as any,
        null,
        React.createElement(App as any, null, React.createElement(DefaultSettingsIcon as any, { model })),
      ),
    );

    await waitFor(() => {
      expect((globalThis as any).__lastDropdownMenu).toBeTruthy();
    });
    const menu = (globalThis as any).__lastDropdownMenu;
    menu.onClick?.({ key: 'flowC:general' });
    expect(openSpy).toHaveBeenCalledWith({ flowKey: 'flowC', stepKey: 'general' });
  });

  it('copy UID action writes model uid to clipboard', async () => {
    class TestFlowModel extends FlowModel {}
    const engine = new FlowEngine();
    const model = new TestFlowModel({ uid: 'm-copy', flowEngine: engine });

    TestFlowModel.registerFlow({
      key: 'flowD',
      title: 'Flow D',
      steps: { s: { title: 'S', uiSchema: { f: { type: 'string', 'x-component': 'Input' } } } },
    });

    // mock clipboard
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    render(
      React.createElement(
        ConfigProvider as any,
        null,
        React.createElement(App as any, null, React.createElement(DefaultSettingsIcon as any, { model })),
      ),
    );

    await waitFor(() => {
      expect((globalThis as any).__lastDropdownMenu).toBeTruthy();
    });
    const menu = (globalThis as any).__lastDropdownMenu;
    menu.onClick?.({ key: 'copy-uid' });
    expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith('m-copy');
  });

  it('delete action calls model.destroy()', async () => {
    class TestFlowModel extends FlowModel {}
    const engine = new FlowEngine();
    const model = new TestFlowModel({ uid: 'm-del', flowEngine: engine });
    const destroySpy = vi.spyOn(model, 'destroy').mockResolvedValue(undefined as any);

    TestFlowModel.registerFlow({
      key: 'flowE',
      title: 'Flow E',
      steps: { s: { title: 'S', uiSchema: { f: { type: 'string', 'x-component': 'Input' } } } },
    });

    render(
      React.createElement(
        ConfigProvider as any,
        null,
        React.createElement(App as any, null, React.createElement(DefaultSettingsIcon as any, { model })),
      ),
    );

    await waitFor(() => {
      expect((globalThis as any).__lastDropdownMenu).toBeTruthy();
    });
    const menu = (globalThis as any).__lastDropdownMenu;
    menu.onClick?.({ key: 'delete' });
    expect(destroySpy).toHaveBeenCalled();
  });

  it('shows sub-model steps with modelKey when flattenSubMenus=false and menuLevels=2', async () => {
    class Parent extends FlowModel {}
    class Child extends FlowModel {}
    const engine = new FlowEngine();
    const parent = new Parent({ uid: 'parent-1', flowEngine: engine });
    const child = new Child({ uid: 'child-1', flowEngine: engine });

    // child static flow
    Child.registerFlow({
      key: 'childFlow',
      title: 'Child Flow',
      steps: { cstep: { title: 'C', uiSchema: { x: { type: 'string', 'x-component': 'Input' } } } },
    });

    parent.addSubModel('items', child);

    render(
      React.createElement(
        ConfigProvider as any,
        null,
        React.createElement(
          App as any,
          null,
          React.createElement(DefaultSettingsIcon as any, {
            model: parent,
            menuLevels: 2,
            flattenSubMenus: false,
          }),
        ),
      ),
    );

    await waitFor(() => {
      const menu = (globalThis as any).__lastDropdownMenu;
      expect(menu).toBeTruthy();
      const items = (menu?.items || []) as any[];
      const subMenu = items.find((it) => Array.isArray(it?.children));
      expect(subMenu).toBeTruthy();
      expect(subMenu!.children.some((it: any) => String(it.key).startsWith('items[0]:childFlow:cstep'))).toBe(true);
    });
  });

  it('adds "Copy popup UID" for popupSettings openView step (current model and sub-model)', async () => {
    class Parent extends FlowModel {}
    class Child extends FlowModel {}
    const engine = new FlowEngine();
    const parent = new Parent({ uid: 'parent-2', flowEngine: engine });
    const child = new Child({ uid: 'child-2', flowEngine: engine });

    // current model popupSettings
    Parent.registerFlow({
      key: 'popupSettings',
      title: 'Popup',
      steps: { openView: { title: 'Open view', uiSchema: { a: { type: 'string', 'x-component': 'Input' } } } },
    });
    // sub model popupSettings
    Child.registerFlow({
      key: 'popupSettings',
      title: 'Popup Child',
      steps: { openView: { title: 'Open view', uiSchema: { a: { type: 'string', 'x-component': 'Input' } } } },
    });
    parent.addSubModel('items', child);

    // mock clipboard
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    render(
      React.createElement(
        ConfigProvider as any,
        null,
        React.createElement(
          App as any,
          null,
          React.createElement(DefaultSettingsIcon as any, {
            model: parent,
            menuLevels: 2,
            flattenSubMenus: true,
          }),
        ),
      ),
    );

    // 等待“Copy popup UID”对应的菜单项出现，避免异步时序导致的偶发失败
    await waitFor(() => {
      const m = (globalThis as any).__lastDropdownMenu;
      const is = (m?.items || []) as any[];
      const current = is.find((it) => String(it.key) === 'copy-pop-uid:popupSettings:openView');
      const sub = is.find((it) => String(it.key).startsWith('copy-pop-uid:items[0]:popupSettings:openView'));
      expect(current).toBeTruthy();
      expect(sub).toBeTruthy();
    });

    // click and verify clipboard（直接使用最新的 menu）
    const menu = (globalThis as any).__lastDropdownMenu;
    menu.onClick?.({ key: 'copy-pop-uid:popupSettings:openView' });
    expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith('parent-2');

    menu.onClick?.({ key: 'copy-pop-uid:items[0]:popupSettings:openView' });
    expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith('child-2');
  });

  it('refreshes menu when current model step params change', async () => {
    class TestFlowModel extends FlowModel {}
    const engine = new FlowEngine();
    const model = new TestFlowModel({
      uid: 'step-params-current',
      flowEngine: engine,
      stepParams: {
        dynamicFlow: { dynamicStep: { hidden: true } },
      },
    });

    TestFlowModel.registerFlow({
      key: 'dynamicFlow',
      title: 'Dynamic Flow',
      steps: {
        dynamicStep: {
          title: 'Dynamic Step',
          hideInSettings: (ctx) => !!ctx.getStepParams('dynamicStep')?.hidden,
          uiSchema: { f: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    render(
      React.createElement(
        ConfigProvider as any,
        null,
        React.createElement(
          App as any,
          null,
          React.createElement(DefaultSettingsIcon as any, {
            model,
            showCopyUidButton: true,
            showDeleteButton: false,
          }),
        ),
      ),
    );

    await waitFor(() => {
      const menu = (globalThis as any).__lastDropdownMenu;
      expect(menu).toBeTruthy();
      const items = (menu?.items || []) as any[];
      expect(items.some((it) => String(it.key || '') === 'dynamicFlow:dynamicStep')).toBe(false);
    });

    await act(async () => {
      model.setStepParams('dynamicFlow', 'dynamicStep', { hidden: false });
    });

    await waitFor(() => {
      const menu = (globalThis as any).__lastDropdownMenu;
      const items = (menu?.items || []) as any[];
      expect(items.some((it) => String(it.key || '') === 'dynamicFlow:dynamicStep')).toBe(true);
    });
  });

  it('refreshes submenu when child model step params change', async () => {
    class ParentModel extends FlowModel {}
    class ChildModel extends FlowModel {}
    const engine = new FlowEngine();
    const child = new ChildModel({
      uid: 'child-step-params',
      flowEngine: engine,
      stepParams: { childFlow: { childStep: { hidden: true } } },
    });
    const parent = new ParentModel({ uid: 'parent-step-params', flowEngine: engine });

    ChildModel.registerFlow({
      key: 'childFlow',
      title: 'Child Flow',
      steps: {
        childStep: {
          title: 'Child Step',
          hideInSettings: (ctx) => !!ctx.getStepParams('childStep')?.hidden,
          uiSchema: { x: { type: 'string', 'x-component': 'Input' } },
        },
      },
    });

    parent.addSubModel('items', child);

    render(
      React.createElement(
        ConfigProvider as any,
        null,
        React.createElement(
          App as any,
          null,
          React.createElement(DefaultSettingsIcon as any, {
            model: parent,
            menuLevels: 2,
            flattenSubMenus: true,
            showCopyUidButton: true,
            showDeleteButton: false,
          }),
        ),
      ),
    );

    await waitFor(() => {
      const menu = (globalThis as any).__lastDropdownMenu;
      expect(menu).toBeTruthy();
      const items = (menu?.items || []) as any[];
      expect(items.some((it) => String(it.key || '').startsWith('items[0]:childFlow:childStep'))).toBe(false);
    });

    await act(async () => {
      child.setStepParams('childFlow', 'childStep', { hidden: false });
    });

    await waitFor(() => {
      const menu = (globalThis as any).__lastDropdownMenu;
      const items = (menu?.items || []) as any[];
      expect(items.some((it) => String(it.key || '').startsWith('items[0]:childFlow:childStep'))).toBe(true);
    });
  });
});
