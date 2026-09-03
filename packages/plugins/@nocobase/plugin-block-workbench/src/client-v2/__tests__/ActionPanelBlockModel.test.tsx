/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { ActionModel, JSActionModel, LinkActionModel, PopupActionModel } from '@nocobase/client-v2';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionPanelBlockModel, WorkbenchItemLayout, WorkbenchLayout } from '../models/ActionPanelBlockModel';
import { ActionPanelGroupActionModel } from '../models/actions/ActionPanelGroupAction';
import { ActionPanelScanActionModel } from '../models/actions/ActionPanelScanActionModel';
import PluginBlockWorkbenchClient from '../plugin';

type ActionPanelFlow = {
  steps: Record<
    'layout' | 'ellipsis' | 'itemLayout',
    {
      defaultParams: Record<string, unknown>;
      handler: (
        ctx: { model: { setProps: (props: Record<string, unknown>) => void } },
        params: Record<string, unknown>,
      ) => void;
      uiMode?: (ctx: { t: (key: string, options?: Record<string, unknown>) => string }) => Record<string, unknown>;
    }
  >;
};

class RenderableActionModel extends ActionModel {
  onClick = vi.fn();

  renderComponent() {
    return this.renderButton?.() ?? null;
  }
}

RenderableActionModel.define({
  label: 'Renderable action',
});

class UnavailableEntryActionModel extends RenderableActionModel {
  isEntryActionAvailable() {
    return false;
  }

  getEntryActionUnavailableMessage() {
    return 'Unavailable now';
  }
}

function defineContext(engine: FlowEngine, options?: { flowSettingsEnabled?: boolean; isMobileLayout?: boolean }) {
  engine.context.defineProperty('app', {
    value: {
      entryActionManager: {
        revision: 3,
        getItems: vi.fn(() => () => [
          { key: 'entry-one', useModel: 'EntryActionModel' },
          { key: 'entry-two', useModel: 'EntryActionModel2' },
        ]),
      },
    },
  });
  engine.context.defineProperty('themeToken', {
    value: {
      borderRadiusLG: 8,
      colorBgContainer: '#fff',
      colorBgTextHover: '#f5f5f5',
      colorBorderSecondary: '#eee',
      colorPrimary: '#1677ff',
      colorText: '#111',
      controlHeightLG: 40,
      fontSize: 14,
      lineHeight: 1.5,
      marginBlock: 16,
      marginSM: 12,
      marginXS: 8,
      motionDurationMid: '0.2s',
      opacityLoading: 0.45,
      padding: 16,
      paddingSM: 12,
    },
  });
  engine.context.defineProperty('flowSettingsEnabled', { value: options?.flowSettingsEnabled ?? false });
  engine.context.defineProperty('isMobileLayout', { value: options?.isMobileLayout ?? false });
  engine.context.defineMethod('t', (key: string) => key);
}

function createEngine(options?: { flowSettingsEnabled?: boolean; isMobileLayout?: boolean }) {
  const engine = new FlowEngine();
  defineContext(engine, options);
  engine.registerModels({
    ActionPanelBlockModel,
    ActionPanelGroupActionModel,
    ActionPanelScanActionModel,
    JSActionModel,
    LinkActionModel,
    PopupActionModel,
    RenderableActionModel,
    UnavailableEntryActionModel,
  });
  return engine;
}

function createBlock(options?: {
  props?: Record<string, unknown>;
  flowSettingsEnabled?: boolean;
  isMobileLayout?: boolean;
  actionUse?: string;
  actionProps?: Record<string, unknown>;
  hidden?: boolean;
}) {
  const engine = createEngine({
    flowSettingsEnabled: options?.flowSettingsEnabled,
    isMobileLayout: options?.isMobileLayout,
  });
  const model = engine.createModel<ActionPanelBlockModel>({
    use: 'ActionPanelBlockModel',
    props: {
      layout: WorkbenchLayout.Grid,
      ...options?.props,
    },
    subModels: {
      actions: [
        {
          use: options?.actionUse ?? 'RenderableActionModel',
          hidden: options?.hidden,
          props: {
            title: 'Open report',
            icon: 'SettingOutlined',
            color: '#52c41a',
            ...options?.actionProps,
          },
        },
      ],
    },
  });
  return { engine, model };
}

