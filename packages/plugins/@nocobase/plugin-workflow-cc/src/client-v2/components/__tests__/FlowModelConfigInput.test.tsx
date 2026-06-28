/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form, type FormInstance } from 'antd';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  contextDefinitions: [] as Array<{ name: string; value: unknown }>,
  flowNodesUpdate: vi.fn(),
  flowModelRendererProps: [] as Array<{ model?: RenderableModel; showFlowSettings?: unknown }>,
  form: undefined as FormInstance | undefined,
  getModelClassAsync: vi.fn(),
  loadModel: vi.fn(),
  loadOrCreateModel: vi.fn(),
  modelSave: vi.fn(),
  pluginManagerGet: vi.fn(),
  randomId: vi.fn(),
  removeModelWithSubModels: vi.fn(),
  viewerDialog: vi.fn(),
  workflow: {
    config: {
      collection: 'main.users',
    },
    id: 10,
    title: 'CC workflow',
  },
  node: {
    config: {},
    id: 20,
    key: 'cc-node',
    type: 'cc',
  },
  nodes: [
    { id: 1, key: 'trigger-node', type: 'collection' },
    { id: 20, key: 'cc-node', type: 'cc' },
  ],
  upstreams: [{ id: 1, key: 'trigger-node', type: 'collection' }],
}));

type RenderableModel = {
  addSubModel?: ReturnType<typeof vi.fn>;
  context: {
    addDelegate: ReturnType<typeof vi.fn>;
    defineProperty: ReturnType<typeof vi.fn>;
  };
  hasSubModel?: ReturnType<typeof vi.fn>;
  save?: ReturnType<typeof vi.fn>;
  setSubModel?: ReturnType<typeof vi.fn>;
  setStepParams?: ReturnType<typeof vi.fn>;
  subModels?: Record<string, RenderableModel | RenderableModel[] | undefined>;
  uid?: string;
  use: string;
};

vi.mock('@nocobase/flow-engine', () => ({
  FlowModelRenderer: (props: { model: RenderableModel; showFlowSettings?: unknown }) => {
    holder.flowModelRendererProps.push(props);
    return (
      <div data-testid="flow-model">
        {props.model.uid}:{props.model.use}
      </div>
    );
  },
  randomId: holder.randomId,
  useFlowContext: () => ({
    api: {
      resource: (name: string) => (name === 'flow_nodes' ? { update: holder.flowNodesUpdate } : {}),
    },
    viewer: {
      dialog: holder.viewerDialog,
    },
  }),
  useFlowEngine: () => ({
    context: {
      app: {
        pm: {
          get: holder.pluginManagerGet,
        },
      },
    },
    getModelClassAsync: holder.getModelClassAsync,
    loadModel: holder.loadModel,
    loadOrCreateModel: holder.loadOrCreateModel,
    removeModelWithSubModels: holder.removeModelWithSubModels,
  }),
  useFlowViewContext: () => ({ name: 'view-context' }),
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  parseCollectionName: (value?: string) => {
    if (!value) return [];
    const parts = value.split('.');
    return parts.length > 1 ? [parts[0], parts.slice(1).join('.')] : ['main', value];
  },
  useAvailableUpstreams: () => holder.upstreams,
  useCurrentWorkflowContext: () => holder.workflow,
  useFlowContext: () => ({
    nodes: holder.nodes,
  }),
  useNodeContext: () => holder.node,
}));

vi.mock('../../hooks/useTempAssociationSources', () => ({
  useTempAssociationSources: () => [],
}));

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../../models/CCTaskCardDetailsItemModel', () => ({
  updateWorkflowCcTaskAssociationFields: vi.fn(),
}));

vi.mock('../../models/registerModelLoaders', () => ({
  registerWorkflowCcModelLoaders: vi.fn(),
}));

vi.mock('../../utils/registerWorkflowCcCollections', () => ({
  registerWorkflowCcCollections: vi.fn(),
}));

import FlowModelConfigInput from '../FlowModelConfigInput';

function createModel(uid: string, use: string): RenderableModel {
  return {
    uid,
    use,
    context: {
      addDelegate: vi.fn(),
      defineProperty: vi.fn((name: string, value: unknown) => {
        holder.contextDefinitions.push({ name, value });
      }),
    },
    save: holder.modelSave,
  };
}

function HiddenFieldValue() {
  return null;
}

function renderInput(
  props: Partial<React.ComponentProps<typeof FlowModelConfigInput>> = {},
  initialConfig: Record<string, unknown> = {},
  formProps: {
    onFinish?: (values: unknown) => void;
    onFinishFailed?: (errorInfo: unknown) => void;
    registeredConfigFields?: string[];
  } = {},
) {
  function Wrapper() {
    const [form] = Form.useForm();
    holder.form = form;
    return (
      <Form
        form={form}
        initialValues={{ config: initialConfig }}
        onFinish={formProps.onFinish}
        onFinishFailed={formProps.onFinishFailed}
      >
        {formProps.registeredConfigFields?.map((field) => (
          <Form.Item hidden key={field} name={['config', field]} noStyle>
            <HiddenFieldValue />
          </Form.Item>
        ))}
        <Form.Item name={['config', props.configKey ?? 'ccUid']}>
          <FlowModelConfigInput configKey="ccUid" kind="interface" {...props} />
        </Form.Item>
      </Form>
    );
  }

  return render(<Wrapper />);
}

