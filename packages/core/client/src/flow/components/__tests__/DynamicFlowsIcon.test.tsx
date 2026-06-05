/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import { ActionScene, FlowEngine, FlowModel, GLOBAL_EMBED_CONTAINER_ID } from '@nocobase/flow-engine';
import { DynamicFlowsIcon } from '../DynamicFlowsIcon';

const mockState = vi.hoisted(() => ({
  capturedSelectProps: [] as any[],
  flowContextValue: undefined as any,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => mockState.flowContextValue,
  };
});

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Button: ({ children, onClick, icon: _icon, loading: _loading, ...props }: any) => (
      <button type="button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Collapse: ({ items }: any) => (
      <div data-testid="collapse">
        {items?.map((item: any) => (
          <div key={item.key}>
            {item.label}
            {item.children}
          </div>
        ))}
      </div>
    ),
    Dropdown: ({ children, menu }: any) => (
      <div>
        {children}
        {menu?.items?.map((item: any) => (
          <button key={item.key} type="button" onClick={item.onClick}>
            {item.label}
          </button>
        ))}
      </div>
    ),
    Empty: ({ description }: any) => <div>{description}</div>,
    Input: (props: any) => <input {...props} />,
    Select: (props: any) => {
      mockState.capturedSelectProps.push(props);
      return <div data-testid={String(props.placeholder || 'select')} />;
    },
    Space: ({ children }: any) => <div>{children}</div>,
    Tooltip: ({ children }: any) => <>{children}</>,
  };
});

class TestModel extends FlowModel {}

const getTriggerEventSelectProps = () => {
  return mockState.capturedSelectProps.filter((props) => props.placeholder === 'Select trigger event').at(-1);
};

const getTriggerEventOptionValues = () => {
  return (getTriggerEventSelectProps()?.options ?? []).map((option: { value: string }) => option.value);
};

const openDynamicFlowsEditor = async (model: FlowModel) => {
  const { container } = render(<DynamicFlowsIcon model={model} />);
  const trigger = container.querySelector('.anticon');

  expect(trigger).not.toBeNull();
  await userEvent.click(trigger as Element);

  const embedCall = (model.context.viewer.embed as any).mock.calls.at(-1)?.[0];
  expect(embedCall?.content).toBeTruthy();

  const editor = render(embedCall.content);

  return {
    embedCall,
    view: mockState.flowContextValue.view,
    editor,
  };
};

const createModel = (options: { preventClose?: boolean; hiddenClose?: boolean; saveStepParams?: any } = {}) => {
  const engine = new FlowEngine();
  engine.translate = vi.fn((key: string) => key) as any;
  engine.flowSettings.renderStepForm = vi.fn(() => null) as any;

  class LocalTestModel extends TestModel {}

  LocalTestModel.registerEvents({
    close: {
      name: 'close',
      title: 'Close',
      handler: vi.fn(),
      hideInSettings(ctx) {
        return options.hiddenClose ?? !!ctx.view?.preventClose;
      },
    },
    click: {
      name: 'click',
      title: 'Click',
      handler: vi.fn(),
    },
  });
  LocalTestModel.registerActions({
    notify: {
      name: 'notify',
      title: 'Notify',
      scene: ActionScene.DYNAMIC_EVENT_FLOW,
      handler: vi.fn(),
    },
  });

  const model = new LocalTestModel({
    uid: `test-model-${Math.random().toString(36).slice(2, 8)}`,
    use: LocalTestModel,
    flowEngine: engine,
    stepParams: {},
    subModels: {},
    flowRegistry: {
      flow1: {
        title: 'Event flow',
        steps: {},
      },
    },
  } as any);

  const embed = vi.fn();
  model.context.defineProperty('viewer', {
    value: {
      embed,
    },
  });
  model.context.defineProperty('view', {
    value: {
      preventClose: !!options.preventClose,
      destroy: vi.fn(),
    },
  });
  model.context.defineProperty('message', {
    value: {
      error: vi.fn(),
      success: vi.fn(),
    },
  });
  vi.spyOn(model, 'saveStepParams').mockImplementation(options.saveStepParams || vi.fn(async () => undefined));

  return model;
};

const createView = () => {
  let destroyed = false;
  let closingPromise: Promise<boolean | void> | undefined;
  const view = {
    close: vi.fn(function () {
      if (destroyed) {
        return Promise.resolve(true);
      }
      if (closingPromise) {
        return closingPromise;
      }
      closingPromise = (async () => {
        const allowed = await view.beforeClose?.({});
        if (allowed === false) {
          closingPromise = undefined;
          return false;
        }
        view.destroy();
        return true;
      })();
      return closingPromise;
    }),
    destroy: vi.fn(() => {
      destroyed = true;
    }),
    beforeClose: undefined as any,
  };
  return view;
};

