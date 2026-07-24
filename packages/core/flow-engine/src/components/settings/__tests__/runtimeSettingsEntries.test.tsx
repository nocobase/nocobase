/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../../../flowEngine';
import { FlowModel } from '../../../models/flowModel';
import type { StepDefinition } from '../../../types';
import { getRuntimeFlowSettingDiagnostics } from '../../../utils';
import { FlowsDropdownButton } from '../independents/dropdown/FlowsDropdownButton';
import { FlowSettings } from '../wrappers/embedded/FlowSettings';
import FlowsSettingsContent from '../wrappers/embedded/FlowsSettingsContent';
import { FlowsContextMenu } from '../wrappers/contextual/FlowsContextMenu';

let lastDropdownMenu:
  | { items?: Array<{ key?: string; label?: React.ReactNode }>; onClick?: (info: { key: string }) => void }
  | undefined;
const formApi = {
  values: {} as Record<string, Record<string, unknown>>,
  setFieldsValue(values: Record<string, Record<string, unknown>>) {
    this.values = values;
  },
  async validateFields() {
    return this.values;
  },
};

vi.mock('antd', () => {
  const Dropdown = (props: { menu: typeof lastDropdownMenu; children: React.ReactNode }) => {
    lastDropdownMenu = props.menu;
    return <div data-testid="dropdown">{props.children}</div>;
  };
  const Button = ({
    children,
    loading: _loading,
    type: _type,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
    <button type="button" {...props}>
      {children}
    </button>
  );
  const FormComponent = ({ children }: { children: React.ReactNode }) => <form>{children}</form>;
  const FormItem = ({ children, label }: { children: React.ReactNode; label?: React.ReactNode }) => (
    <label>
      {label}
      {children}
    </label>
  );
  const Form = Object.assign(FormComponent, {
    Item: FormItem,
    useForm: () => [formApi],
  });
  const Input = Object.assign((props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />, {
    TextArea: ({
      autoSize: _autoSize,
      ...props
    }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { autoSize?: unknown }) => <textarea {...props} />,
  });
  const ConfigProvider = Object.assign(({ children }: { children: React.ReactNode }) => <>{children}</>, {
    ConfigContext: React.createContext({}),
  });
  const Collapse = Object.assign(({ children }: { children: React.ReactNode }) => <div>{children}</div>, {
    Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  });
  const Typography = {
    Paragraph: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  };
  return {
    Alert: ({ message }: { message: React.ReactNode }) => <div role="alert">{message}</div>,
    Button,
    Card: ({ children, title }: { children: React.ReactNode; title?: React.ReactNode }) => (
      <section>
        {title}
        {children}
      </section>
    ),
    Collapse,
    ConfigProvider,
    Dropdown,
    Empty: ({ description }: { description?: React.ReactNode }) => <div>{description}</div>,
    Form,
    Input,
    InputNumber: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input type="number" {...props} />,
    Modal: { confirm: vi.fn(), error: vi.fn() },
    Result: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
    Space: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Switch: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input type="checkbox" {...props} />,
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Typography,
    theme: { useToken: () => ({ token: {} }) },
  };
});

const createModel = (name: string, runtimeStepFactory: (model: FlowModel) => Record<string, StepDefinition>) => {
  class TestModel extends FlowModel {
    getRuntimeFlowSettingSteps(flowKey: string) {
      return flowKey === 'settings' ? runtimeStepFactory(this) : undefined;
    }
  }
  const engine = new FlowEngine();
  TestModel.registerFlow({
    key: 'settings',
    title: 'Settings',
    steps: {
      staticStep: {
        title: 'Static setting',
        uiSchema: { staticValue: { type: 'string', 'x-component': 'Input' } },
      },
    },
  });
  const model = new TestModel({ uid: name, flowEngine: engine });
  model.context.defineProperty('message', { value: { success: vi.fn(), error: vi.fn(), info: vi.fn() } });
  return model;
};

describe('runtime FlowSettings entries', () => {
  beforeEach(() => {
    lastDropdownMenu = undefined;
    formApi.values = {};
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it.each([
    ['dropdown', (model: FlowModel) => <FlowsDropdownButton model={model} />],
    [
      'context menu',
      (model: FlowModel) => (
        <FlowsContextMenu model={model} showDeleteButton={false}>
          <span>target</span>
        </FlowsContextMenu>
      ),
    ],
  ])('%s lists, opens and refreshes runtime steps', async (_name, renderEntry) => {
    const model = createModel('runtime-entry', (currentModel) => ({
      runtimeStep: {
        title: 'Runtime setting',
        hideInSettings: () => currentModel.getStepParams('settings', 'state')?.hidden === true,
        uiSchema: { value: { type: 'string', 'x-component': 'Input' } },
      },
    }));
    const openFlowSettings = vi.spyOn(model, 'openFlowSettings').mockResolvedValue(true);

    render(renderEntry(model));
    await waitFor(() => {
      expect(lastDropdownMenu?.items?.map((item) => item.key)).toContain('settings:runtimeStep');
    });

    await lastDropdownMenu?.onClick?.({ key: 'settings:runtimeStep' });
    expect(openFlowSettings).toHaveBeenCalledWith({ flowKey: 'settings', stepKey: 'runtimeStep' });

    act(() => model.setStepParams('settings', 'state', { hidden: true }));
    await waitFor(() => {
      expect(lastDropdownMenu?.items?.map((item) => item.key)).not.toContain('settings:runtimeStep');
      expect(lastDropdownMenu?.items?.map((item) => item.key)).toContain('settings:staticStep');
    });
  });

  it('keeps static menu items when runtime step resolution fails', async () => {
    class ErrorModel extends FlowModel {
      getRuntimeFlowSettingSteps() {
        throw new Error('runtime failed');
      }
    }
    const engine = new FlowEngine();
    ErrorModel.registerFlow({
      key: 'settings',
      steps: {
        staticStep: { title: 'Static setting', uiSchema: { value: { type: 'string', 'x-component': 'Input' } } },
      },
    });
    const model = new ErrorModel({ uid: 'runtime-error', flowEngine: engine });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(<FlowsDropdownButton model={model} />);
    await waitFor(() => expect(lastDropdownMenu?.items?.map((item) => item.key)).toContain('settings:staticStep'));
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("flow 'settings'"), expect.any(Error));
  });

  it('keeps the static step when a runtime step uses the same key', async () => {
    const model = createModel('runtime-conflict', () => ({
      staticStep: {
        title: 'Runtime replacement',
        uiSchema: { value: { type: 'string', 'x-component': 'Input' } },
      },
    }));

    render(<FlowsDropdownButton model={model} />);
    await waitFor(() => {
      const item = lastDropdownMenu?.items?.find((menuItem) => menuItem.key === 'settings:staticStep');
      expect(item?.label).toBe('Static setting');
    });
  });

  it('embedded settings saves a runtime step through both hooks without persisting transient params', async () => {
    const beforeParamsSave = vi.fn((ctx, params) => {
      ctx.model.setStepParams('settings', 'canonical', params);
    });
    const afterParamsSave = vi.fn();
    const model = createModel('embedded-runtime', () => ({
      runtimeStep: {
        title: 'Runtime setting',
        persistParams: false,
        uiSchema: { value: { title: 'Runtime value', type: 'string', 'x-component': 'Input' } },
        beforeParamsSave,
        afterParamsSave,
      },
    }));
    vi.spyOn(model, 'saveStepParams').mockResolvedValue(undefined);

    const { getByText } = render(<FlowSettings model={model} flowKey="settings" />);
    await waitFor(() => expect(getByText('Runtime value')).toBeTruthy());

    formApi.values = { runtimeStep: { value: 'saved' } };
    fireEvent.click(getByText('Save'));

    await waitFor(() => expect(afterParamsSave).toHaveBeenCalledOnce());
    expect(beforeParamsSave).toHaveBeenCalledOnce();
    expect(model.getStepParams('settings', 'runtimeStep')).toBeUndefined();
    expect(model.getStepParams('settings', 'canonical')).toEqual({ value: 'saved' });
    expect(model.saveStepParams).toHaveBeenCalledOnce();
  });

  it('embedded settings renders a registered custom runtime setting component', async () => {
    const model = createModel('embedded-custom-component', () => ({
      runtimeStep: {
        title: 'Runtime setting',
        persistParams: false,
        uiSchema: {
          value: {
            title: 'Runtime value',
            type: 'object',
            'x-component': 'RuntimeCustomSetting',
            'x-component-props': { fieldName: 'options' },
          },
        },
      },
    }));
    model.flowEngine.flowSettings.registerComponents({
      RuntimeCustomSetting: ({ fieldName }: { fieldName: string }) => (
        <div data-testid="runtime-custom-setting">{fieldName}</div>
      ),
    });

    const { getByTestId } = render(<FlowSettings model={model} flowKey="settings" />);
    await waitFor(() => expect(getByTestId('runtime-custom-setting').textContent).toBe('options'));
  });

  it('marks runtime settings unavailable and reports a diagnostic when dynamic visibility is invalid', async () => {
    class InvalidVisibilityError extends Error {
      readonly flowSettingsDiagnostic = {
        code: 'LIGHT_EXTENSION_SETTINGS_CONDITION_INVALID',
        message: this.message,
        details: {
          entryId: 'entry-1',
          propertyPath: 'options',
          reason: 'invalid path',
        },
      };
    }
    const model = createModel('runtime-invalid-visibility', () => ({
      runtimeStep: {
        key: 'runtimeStep',
        title: 'Runtime setting',
        hideInSettings: () => {
          throw new InvalidVisibilityError(
            'Light extension entry "entry-1" setting "options" has an invalid x-visible-when condition: invalid path',
          );
        },
        uiSchema: { value: { type: 'string', 'x-component': 'Input' } },
      },
    }));
    render(<FlowsDropdownButton model={model} />);
    await waitFor(() => {
      const items = lastDropdownMenu?.items || [];
      expect(items.map((item) => item.key)).toContain('settings:staticStep');
      expect(items.map((item) => item.key)).toContain('settings:runtimeStep');
    });

    expect(lastDropdownMenu?.items?.find((item) => item.key === 'settings:runtimeStep')?.label).toContain(
      'Unavailable',
    );
    expect(getRuntimeFlowSettingDiagnostics(model)).toEqual([
      expect.objectContaining({
        code: 'LIGHT_EXTENSION_SETTINGS_CONDITION_INVALID',
        flowKey: 'settings',
        stepKey: 'runtimeStep',
        message: expect.stringContaining('entry-1'),
        details: {
          entryId: 'entry-1',
          propertyPath: 'options',
          reason: 'invalid path',
        },
      }),
    ]);
  });

  it('keeps embedded flow settings stable when a runtime visibility condition is invalid', async () => {
    class InvalidVisibilityError extends Error {
      readonly flowSettingsDiagnostic = {
        code: 'LIGHT_EXTENSION_SETTINGS_CONDITION_INVALID',
        message: this.message,
        details: {
          entryId: 'entry-embedded',
          propertyPath: 'options',
          reason: 'invalid operator',
        },
      };
    }
    const model = createModel('embedded-invalid-visibility', () => ({
      runtimeStep: {
        key: 'runtimeStep',
        title: 'Runtime setting',
        hideInSettings: () => {
          throw new InvalidVisibilityError('entry-embedded options invalid operator');
        },
        uiSchema: { value: { type: 'string', 'x-component': 'Input' } },
      },
    }));

    const { getByText } = render(<FlowsSettingsContent model={model} expandAll />);
    await waitFor(() => expect(getByText('Settings diagnostic')).toBeTruthy());
    expect(getByText('staticValue')).toBeTruthy();
  });
});