function renderConfigInputs(initialConfig: Record<string, unknown> = {}) {
  function Wrapper() {
    const [form] = Form.useForm();
    holder.form = form;
    return (
      <Form form={form} initialValues={{ config: initialConfig }}>
        <Form.Item name={['config', 'ccUid']}>
          <FlowModelConfigInput configKey="ccUid" kind="interface" />
        </Form.Item>
        <Form.Item name={['config', 'taskCardUid']}>
          <FlowModelConfigInput configKey="taskCardUid" kind="taskCard" />
        </Form.Item>
      </Form>
    );
  }

  return render(<Wrapper />);
}

afterEach(() => {
  vi.clearAllMocks();
  holder.flowNodesUpdate.mockReset();
  holder.getModelClassAsync.mockReset();
  holder.loadModel.mockReset();
  holder.loadOrCreateModel.mockReset();
  holder.modelSave.mockReset();
  holder.pluginManagerGet.mockReset();
  holder.randomId.mockReset();
  holder.removeModelWithSubModels.mockReset();
  holder.viewerDialog.mockReset();
  holder.contextDefinitions = [];
  holder.flowModelRendererProps = [];
  holder.form = undefined;
  holder.node = {
    config: {},
    id: 20,
    key: 'cc-node',
    type: 'cc',
  };
});

const tokenDerivedInterfaceDialogWidth = 'min(1088px, calc(100vw - 96px))';
const approvalTaskCardDialogWidth = 800;
const tokenDerivedInterfaceDialogStyles = {
  body: {
    padding: 24,
    backgroundColor: 'var(--nb-box-bg)',
  },
  content: {
    padding: 0,
  },
  header: {
    padding: '16px 24px',
    marginBottom: 0,
  },
};
const tokenDerivedTaskCardDialogStyles = {
  body: {
    padding: 0,
    backgroundColor: 'var(--nb-box-bg)',
  },
};