describe('DynamicFlowsIcon', () => {
  beforeEach(() => {
    mockState.capturedSelectProps.length = 0;
    mockState.flowContextValue = {
      modal: {
        confirm: vi.fn(),
      },
      view: createView(),
    };
    document.body.innerHTML = `<div id="${GLOBAL_EMBED_CONTAINER_ID}"></div>`;
  });

  it('filters hidden events from trigger event options', async () => {
    const model = createModel({ hiddenClose: true });

    await openDynamicFlowsEditor(model);

    await waitFor(() => {
      const eventValues = getTriggerEventOptionValues();
      expect(eventValues).toContain('click');
      expect(eventValues).not.toContain('close');
    });
  });

  it('hides close when view.preventClose=true', async () => {
    const model = createModel({ preventClose: true });

    await openDynamicFlowsEditor(model);

    await waitFor(() => {
      const eventValues = getTriggerEventOptionValues();
      expect(eventValues).toContain('click');
      expect(eventValues).not.toContain('close');
    });
  });

  it('keeps close visible when view.preventClose=false', async () => {
    const model = createModel({ preventClose: false });

    await openDynamicFlowsEditor(model);

    await waitFor(() => {
      const eventValues = getTriggerEventOptionValues();
      expect(eventValues).toEqual(expect.arrayContaining(['close', 'click']));
    });
  });

  it('keeps added event flows in draft until saved', async () => {
    const model = createModel();

    await openDynamicFlowsEditor(model);
    await userEvent.click(screen.getByRole('button', { name: 'Add event flow' }));

    expect(model.flowRegistry.getFlows().size).toBe(1);
    expect(model.flowRegistry.hasFlow('flow1')).toBe(true);
  });

  it('blocks cancel when draft has unsaved changes and confirmation is rejected', async () => {
    const model = createModel();
    mockState.flowContextValue.modal.confirm.mockResolvedValue(false);
    const { view } = await openDynamicFlowsEditor(model);

    await userEvent.click(screen.getByRole('button', { name: 'Add event flow' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockState.flowContextValue.modal.confirm).toHaveBeenCalledWith({
      title: 'Unsaved changes',
      content: "Are you sure you don't want to save?",
      okText: 'Confirm',
      cancelText: 'Cancel',
    });
    expect(view.destroy).not.toHaveBeenCalled();
    expect(model.flowRegistry.getFlows().size).toBe(1);
  });

  it('runs only one unsaved confirmation while cancel is pending', async () => {
    const model = createModel();
    let resolveConfirm: (value: boolean) => void;
    mockState.flowContextValue.modal.confirm.mockImplementation(
      () => new Promise<boolean>((resolve) => (resolveConfirm = resolve)),
    );
    const { view } = await openDynamicFlowsEditor(model);

    await userEvent.click(screen.getByRole('button', { name: 'Add event flow' }));
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);
    await userEvent.click(cancelButton);

    expect(mockState.flowContextValue.modal.confirm).toHaveBeenCalledTimes(1);

    resolveConfirm(true);
    await waitFor(() => expect(view.destroy).toHaveBeenCalledTimes(1));
  });

  it('discards draft changes after confirmed cancel', async () => {
    const model = createModel();
    mockState.flowContextValue.modal.confirm.mockResolvedValue(true);
    const { view } = await openDynamicFlowsEditor(model);

    await userEvent.click(screen.getByRole('button', { name: 'Add event flow' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(view.destroy).toHaveBeenCalledTimes(1);
    expect(model.flowRegistry.getFlows().size).toBe(1);
    expect(model.flowRegistry.hasFlow('flow1')).toBe(true);
  });

  it('discards existing event flow edits after confirmed cancel', async () => {
    const model = createModel();
    mockState.flowContextValue.modal.confirm.mockResolvedValue(true);
    const { view } = await openDynamicFlowsEditor(model);

    const titleInput = screen.getByPlaceholderText('Enter flow title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Changed flow');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(view.destroy).toHaveBeenCalledTimes(1);
    expect(model.flowRegistry.getFlow('flow1')?.title).toBe('Event flow');
  });

  it('discards added draft steps after confirmed cancel', async () => {
    const model = createModel();
    mockState.flowContextValue.modal.confirm.mockResolvedValue(true);
    const { view } = await openDynamicFlowsEditor(model);

    expect(model.flowRegistry.getFlow('flow1')?.getSteps().size).toBe(0);

    await userEvent.click(screen.getByRole('button', { name: 'Notify' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(view.destroy).toHaveBeenCalledTimes(1);
    expect(model.flowRegistry.getFlow('flow1')?.getSteps().size).toBe(0);
  });

  it('does not keep discarded draft changes after reopening the editor', async () => {
    const model = createModel();
    mockState.flowContextValue.modal.confirm.mockResolvedValue(true);

    const firstEditor = await openDynamicFlowsEditor(model);
    await userEvent.click(screen.getByRole('button', { name: 'Add event flow' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    firstEditor.editor.unmount();

    mockState.capturedSelectProps.length = 0;
    mockState.flowContextValue.view = createView();
    const secondEditor = await openDynamicFlowsEditor(model);

    expect(secondEditor.editor.container.querySelectorAll('input[placeholder="Enter flow title"]')).toHaveLength(1);
    expect(model.flowRegistry.getFlows().size).toBe(1);
  });

  it('saves draft event flows into the real registry', async () => {
    const saveStepParams = vi.fn(async () => undefined);
    const model = createModel({ saveStepParams });
    const { view } = await openDynamicFlowsEditor(model);

    await userEvent.click(screen.getByRole('button', { name: 'Add event flow' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveStepParams).toHaveBeenCalledTimes(1);
    expect(model.flowRegistry.getFlows().size).toBe(2);
    expect(view.destroy).toHaveBeenCalledTimes(1);
    expect(model.context.message.success).toHaveBeenCalledWith('Configuration saved');
  });
});
