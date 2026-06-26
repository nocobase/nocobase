/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  contextDefinitions: [] as Array<{ name: string; value: unknown }>,
  flowModelRendererProps: [] as Array<{ model?: RenderableModel; showFlowSettings?: unknown }>,
  getModelClassAsync: vi.fn(),
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

function renderInput(props: Partial<React.ComponentProps<typeof FlowModelConfigInput>> = {}) {
  function Wrapper() {
    const [form] = Form.useForm();
    return (
      <Form form={form} initialValues={{ config: {} }}>
        <Form.Item name={['config', props.configKey ?? 'ccUid']}>
          <FlowModelConfigInput configKey="ccUid" kind="interface" {...props} />
        </Form.Item>
      </Form>
    );
  }

  return render(<Wrapper />);
}

afterEach(() => {
  vi.clearAllMocks();
  holder.contextDefinitions = [];
  holder.flowModelRendererProps = [];
});

const tokenDerivedDialogWidth = 808;

describe('FlowModelConfigInput', () => {
  it('creates and renders the CC user interface FlowModel with default child structure', async () => {
    holder.randomId.mockReturnValue('cc_interface_generated');
    const model = createModel('cc_interface_generated', 'CCChildPageModel');
    holder.loadOrCreateModel.mockResolvedValue(model);
    holder.viewerDialog.mockImplementation(({ content }) => render(content()));
    const onChange = vi.fn();

    renderInput({ onChange });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    expect(onChange).toHaveBeenCalledWith('cc_interface_generated');
    expect(holder.viewerDialog).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'User interface', width: tokenDerivedDialogWidth }),
    );
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

    renderInput({ value: 'cc_existing' });
    fireEvent.click(screen.getByRole('button', { name: 'Go to configure' }));

    await waitFor(() => {
      expect(model.addSubModel).toHaveBeenCalledWith('tabs', expect.objectContaining({ use: 'CCChildPageTabModel' }));
    });
    expect(holder.modelSave).toHaveBeenCalled();
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
      expect.objectContaining({ title: 'Task card', width: tokenDerivedDialogWidth }),
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
