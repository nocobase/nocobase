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
import { FlowEngine, FlowModel, GLOBAL_EMBED_CONTAINER_ID } from '@nocobase/flow-engine';
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
    Button: ({ children, onClick, ...props }: any) => (
      <button type="button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Collapse: ({ items }: any) => (
      <div data-testid="collapse">{items?.map((item: any) => <div key={item.key}>{item.children}</div>)}</div>
    ),
    Dropdown: ({ children }: any) => <div>{children}</div>,
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

  render(embedCall.content);
};

const createModel = (options: { preventClose?: boolean; hiddenClose?: boolean } = {}) => {
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

  return model;
};

describe('DynamicFlowsIcon', () => {
  beforeEach(() => {
    mockState.capturedSelectProps.length = 0;
    mockState.flowContextValue = {
      view: {
        destroy: vi.fn(),
      },
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

  it('updates editor content after flows are added asynchronously', async () => {
    const model = createModel();
    model.flowRegistry.removeFlow('flow1');

    await openDynamicFlowsEditor(model);

    expect(screen.getByText('No event flows')).toBeInTheDocument();

    model.flowRegistry.addFlow('hydrated-flow', {
      title: 'Hydrated flow',
      steps: {},
    });

    await waitFor(() => {
      expect(screen.queryByText('No event flows')).not.toBeInTheDocument();
      expect(screen.getByTestId('collapse')).toBeInTheDocument();
    });
  });
});