describe('FlowModelConfigInput', () => {
  it('does not keep a generated uid locally when persisting the node config fails', async () => {
    holder.randomId.mockReturnValue('cc_task_card_generated');
    holder.flowNodesUpdate.mockRejectedValue(new Error('network error'));
    holder.node.config = {
      title: 'Existing title',
    };
    const model = createModel('cc_task_card_generated', 'CCTaskCardDetailsModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));
    const onChange = vi.fn();

    renderInput({ configKey: 'taskCardUid', kind: 'taskCard', onChange });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Go to configure' })).not.toBeDisabled();
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(holder.form?.getFieldValue(['config', 'taskCardUid'])).toBeUndefined();
    expect(holder.node.config).toEqual({
      title: 'Existing title',
    });
    expect(holder.viewerDialog).not.toHaveBeenCalled();
  });

  it('does not open multiple config dialogs while a generated uid is being persisted', async () => {
    let resolveUpdate: () => void;
    const updatePromise = new Promise<void>((resolve) => {
      resolveUpdate = resolve;
    });
    holder.randomId.mockReturnValueOnce('cc_task_card_generated_1').mockReturnValueOnce('cc_task_card_generated_2');
    holder.flowNodesUpdate.mockReturnValue(updatePromise);
    const model = createModel('cc_task_card_generated_1', 'CCTaskCardDetailsModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'taskCardUid', kind: 'taskCard' });
    const button = screen.getByRole('button', { name: 'Go to configure' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(holder.randomId).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledTimes(1);
    });
    expect(holder.viewerDialog).not.toHaveBeenCalled();
    await expect(holder.form?.validateFields()).rejects.toMatchObject({
      errorFields: [
        {
          name: ['config'],
        },
      ],
    });

    expect(resolveUpdate).toBeDefined();
    resolveUpdate?.();

    await waitFor(() => {
      expect(holder.viewerDialog).toHaveBeenCalledTimes(1);
    });
    await expect(holder.form?.validateFields()).resolves.toBeDefined();
  });

  it('persists a generated uid from the original node config snapshot instead of transient dialog mutations', async () => {
    holder.randomId.mockReturnValue('cc_interface_generated');
    holder.flowNodesUpdate.mockResolvedValue({});
    holder.node.config = {
      title: 'Existing title',
    };
    const model = createModel('cc_interface_generated', 'CCChildPageModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'ccUid', kind: 'interface' });
    holder.node.config = {
      title: 'Existing title',
      tempAssociationFields: [{ name: 'transient' }],
    };
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledWith({
        filterByTk: 20,
        values: {
          config: {
            ccUid: 'cc_interface_generated',
            title: 'Existing title',
          },
        },
      });
    });
    expect(holder.node.config).toEqual({
      ccUid: 'cc_interface_generated',
      title: 'Existing title',
      tempAssociationFields: [{ name: 'transient' }],
    });
  });

  it('preserves persisted temporary association fields from the initial node config snapshot', async () => {
    holder.randomId.mockReturnValue('cc_interface_generated');
    holder.flowNodesUpdate.mockResolvedValue({});
    holder.node.config = {
      title: 'Existing title',
      tempAssociationFields: [{ nodeId: 1, nodeKey: 'trigger-node', nodeType: 'node' }],
    };
    const model = createModel('cc_interface_generated', 'CCChildPageModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'ccUid', kind: 'interface' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledWith({
        filterByTk: 20,
        values: {
          config: {
            ccUid: 'cc_interface_generated',
            tempAssociationFields: [{ nodeId: 1, nodeKey: 'trigger-node', nodeType: 'node' }],
            title: 'Existing title',
          },
        },
      });
    });
    expect(holder.node.config).toEqual({
      ccUid: 'cc_interface_generated',
      title: 'Existing title',
      tempAssociationFields: [{ nodeId: 1, nodeKey: 'trigger-node', nodeType: 'node' }],
    });
  });

  it('persists a generated task-card uid into the form and node config without dropping existing config', async () => {
    holder.randomId.mockReturnValue('cc_task_card_generated');
    holder.flowNodesUpdate.mockResolvedValue({});
    holder.node.config = {
      title: 'Existing title',
      users: [{ id: 1 }],
    };
    const model = createModel('cc_task_card_generated', 'CCTaskCardDetailsModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));
    const onChange = vi.fn();

    renderInput({ configKey: 'taskCardUid', kind: 'taskCard', onChange });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledWith({
        filterByTk: 20,
        values: {
          config: {
            taskCardUid: 'cc_task_card_generated',
            title: 'Existing title',
            users: [{ id: 1 }],
          },
        },
      });
    });
    expect(onChange).toHaveBeenCalledWith('cc_task_card_generated');
    expect(holder.form?.getFieldValue(['config', 'taskCardUid'])).toBe('cc_task_card_generated');
    expect(holder.node.config).toEqual({
      taskCardUid: 'cc_task_card_generated',
      title: 'Existing title',
      users: [{ id: 1 }],
    });
  });

  it('persists a generated CC interface uid for newly configured user interfaces', async () => {
    holder.randomId.mockReturnValue('cc_interface_generated');
    holder.flowNodesUpdate.mockResolvedValue({});
    holder.node.config = {
      title: 'Existing title',
    };
    const model = createModel('cc_interface_generated', 'CCChildPageModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'ccUid', kind: 'interface' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledWith({
        filterByTk: 20,
        values: {
          config: {
            ccUid: 'cc_interface_generated',
            title: 'Existing title',
          },
        },
      });
    });
    expect(holder.form?.getFieldValue(['config', 'ccUid'])).toBe('cc_interface_generated');
    expect(holder.node.config).toEqual({
      ccUid: 'cc_interface_generated',
      title: 'Existing title',
    });
  });

  it('keeps an existing task-card uid without generating or persisting a replacement', async () => {
    holder.node.config = {
      taskCardUid: 'cc_task_card_existing',
      title: 'Existing title',
    };
    const model = createModel('cc_task_card_existing', 'CCTaskCardDetailsModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'taskCardUid', kind: 'taskCard' }, { taskCardUid: 'cc_task_card_existing' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await screen.findByTestId('flow-model');
    expect(holder.randomId).not.toHaveBeenCalled();
    expect(holder.flowNodesUpdate).not.toHaveBeenCalled();
    expect(holder.node.config).toEqual({
      taskCardUid: 'cc_task_card_existing',
      title: 'Existing title',
    });
  });

  it('preserves a sibling generated config uid when another FlowModel input persists later', async () => {
    holder.randomId.mockReturnValueOnce('cc_interface_generated').mockReturnValueOnce('cc_task_card_generated');
    holder.flowNodesUpdate.mockResolvedValue({});
    holder.node.config = {
      title: 'Existing title',
    };

    renderConfigInputs({ title: 'Existing title' });
    const buttons = screen.getAllByRole('button', { name: 'Go to configure' });

    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledWith({
        filterByTk: 20,
        values: {
          config: {
            ccUid: 'cc_interface_generated',
            title: 'Existing title',
          },
        },
      });
    });

    fireEvent.click(buttons[1]);
    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenLastCalledWith({
        filterByTk: 20,
        values: {
          config: {
            ccUid: 'cc_interface_generated',
            taskCardUid: 'cc_task_card_generated',
            title: 'Existing title',
          },
        },
      });
    });
  });

  it('preserves sibling generated config uids when both FlowModel inputs persist concurrently', async () => {
    let resolveFirstUpdate: () => void;
    let resolveSecondUpdate: () => void;
    const firstUpdate = new Promise<void>((resolve) => {
      resolveFirstUpdate = resolve;
    });
    const secondUpdate = new Promise<void>((resolve) => {
      resolveSecondUpdate = resolve;
    });
    holder.randomId.mockReturnValueOnce('cc_interface_generated').mockReturnValueOnce('cc_task_card_generated');
    holder.flowNodesUpdate.mockReturnValueOnce(firstUpdate).mockReturnValueOnce(secondUpdate);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));
    holder.node.config = {
      title: 'Existing title',
    };

    renderConfigInputs({ title: 'Existing title' });
    const buttons = screen.getAllByRole('button', { name: 'Go to configure' });

    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledTimes(1);
    });
    expect(holder.flowNodesUpdate).toHaveBeenNthCalledWith(1, {
      filterByTk: 20,
      values: {
        config: {
          ccUid: 'cc_interface_generated',
          title: 'Existing title',
        },
      },
    });

    expect(resolveFirstUpdate).toBeDefined();
    await act(async () => {
      resolveFirstUpdate?.();
      await firstUpdate;
    });
    await expect(holder.form?.validateFields()).rejects.toMatchObject({
      errorFields: [
        {
          name: ['config'],
        },
      ],
    });

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledTimes(2);
    });
    expect(holder.flowNodesUpdate).toHaveBeenNthCalledWith(2, {
      filterByTk: 20,
      values: {
        config: {
          ccUid: 'cc_interface_generated',
          taskCardUid: 'cc_task_card_generated',
          title: 'Existing title',
        },
      },
    });

    expect(resolveSecondUpdate).toBeDefined();
    await act(async () => {
      resolveSecondUpdate?.();
      await secondUpdate;
    });
    await expect(holder.form?.validateFields()).resolves.toBeDefined();
  });

  it('serializes generated config uid persistence by node id across different node object instances', async () => {
    let resolveFirstUpdate: () => void;
    let resolveSecondUpdate: () => void;
    const firstUpdate = new Promise<void>((resolve) => {
      resolveFirstUpdate = resolve;
    });
    const secondUpdate = new Promise<void>((resolve) => {
      resolveSecondUpdate = resolve;
    });
    const firstNode = {
      config: {
        tempAssociationFields: [{ nodeId: 1, nodeKey: 'trigger-node', nodeType: 'node' }],
        title: 'Existing title',
      },
      id: 20,
      key: 'cc-node',
      type: 'cc',
    };
    const secondNode = {
      config: {
        title: 'Existing title',
      },
      id: 20,
      key: 'cc-node',
      type: 'cc',
    };
    holder.randomId.mockReturnValueOnce('cc_interface_generated').mockReturnValueOnce('cc_task_card_generated');
    holder.flowNodesUpdate.mockReturnValueOnce(firstUpdate).mockReturnValueOnce(secondUpdate);

    holder.node = firstNode;
    const firstView = renderInput({ configKey: 'ccUid', kind: 'interface' }, { title: 'Existing title' });
    fireEvent.click(firstView.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledTimes(1);
    });

    holder.node = secondNode;
    const secondView = renderInput({ configKey: 'taskCardUid', kind: 'taskCard' }, { title: 'Existing title' });
    fireEvent.click(secondView.getByRole('button', { name: 'Go to configure' }));

    expect(holder.flowNodesUpdate).toHaveBeenCalledTimes(1);

    expect(resolveFirstUpdate).toBeDefined();
    await act(async () => {
      resolveFirstUpdate?.();
      await firstUpdate;
    });

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledTimes(2);
    });
    expect(holder.flowNodesUpdate).toHaveBeenNthCalledWith(2, {
      filterByTk: 20,
      values: {
        config: {
          ccUid: 'cc_interface_generated',
          tempAssociationFields: [{ nodeId: 1, nodeKey: 'trigger-node', nodeType: 'node' }],
          taskCardUid: 'cc_task_card_generated',
          title: 'Existing title',
        },
      },
    });

    expect(resolveSecondUpdate).toBeDefined();
    await act(async () => {
      resolveSecondUpdate?.();
      await secondUpdate;
    });
  });

  it('creates and renders the CC user interface FlowModel with default child structure', async () => {
    holder.randomId.mockReturnValue('cc_interface_generated');
    const model = createModel('cc_interface_generated', 'CCChildPageModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));
    const onChange = vi.fn();

    renderInput({ onChange });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('cc_interface_generated');
    });
    await waitFor(() => {
      expect(holder.viewerDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          styles: tokenDerivedInterfaceDialogStyles,
          title: 'User interface',
          width: tokenDerivedInterfaceDialogWidth,
        }),
      );
    });
    await screen.findByTestId('flow-model');
    expect(holder.loadOrCreateModel).toHaveBeenCalledWith(
      expect.objectContaining({
        subModels: expect.objectContaining({
          tabs: expect.any(Array),
        }),
        uid: 'cc_interface_generated',
        use: 'CCChildPageModel',
      }),
    );
    expect(holder.contextDefinitions.map((item) => item.name)).toEqual(
      expect.arrayContaining(['flowSettingsEnabled', 'view']),
    );
  });

  it('backfills an existing empty CC user interface model before rendering', async () => {
    const model = createModel('cc_existing', 'CCChildPageModel');
    const subModels: NonNullable<RenderableModel['subModels']> = {};
    model.subModels = subModels;
    model.addSubModel = vi.fn((key: string, options: RenderableModel) => {
      const child = createModel(`${key}_default`, options.use);
      subModels[key] = [child];
      return child;
    });
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({}, { ccUid: 'cc_existing' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(model.addSubModel).toHaveBeenCalledWith('tabs', expect.objectContaining({ use: 'CCChildPageTabModel' }));
    });
    expect(holder.modelSave).toHaveBeenCalled();
  });

  it('uses the loaded populated grid when an existing CC interface tab has an empty grid', async () => {
    const model = createModel('cc_existing', 'CCChildPageModel');
    const emptyGrid = createModel('empty_grid', 'CCBlockGridModel');
    const populatedGrid = createModel('populated_grid', 'CCBlockGridModel');
    populatedGrid.subModels = {
      items: [createModel('node_details', 'NodeDetailsModel')],
    };
    const tab = createModel('tab_existing', 'CCChildPageTabModel');
    tab.subModels = {
      grid: emptyGrid,
    };
    tab.setSubModel = vi.fn((key: string, child: RenderableModel) => {
      tab.subModels = {
        ...tab.subModels,
        [key]: child,
      };
      return child;
    });
    model.subModels = {
      tabs: [tab],
    };
    holder.loadModel.mockResolvedValue(populatedGrid);
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({}, { ccUid: 'cc_existing' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(tab.setSubModel).toHaveBeenCalledWith('grid', populatedGrid);
    });
    expect(holder.loadModel).toHaveBeenCalledWith({
      parentId: 'tab_existing',
      refresh: true,
      subKey: 'grid',
    });
    expect(holder.modelSave).not.toHaveBeenCalled();
  });

  it('uses the refreshed empty grid instead of the stale local empty grid', async () => {
    const model = createModel('cc_existing', 'CCChildPageModel');
    const emptyGrid = createModel('empty_grid', 'CCBlockGridModel');
    const refreshedGrid = createModel('empty_grid', 'CCBlockGridModel');
    const tab = createModel('tab_existing', 'CCChildPageTabModel');
    tab.subModels = {
      grid: emptyGrid,
    };
    tab.setSubModel = vi.fn((key: string, child: RenderableModel) => {
      tab.subModels = {
        ...tab.subModels,
        [key]: child,
      };
      return child;
    });
    model.subModels = {
      tabs: [tab],
    };
    holder.loadModel.mockResolvedValue(refreshedGrid);
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({}, { ccUid: 'cc_existing' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(tab.setSubModel).toHaveBeenCalledWith('grid', refreshedGrid);
    });
    expect(tab.subModels.grid).toBe(refreshedGrid);
    expect(holder.modelSave).not.toHaveBeenCalled();
  });

  it('persists an existing local empty grid when the server has no grid for the tab', async () => {
    const model = createModel('cc_existing', 'CCChildPageModel');
    const emptyGrid = createModel('empty_grid', 'CCBlockGridModel');
    const saveEmptyGrid = vi.fn();
    emptyGrid.save = saveEmptyGrid;
    const tab = createModel('tab_existing', 'CCChildPageTabModel');
    tab.subModels = {
      grid: emptyGrid,
    };
    model.subModels = {
      tabs: [tab],
    };
    holder.loadModel.mockResolvedValue(null);
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({}, { ccUid: 'cc_existing' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(saveEmptyGrid).toHaveBeenCalled();
    });
    expect(holder.loadModel).toHaveBeenCalledWith({
      parentId: 'tab_existing',
      refresh: true,
      subKey: 'grid',
    });
    expect(holder.modelSave).not.toHaveBeenCalled();
  });

  it('creates task-card models with task-card settings enabled and the workflowCcTasks resource', async () => {
    holder.randomId.mockReturnValue('cc_task_card_generated');
    const model = createModel('cc_task_card_generated', 'CCTaskCardDetailsModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'taskCardUid', kind: 'taskCard' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await screen.findByTestId('flow-model');
    expect(holder.viewerDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        styles: tokenDerivedTaskCardDialogStyles,
        title: 'Task card',
        width: approvalTaskCardDialogWidth,
      }),
    );
    expect(holder.loadOrCreateModel).toHaveBeenCalledWith(
      expect.objectContaining({
        stepParams: expect.objectContaining({
          resourceSettings: {
            init: {
              collectionName: 'workflowCcTasks',
              dataSourceKey: 'main',
            },
          },
        }),
        use: 'CCTaskCardDetailsModel',
      }),
    );
    expect(holder.flowModelRendererProps[0]).toEqual(
      expect.objectContaining({
        showFlowSettings: true,
      }),
    );
  });

  it('renders an existing task-card field tree when reopening a saved task-card model', async () => {
    const fieldItem = createModel('status_field', 'CCTaskCardDetailsItemModel');
    const grid = createModel('task_card_grid', 'CCTaskCardGridModel');
    grid.subModels = {
      items: [fieldItem],
    };
    const model = createModel('cc_task_card_existing', 'CCTaskCardDetailsModel');
    model.subModels = {
      grid,
    };
    holder.node.config = {
      taskCardUid: 'cc_task_card_existing',
    };
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'taskCardUid', kind: 'taskCard' }, { taskCardUid: 'cc_task_card_existing' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await screen.findByTestId('flow-model');
    expect(holder.flowModelRendererProps[0].model?.subModels?.grid).toBe(grid);
    expect((holder.flowModelRendererProps[0].model?.subModels?.grid as RenderableModel).subModels?.items).toEqual([
      fieldItem,
    ]);
    expect(holder.flowNodesUpdate).not.toHaveBeenCalled();
  });

  it('syncs task-card temporary association fields into the parent form config', async () => {
    holder.randomId.mockReturnValue('cc_task_card_generated');
    holder.flowNodesUpdate.mockResolvedValue({});
    const model = createModel('cc_task_card_generated', 'CCTaskCardDetailsModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));
    const tempAssociationFields = [{ nodeId: 1, nodeKey: 'trigger-node', nodeType: 'node' }];

    renderInput({ configKey: 'taskCardUid', kind: 'taskCard' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await screen.findByTestId('flow-model');
    const syncDefinition = holder.contextDefinitions.find((item) => item.name === 'ccTaskTempAssociationSync');
    const sync = (syncDefinition?.value as { get?: () => (fields: typeof tempAssociationFields) => void })?.get?.();
    expect(sync).toBeInstanceOf(Function);

    act(() => {
      sync?.(tempAssociationFields);
    });

    expect(holder.node.config?.tempAssociationFields).toEqual(tempAssociationFields);
    expect(holder.form?.getFieldValue(['config', 'tempAssociationFields'])).toEqual(tempAssociationFields);
    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenLastCalledWith({
        filterByTk: 20,
        values: {
          config: {
            taskCardUid: 'cc_task_card_generated',
            tempAssociationFields,
          },
        },
      });
    });
  });

  it('preserves persisted temporary association fields when another FlowModel input persists later', async () => {
    holder.randomId.mockReturnValueOnce('cc_task_card_generated').mockReturnValueOnce('cc_interface_generated');
    holder.flowNodesUpdate.mockResolvedValue({});
    holder.node.config = {
      title: 'Existing title',
    };
    const tempAssociationFields = [{ nodeId: 1, nodeKey: 'trigger-node', nodeType: 'node' }];
    const taskCardModel = createModel('cc_task_card_generated', 'CCTaskCardDetailsModel');
    const interfaceModel = createModel('cc_interface_generated', 'CCChildPageModel');
    holder.loadOrCreateModel.mockResolvedValueOnce(taskCardModel).mockResolvedValueOnce(interfaceModel);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderConfigInputs({ title: 'Existing title' });
    const buttons = screen.getAllByRole('button', { name: 'Go to configure' });

    fireEvent.click(buttons[1]);
    await screen.findByTestId('flow-model');
    const syncDefinition = holder.contextDefinitions.find((item) => item.name === 'ccTaskTempAssociationSync');
    const sync = (syncDefinition?.value as { get?: () => (fields: typeof tempAssociationFields) => void })?.get?.();
    expect(sync).toBeInstanceOf(Function);

    act(() => {
      sync?.(tempAssociationFields);
    });

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenLastCalledWith({
        filterByTk: 20,
        values: {
          config: {
            taskCardUid: 'cc_task_card_generated',
            tempAssociationFields,
            title: 'Existing title',
          },
        },
      });
    });

    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenLastCalledWith({
        filterByTk: 20,
        values: {
          config: {
            ccUid: 'cc_interface_generated',
            taskCardUid: 'cc_task_card_generated',
            tempAssociationFields,
            title: 'Existing title',
          },
        },
      });
    });
  });

  it('blocks parent form submission while task-card temporary association fields are being persisted', async () => {
    let resolveTempAssociationUpdate: () => void;
    const tempAssociationUpdate = new Promise<void>((resolve) => {
      resolveTempAssociationUpdate = resolve;
    });
    const onFinish = vi.fn();
    const tempAssociationFields = [{ nodeId: 1, nodeKey: 'trigger-node', nodeType: 'node' }];
    holder.flowNodesUpdate.mockReturnValue(tempAssociationUpdate);
    holder.node.config = {
      taskCardUid: 'cc_task_card_existing',
      title: 'Existing title',
      users: ['1'],
    };
    const model = createModel('cc_task_card_existing', 'CCTaskCardDetailsModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput(
      { configKey: 'taskCardUid', kind: 'taskCard' },
      { taskCardUid: 'cc_task_card_existing', title: 'Existing title', users: ['1'] },
      { onFinish, registeredConfigFields: ['tempAssociationFields', 'title', 'users'] },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await screen.findByTestId('flow-model');
    const syncDefinition = holder.contextDefinitions.find((item) => item.name === 'ccTaskTempAssociationSync');
    const sync = (syncDefinition?.value as { get?: () => (fields: typeof tempAssociationFields) => void })?.get?.();
    expect(sync).toBeInstanceOf(Function);

    act(() => {
      sync?.(tempAssociationFields);
    });

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledWith({
        filterByTk: 20,
        values: {
          config: {
            taskCardUid: 'cc_task_card_existing',
            tempAssociationFields,
            title: 'Existing title',
            users: ['1'],
          },
        },
      });
    });
    await expect(holder.form?.validateFields()).rejects.toMatchObject({
      errorFields: [
        {
          name: ['config'],
        },
      ],
    });
    act(() => {
      holder.form?.submit();
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(onFinish).not.toHaveBeenCalled();

    expect(resolveTempAssociationUpdate).toBeDefined();
    await act(async () => {
      resolveTempAssociationUpdate?.();
      await tempAssociationUpdate;
    });
    await expect(holder.form?.validateFields()).resolves.toBeDefined();
    act(() => {
      holder.form?.submit();
    });
    await waitFor(() => {
      expect(onFinish).toHaveBeenCalled();
    });
    expect(onFinish.mock.calls.at(-1)?.[0]).toEqual({
      config: {
        taskCardUid: 'cc_task_card_existing',
        tempAssociationFields,
        title: 'Existing title',
        users: ['1'],
      },
    });
  });

  it('blocks parent form submission while regenerating a mismatched generated uid', async () => {
    let resolveRegeneratedUpdate: () => void;
    const regeneratedUpdate = new Promise<void>((resolve) => {
      resolveRegeneratedUpdate = resolve;
    });
    holder.randomId.mockReturnValueOnce('cc_interface_generated').mockReturnValueOnce('cc_interface_regenerated');
    holder.flowNodesUpdate.mockResolvedValueOnce({}).mockReturnValueOnce(regeneratedUpdate);
    const mismatchedModel = createModel('cc_interface_generated', 'CCTaskCardDetailsModel');
    const regeneratedModel = createModel('cc_interface_regenerated', 'CCChildPageModel');
    holder.loadOrCreateModel.mockResolvedValueOnce(mismatchedModel).mockResolvedValueOnce(regeneratedModel);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'ccUid', kind: 'interface' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledTimes(2);
    });
    await expect(holder.form?.validateFields()).rejects.toMatchObject({
      errorFields: [
        {
          name: ['config'],
        },
      ],
    });

    expect(resolveRegeneratedUpdate).toBeDefined();
    await act(async () => {
      resolveRegeneratedUpdate?.();
      await regeneratedUpdate;
    });

    await screen.findByTestId('flow-model');
    await expect(holder.form?.validateFields()).resolves.toBeDefined();
    expect(holder.form?.getFieldValue(['config', 'ccUid'])).toBe('cc_interface_regenerated');
  });

  it('does not load a regenerated mismatched model when the regenerated uid is not persisted', async () => {
    holder.randomId.mockReturnValueOnce('cc_interface_generated').mockReturnValueOnce('cc_interface_regenerated');
    holder.flowNodesUpdate.mockResolvedValue({});
    const mismatchedModel = createModel('cc_interface_generated', 'CCTaskCardDetailsModel');
    const regeneratedModel = createModel('cc_interface_regenerated', 'CCChildPageModel');
    holder.loadOrCreateModel
      .mockImplementationOnce(async () => {
        holder.node.id = undefined;
        return mismatchedModel;
      })
      .mockResolvedValueOnce(regeneratedModel);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'ccUid', kind: 'interface' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(holder.randomId).toHaveBeenCalledTimes(2);
    });
    expect(holder.loadOrCreateModel).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('flow-model')).not.toBeInTheDocument();
    expect(holder.form?.getFieldValue(['config', 'ccUid'])).toBe('cc_interface_generated');
  });

  it('blocks parent form submission after a generated uid is persisted until the dialog model is resolved', async () => {
    let resolveModelLoad: (model: RenderableModel) => void;
    const modelLoad = new Promise<RenderableModel>((resolve) => {
      resolveModelLoad = resolve;
    });
    holder.randomId.mockReturnValue('cc_interface_generated');
    holder.flowNodesUpdate.mockResolvedValue({});
    holder.loadOrCreateModel.mockReturnValue(modelLoad);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'ccUid', kind: 'interface' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(holder.viewerDialog).toHaveBeenCalled();
    });
    await expect(holder.form?.validateFields()).rejects.toMatchObject({
      errorFields: [
        {
          name: ['config'],
        },
      ],
    });

    expect(resolveModelLoad).toBeDefined();
    await act(async () => {
      resolveModelLoad?.(createModel('cc_interface_generated', 'CCChildPageModel'));
      await modelLoad;
    });

    await screen.findByTestId('flow-model');
    await expect(holder.form?.validateFields()).resolves.toBeDefined();
  });

  it('blocks parent form submit while a generated uid dialog model is unresolved', async () => {
    let resolveModelLoad: (model: RenderableModel) => void;
    const modelLoad = new Promise<RenderableModel>((resolve) => {
      resolveModelLoad = resolve;
    });
    const onFinish = vi.fn();
    const onFinishFailed = vi.fn();
    holder.randomId.mockReturnValue('cc_interface_generated');
    holder.flowNodesUpdate.mockResolvedValue({});
    holder.loadOrCreateModel.mockReturnValue(modelLoad);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'ccUid', kind: 'interface' }, {}, { onFinish, onFinishFailed });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(holder.viewerDialog).toHaveBeenCalled();
    });
    act(() => {
      holder.form?.submit();
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(onFinish).not.toHaveBeenCalled();
    expect(onFinishFailed).not.toHaveBeenCalled();

    expect(resolveModelLoad).toBeDefined();
    await act(async () => {
      resolveModelLoad?.(createModel('cc_interface_generated', 'CCChildPageModel'));
      await modelLoad;
    });

    await screen.findByTestId('flow-model');
    act(() => {
      holder.form?.submit();
    });
    await waitFor(() => {
      expect(onFinish).toHaveBeenCalled();
    });
    expect(onFinish.mock.calls.at(-1)?.[0]).toEqual({
      config: {
        ccUid: 'cc_interface_generated',
      },
    });
  });

  it('releases the pending generated uid guard when the dialog closes before the model is resolved', async () => {
    let resolveModelLoad: (model: RenderableModel) => void;
    const modelLoad = new Promise<RenderableModel>((resolve) => {
      resolveModelLoad = resolve;
    });
    holder.randomId.mockReturnValue('cc_interface_generated');
    holder.flowNodesUpdate.mockResolvedValue({});
    holder.loadOrCreateModel.mockReturnValue(modelLoad);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'ccUid', kind: 'interface' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(holder.viewerDialog).toHaveBeenCalled();
    });
    await expect(holder.form?.validateFields()).rejects.toMatchObject({
      errorFields: [
        {
          name: ['config'],
        },
      ],
    });

    await act(async () => {
      holder.viewerDialog.mock.calls.at(-1)?.[0]?.onClose?.();
    });
    await expect(holder.form?.validateFields()).resolves.toBeDefined();

    expect(resolveModelLoad).toBeDefined();
    await act(async () => {
      resolveModelLoad?.(createModel('cc_interface_generated', 'CCChildPageModel'));
      await modelLoad;
    });
  });

  it('does not let one dialog close release another generated uid guard', async () => {
    let resolveFirstModelLoad: (model: RenderableModel) => void;
    let resolveSecondUpdate: () => void;
    const firstModelLoad = new Promise<RenderableModel>((resolve) => {
      resolveFirstModelLoad = resolve;
    });
    const secondUpdate = new Promise<void>((resolve) => {
      resolveSecondUpdate = resolve;
    });
    holder.randomId.mockReturnValueOnce('cc_interface_generated').mockReturnValueOnce('cc_task_card_generated');
    holder.flowNodesUpdate.mockResolvedValueOnce({}).mockReturnValueOnce(secondUpdate);
    holder.loadOrCreateModel.mockReturnValue(firstModelLoad);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderConfigInputs({ title: 'Existing title' });
    const buttons = screen.getAllByRole('button', { name: 'Go to configure' });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(holder.viewerDialog).toHaveBeenCalledTimes(1);
    });
    expect(resolveFirstModelLoad).toBeDefined();
    await act(async () => {
      resolveFirstModelLoad?.(createModel('cc_interface_generated', 'CCChildPageModel'));
      await firstModelLoad;
    });
    await expect(holder.form?.validateFields()).resolves.toBeDefined();

    fireEvent.click(buttons[1]);
    await waitFor(() => {
      expect(holder.flowNodesUpdate).toHaveBeenCalledTimes(2);
    });
    await expect(holder.form?.validateFields()).rejects.toMatchObject({
      errorFields: [
        {
          name: ['config'],
        },
      ],
    });

    await act(async () => {
      holder.viewerDialog.mock.calls[0]?.[0]?.onClose?.();
    });
    await expect(holder.form?.validateFields()).rejects.toMatchObject({
      errorFields: [
        {
          name: ['config'],
        },
      ],
    });

    expect(resolveSecondUpdate).toBeDefined();
    await act(async () => {
      resolveSecondUpdate?.();
      await secondUpdate;
    });
  });

  it('preloads task-card field menu model classes before rendering the task-card model', async () => {
    holder.randomId.mockReturnValue('cc_task_card_generated');
    const model = createModel('cc_task_card_generated', 'CCTaskCardDetailsModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'taskCardUid', kind: 'taskCard' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await screen.findByTestId('flow-model');
    expect(holder.getModelClassAsync).toHaveBeenCalledWith('CCTaskCardDetailsItemModel');
    expect(holder.getModelClassAsync).toHaveBeenCalledWith('CCTaskCardDetailsAssociationFieldGroupModel');
    expect(holder.getModelClassAsync).toHaveBeenCalledWith('TaskCardCommonItemModel');
  });

  it('preloads the field-template importer when UI templates are enabled', async () => {
    holder.pluginManagerGet.mockImplementation((name: string) => (name === 'ui-templates' ? {} : undefined));
    holder.randomId.mockReturnValue('cc_task_card_generated');
    const model = createModel('cc_task_card_generated', 'CCTaskCardDetailsModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'taskCardUid', kind: 'taskCard' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await screen.findByTestId('flow-model');
    expect(holder.getModelClassAsync).toHaveBeenCalledWith('SubModelTemplateImporterModel');
  });

  it('does not request the optional field-template importer when UI templates are unavailable', async () => {
    holder.pluginManagerGet.mockReturnValue(undefined);
    holder.randomId.mockReturnValue('cc_task_card_generated');
    const model = createModel('cc_task_card_generated', 'CCTaskCardDetailsModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));

    renderInput({ configKey: 'taskCardUid', kind: 'taskCard' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await screen.findByTestId('flow-model');
    expect(holder.getModelClassAsync).not.toHaveBeenCalledWith('SubModelTemplateImporterModel');
  });
});