function getSettingsFlow() {
  const modelClass = ActionPanelBlockModel as typeof ActionPanelBlockModel & {
    globalFlowRegistry: { getFlow: (key: string) => ActionPanelFlow | undefined };
  };
  const flow = modelClass.globalFlowRegistry.getFlow('actionPanelBlockSetting');
  expect(flow).toBeDefined();
  return flow as ActionPanelFlow;
}

describe('ActionPanelBlockModel', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('registers action panel model loaders', async () => {
    const flowEngine = new FlowEngine();

    await PluginBlockWorkbenchClient.prototype.load.call({ flowEngine });
    await flowEngine.preloadModelLoaders();

    expect(flowEngine.getModelClass('ActionPanelBlockModel')).toBe(ActionPanelBlockModel);
    expect(flowEngine.getModelClass('ActionPanelGroupActionModel')).toBe(ActionPanelGroupActionModel);
    expect(flowEngine.getModelClass('ActionPanelScanActionModel')).toBe(ActionPanelScanActionModel);
  });

  it('inserts entry actions before the JavaScript action in configure items', async () => {
    const { model } = createBlock();

    const items = await model.getConfigureActionsItems()({ engine: model.flowEngine } as never);
    const itemKeys = items.map((item) => item.key ?? item.useModel);

    expect(itemKeys).toContain('entry-one');
    expect(itemKeys).toContain('entry-two');
    expect(items.findIndex((item) => item.key === 'entry-one')).toBeLessThan(
      items.findIndex((item) => item.useModel === 'JSActionModel'),
    );
  });

  it('appends entry actions when JavaScript action is not part of the base items', async () => {
    const { model } = createBlock();
    model.context.app.entryActionManager.getItems = vi.fn(() => () => [
      { key: 'entry-only', useModel: 'EntryActionModel' },
    ]);
    vi.spyOn(model, 'getModelClassName').mockReturnValue('MissingActionGroupModel');

    const items = await model.getConfigureActionsItems()({ engine: model.flowEngine } as never);

    expect(items.at(-1)).toMatchObject({ key: 'entry-only' });
  });

  it('returns base configure items when no entry actions are registered', async () => {
    const { model } = createBlock();
    model.context.app.entryActionManager.getItems = vi.fn(() => () => []);

    const items = await model.getConfigureActionsItems()({ engine: model.flowEngine } as never);

    expect(items.map((item) => item.useModel)).toContain('JSActionModel');
    expect(items.some((item) => item.key === 'entry-one')).toBe(false);
  });

  it('renders available grid actions and wires the generated button renderer', async () => {
    const { engine, model } = createBlock();

    render(<FlowEngineProvider engine={engine}>{model.renderComponent()}</FlowEngineProvider>);

    expect(await screen.findByText('Open report')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    const [action] = model.mapSubModels('actions' as never, (action) => action as RenderableActionModel);
    expect(action.onClick).toHaveBeenCalled();
  });

  it('hides unavailable entry actions outside of config mode', () => {
    const { engine, model } = createBlock({ actionUse: 'UnavailableEntryActionModel' });

    render(<FlowEngineProvider engine={engine}>{model.renderComponent()}</FlowEngineProvider>);

    expect(screen.queryByText('Open report')).not.toBeInTheDocument();
  });

  it('hides hidden actions outside of config mode', () => {
    const { engine, model } = createBlock({ hidden: true });

    render(<FlowEngineProvider engine={engine}>{model.renderComponent()}</FlowEngineProvider>);

    expect(screen.queryByText('Open report')).not.toBeInTheDocument();
  });

  it('renders unavailable entry actions in config mode with compact content', async () => {
    const { engine, model } = createBlock({ actionUse: 'UnavailableEntryActionModel', flowSettingsEnabled: true });

    render(<FlowEngineProvider engine={engine}>{model.renderComponent()}</FlowEngineProvider>);

    expect(await screen.findByText('Open report')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders hidden actions in config mode', async () => {
    const { engine, model } = createBlock({ hidden: true, flowSettingsEnabled: true });

    render(<FlowEngineProvider engine={engine}>{model.renderComponent()}</FlowEngineProvider>);

    expect(await screen.findByText('Open report')).toBeInTheDocument();
  });

  it('renders list layout actions', async () => {
    const { engine, model } = createBlock({ props: { layout: WorkbenchLayout.List, ellipsis: false } });

    render(<FlowEngineProvider engine={engine}>{model.renderComponent()}</FlowEngineProvider>);

    expect(await screen.findByText('Open report')).toBeInTheDocument();
  });

  it('hides unavailable list actions outside of config mode', () => {
    const { engine, model } = createBlock({
      actionUse: 'UnavailableEntryActionModel',
      props: { layout: WorkbenchLayout.List },
    });

    render(<FlowEngineProvider engine={engine}>{model.renderComponent()}</FlowEngineProvider>);

    expect(screen.queryByText('Open report')).not.toBeInTheDocument();
  });

  it('renders unavailable list actions in config mode', async () => {
    const { engine, model } = createBlock({
      actionUse: 'UnavailableEntryActionModel',
      flowSettingsEnabled: true,
      props: { layout: WorkbenchLayout.List },
    });

    render(<FlowEngineProvider engine={engine}>{model.renderComponent()}</FlowEngineProvider>);

    expect(await screen.findByText('Open report')).toBeInTheDocument();
  });

  it('hides hidden list actions outside of config mode', () => {
    const { engine, model } = createBlock({ hidden: true, props: { layout: WorkbenchLayout.List } });

    render(<FlowEngineProvider engine={engine}>{model.renderComponent()}</FlowEngineProvider>);

    expect(screen.queryByText('Open report')).not.toBeInTheDocument();
  });

  it('renders horizontal grid actions in mobile layout', async () => {
    const { engine, model } = createBlock({
      isMobileLayout: true,
      props: { itemLayout: WorkbenchItemLayout.Horizontal },
    });

    render(<FlowEngineProvider engine={engine}>{model.renderComponent()}</FlowEngineProvider>);

    expect(await screen.findByText('Open report')).toBeInTheDocument();
  });

  it('does not render invalid action models', () => {
    const { engine, model } = createBlock({ actionUse: 'ActionPanelGroupActionModel' });

    render(<FlowEngineProvider engine={engine}>{model.renderComponent()}</FlowEngineProvider>);

    expect(screen.queryByText('Open report')).not.toBeInTheDocument();
  });

  it('applies settings flow params to block props', () => {
    const flow = getSettingsFlow();
    const setProps = vi.fn();
    const t = (key: string) => key;

    expect(flow.steps.layout.defaultParams).toEqual({ layout: WorkbenchLayout.Grid });
    expect(flow.steps.layout.uiMode?.({ t })?.props).toMatchObject({
      options: [
        { label: 'Grid', value: WorkbenchLayout.Grid },
        { label: 'List', value: WorkbenchLayout.List },
      ],
    });
    flow.steps.layout.handler({ model: { setProps } }, { layout: WorkbenchLayout.List });
    flow.steps.ellipsis.handler({ model: { setProps } }, { ellipsis: false });
    flow.steps.itemLayout.handler({ model: { setProps } }, { itemLayout: WorkbenchItemLayout.Horizontal });

    expect(flow.steps.ellipsis.defaultParams).toEqual({ ellipsis: true });
    expect(flow.steps.itemLayout.uiMode?.({ t })?.props).toMatchObject({
      options: [
        { label: 'Vertical', value: WorkbenchItemLayout.Vertical },
        { label: 'Horizontal', value: WorkbenchItemLayout.Horizontal },
      ],
    });
    expect(setProps).toHaveBeenCalledWith({ layout: WorkbenchLayout.List });
    expect(setProps).toHaveBeenCalledWith({ ellipsis: false });
    expect(setProps).toHaveBeenCalledWith({ itemLayout: WorkbenchItemLayout.Horizontal });
  });

  it('registers action panel action types on the group action model', () => {
    expect(Array.from(ActionPanelGroupActionModel.currentModels.keys())).toEqual([
      'PopupActionModel',
      'LinkActionModel',
      'ActionPanelScanActionModel',
      'JSActionModel',
    ]);
  });
});
