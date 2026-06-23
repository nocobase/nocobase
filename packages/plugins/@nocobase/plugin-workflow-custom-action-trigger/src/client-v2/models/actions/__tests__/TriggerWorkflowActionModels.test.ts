/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  ActionGroupModel,
  CollectionActionGroupModel,
  FormActionGroupModel,
  RecordActionGroupModel,
} from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { render, waitFor } from '@nocobase/test/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CollectionTriggerWorkflowActionModel,
  FormTriggerWorkflowActionModel,
  RecordTriggerWorkflowActionModel,
  registerTriggerWorkflowActionGroups,
  WorkbenchTriggerWorkflowActionModel,
  WorkflowSelect,
} from '../TriggerWorkflowActionModels';
import { CONTEXT_TYPE } from '../../../../common/constants';

const { mockUseFlowContext, selectMockState } = vi.hoisted(() => ({
  mockUseFlowContext: vi.fn(),
  selectMockState: {
    props: undefined as any,
  },
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: mockUseFlowContext,
  };
});

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    Select: (props: any) => {
      selectMockState.props = props;
      return React.createElement('div', { 'data-testid': 'workflow-select' });
    },
  };
});

class ActionPanelGroupActionModel extends ActionGroupModel {}

const triggerWorkflowActionModelNames = new Set([
  'CollectionTriggerWorkflowActionModel',
  'RecordTriggerWorkflowActionModel',
  'FormTriggerWorkflowActionModel',
  'WorkbenchTriggerWorkflowActionModel',
]);

const actionGroupModelClasses = [
  CollectionActionGroupModel,
  RecordActionGroupModel,
  FormActionGroupModel,
  ActionPanelGroupActionModel,
];

let actionGroupModelSnapshots: Array<[any, Map<string, any>]>;

function createEngine() {
  const flowEngine = new FlowEngine();
  flowEngine.registerModels({
    CollectionActionGroupModel,
    RecordActionGroupModel,
    FormActionGroupModel,
    ActionPanelGroupActionModel,
    FormTriggerWorkflowActionModel,
    RecordTriggerWorkflowActionModel,
    CollectionTriggerWorkflowActionModel,
    WorkbenchTriggerWorkflowActionModel,
  });

  return flowEngine;
}

function createCollectionContext(flowEngine: FlowEngine) {
  const dataSource = flowEngine.dataSourceManager.getDataSource('main');
  dataSource.addCollection({
    name: 'posts',
    filterTargetKey: 'id',
    availableActions: ['create', 'view', 'update', 'destroy'],
    fields: [{ name: 'id', type: 'integer', interface: 'number' }],
  });

  return {
    engine: flowEngine,
    dataSourceManager: flowEngine.dataSourceManager,
    collection: dataSource.getCollection('posts'),
  } as any;
}

function restoreActionGroupModels() {
  for (const [ModelClass, snapshot] of actionGroupModelSnapshots) {
    ModelClass.currentModels.clear();
    for (const [name, Model] of snapshot) {
      ModelClass.currentModels.set(name, Model);
    }
  }
}

function getTriggerWorkflowModelNames(ModelClass: any) {
  return Array.from(ModelClass.models.keys()).filter((name) => triggerWorkflowActionModelNames.has(name));
}

async function getTriggerWorkflowItemNames(ModelClass: any, ctx: any) {
  const items = await ModelClass.defineChildren(ctx);
  return items.map((item) => item.useModel).filter((name) => triggerWorkflowActionModelNames.has(name));
}

function getWorkbenchTriggerWorkflowHandler(model: WorkbenchTriggerWorkflowActionModel) {
  const step = model.getFlow('workbenchTriggerWorkflowsActionSettings')?.getStep('triggerWorkflows')?.serialize() as
    | { handler?: (ctx: any, params: { group?: unknown[]; contextData?: unknown }) => Promise<void> }
    | undefined;
  expect(step?.handler).toBeTypeOf('function');
  return step.handler;
}

function getCollectionTriggerHandler(model: CollectionTriggerWorkflowActionModel) {
  const step = model.getFlow('customCollectionTriggerWorkflowsActionEventSettings')?.getStep('trigger')?.serialize() as
    | { handler?: (ctx: any) => Promise<void> }
    | undefined;
  expect(step?.handler).toBeTypeOf('function');
  return step.handler;
}

describe('trigger workflow action model registration', () => {
  beforeEach(() => {
    actionGroupModelSnapshots = actionGroupModelClasses.map((ModelClass) => [
      ModelClass,
      new Map(ModelClass.currentModels),
    ]);
    mockUseFlowContext.mockReset();
    selectMockState.props = undefined;
  });

  afterEach(() => {
    restoreActionGroupModels();
  });

  it('registers trigger workflow actions only to their matching action groups', () => {
    const flowEngine = createEngine();

    registerTriggerWorkflowActionGroups(flowEngine);

    expect(getTriggerWorkflowModelNames(CollectionActionGroupModel)).toEqual(['CollectionTriggerWorkflowActionModel']);
    expect(getTriggerWorkflowModelNames(RecordActionGroupModel)).toEqual(['RecordTriggerWorkflowActionModel']);
    expect(getTriggerWorkflowModelNames(FormActionGroupModel)).toEqual(['FormTriggerWorkflowActionModel']);
    expect(getTriggerWorkflowModelNames(ActionPanelGroupActionModel)).toEqual(['WorkbenchTriggerWorkflowActionModel']);
  });

  it('does not duplicate trigger workflow items in data block action menus', async () => {
    const flowEngine = createEngine();
    const ctx = createCollectionContext(flowEngine);

    registerTriggerWorkflowActionGroups(flowEngine);

    expect(await getTriggerWorkflowItemNames(CollectionActionGroupModel, ctx)).toEqual([
      'CollectionTriggerWorkflowActionModel',
    ]);
    expect(await getTriggerWorkflowItemNames(RecordActionGroupModel, ctx)).toEqual([
      'RecordTriggerWorkflowActionModel',
    ]);
    expect(await getTriggerWorkflowItemNames(FormActionGroupModel, ctx)).toEqual(['FormTriggerWorkflowActionModel']);
    expect(await getTriggerWorkflowItemNames(ActionPanelGroupActionModel, ctx)).toEqual([
      'WorkbenchTriggerWorkflowActionModel',
    ]);
  });
});

describe('WorkbenchTriggerWorkflowActionModel', () => {
  it('loads workflows through resource list so boolean filters stay typed', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ title: 'Workflow 1', key: 'workflow-1' }],
      },
    });
    const resource = vi.fn().mockReturnValue({ list });
    const request = vi.fn();

    mockUseFlowContext.mockReturnValue({
      api: {
        resource,
        request,
      },
    });

    render(
      React.createElement(WorkflowSelect, {
        filter: { 'config.collection': 'posts' },
        optionFilter: () => true,
      }),
    );

    await waitFor(() => {
      expect(resource).toHaveBeenCalledWith('workflows');
      expect(list).toHaveBeenCalledWith({
        paginate: false,
        filter: {
          type: 'custom-action',
          enabled: true,
          'config.collection': 'posts',
        },
      });
    });

    expect(request).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(selectMockState.props?.options).toEqual([{ label: 'Workflow 1', value: 'workflow-1' }]);
    });
  });

  it('does not send trigger request when no workflow is bound', async () => {
    const flowEngine = createEngine();
    const model = flowEngine.createModel<WorkbenchTriggerWorkflowActionModel>({
      use: 'WorkbenchTriggerWorkflowActionModel',
      uid: 'workbench-trigger-workflow-action',
    });
    const request = vi.fn();
    const ctx = {
      api: {
        request,
      },
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (value: string) => value,
      exit: vi.fn(),
    };

    const handler = getWorkbenchTriggerWorkflowHandler(model);

    await handler(ctx, {});

    expect(request).not.toHaveBeenCalled();
    expect(ctx.message.error).toHaveBeenCalledWith(
      'Button is not configured properly, please contact the administrator.',
    );
    expect(ctx.message.success).not.toHaveBeenCalled();
    expect(ctx.exit).toHaveBeenCalled();
  });

  it('sends trigger request without showing duplicate success message when workflow is bound', async () => {
    const flowEngine = createEngine();
    const model = flowEngine.createModel<WorkbenchTriggerWorkflowActionModel>({
      use: 'WorkbenchTriggerWorkflowActionModel',
      uid: 'workbench-trigger-workflow-action-bound',
    });
    const request = vi.fn().mockResolvedValue({});
    const ctx = {
      api: {
        request,
      },
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (value: string) => value,
      exit: vi.fn(),
    };

    const handler = getWorkbenchTriggerWorkflowHandler(model);

    await handler(ctx, { group: [{ workflowKey: 'workflow-1' }] });

    expect(request).toHaveBeenCalledWith({
      url: 'workflows:trigger',
      method: 'post',
      params: {
        triggerWorkflows: 'workflow-1',
      },
      data: undefined,
    });
    expect(ctx.message.error).not.toHaveBeenCalled();
    expect(ctx.message.success).not.toHaveBeenCalled();
    expect(ctx.exit).not.toHaveBeenCalled();
  });

  it('sends custom context data as trigger request body', async () => {
    const flowEngine = createEngine();
    const model = flowEngine.createModel<WorkbenchTriggerWorkflowActionModel>({
      use: 'WorkbenchTriggerWorkflowActionModel',
      uid: 'workbench-trigger-workflow-action-context-data',
    });
    const request = vi.fn().mockResolvedValue({});
    const ctx = {
      api: {
        request,
      },
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (value: string) => value,
      exit: vi.fn(),
    };

    const handler = getWorkbenchTriggerWorkflowHandler(model);

    await handler(ctx, {
      group: [{ workflowKey: 'workflow-1' }],
      contextData: {
        a: '1',
        userId: '{{$user.id}}',
        nested: {
          b: '2',
        },
      },
    });

    expect(request).toHaveBeenCalledWith({
      url: 'workflows:trigger',
      method: 'post',
      params: {
        triggerWorkflows: 'workflow-1',
      },
      data: {
        a: '1',
        userId: '{{$user.id}}',
        nested: {
          b: '2',
        },
      },
    });
    expect(ctx.message.error).not.toHaveBeenCalled();
    expect(ctx.message.success).not.toHaveBeenCalled();
    expect(ctx.exit).not.toHaveBeenCalled();
  });

  it('resolves custom context data before sending trigger request body', async () => {
    const flowEngine = createEngine();
    const model = flowEngine.createModel<WorkbenchTriggerWorkflowActionModel>({
      use: 'WorkbenchTriggerWorkflowActionModel',
      uid: 'workbench-trigger-workflow-action-context-data-resolved',
    });
    const request = vi.fn().mockResolvedValue({});
    const resolveJsonTemplate = vi.fn(async () => ({
      a: '1',
      userId: 100,
      nested: {
        b: '2',
      },
    }));
    const ctx = {
      api: {
        request,
      },
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      resolveJsonTemplate,
      t: (value: string) => value,
      exit: vi.fn(),
    };

    const handler = getWorkbenchTriggerWorkflowHandler(model);

    await handler(ctx, {
      group: [{ workflowKey: 'workflow-1' }],
      contextData: {
        a: '1',
        userId: '{{$user.id}}',
        nested: {
          b: '2',
        },
      },
    });

    expect(resolveJsonTemplate).toHaveBeenCalledWith({
      a: '1',
      userId: '{{$user.id}}',
      nested: {
        b: '2',
      },
    });
    expect(request).toHaveBeenCalledWith({
      url: 'workflows:trigger',
      method: 'post',
      params: {
        triggerWorkflows: 'workflow-1',
      },
      data: {
        a: '1',
        userId: 100,
        nested: {
          b: '2',
        },
      },
    });
  });

  it('exits flow when trigger request fails', async () => {
    const flowEngine = createEngine();
    const model = flowEngine.createModel<WorkbenchTriggerWorkflowActionModel>({
      use: 'WorkbenchTriggerWorkflowActionModel',
      uid: 'workbench-trigger-workflow-action-failed',
    });
    const request = vi.fn().mockRejectedValue(new Error('trigger failed'));
    const ctx = {
      api: {
        request,
      },
      message: {
        error: vi.fn(),
        success: vi.fn(),
      },
      t: (value: string) => value,
      exit: vi.fn(),
    };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = getWorkbenchTriggerWorkflowHandler(model);

    await handler(ctx, { group: [{ workflowKey: 'workflow-1' }] });

    expect(request).toHaveBeenCalled();
    expect(ctx.message.success).not.toHaveBeenCalled();
    expect(ctx.exit).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('CollectionTriggerWorkflowActionModel', () => {
  it('resolves custom context data before sending trigger request body', async () => {
    const flowEngine = createEngine();
    const model = flowEngine.createModel<CollectionTriggerWorkflowActionModel>({
      use: 'CollectionTriggerWorkflowActionModel',
      uid: 'collection-trigger-workflow-action-context-data-resolved',
    });
    model.setStepParams('customCollectionTriggerWorkflowsActionSettings', 'setContextType', {
      type: CONTEXT_TYPE.GLOBAL,
    });
    model.setStepParams('customCollectionTriggerWorkflowsActionSettings', 'triggerWorkflows', {
      group: [{ workflowKey: 'workflow-1' }],
      contextData: {
        title: 'hello',
        currentUserId: '{{$user.id}}',
      },
    });

    const request = vi.fn().mockResolvedValue({});
    const resolveJsonTemplate = vi.fn(async () => ({
      title: 'hello',
      currentUserId: 200,
    }));
    const ctx = {
      api: {
        request,
      },
      message: {
        error: vi.fn(),
        warning: vi.fn(),
        success: vi.fn(),
      },
      model,
      resolveJsonTemplate,
      t: (value: string) => value,
      exit: vi.fn(),
    };

    const handler = getCollectionTriggerHandler(model);

    await handler(ctx);

    expect(resolveJsonTemplate).toHaveBeenCalledWith({
      title: 'hello',
      currentUserId: '{{$user.id}}',
    });
    expect(request).toHaveBeenCalledWith({
      url: 'workflows:trigger',
      method: 'post',
      params: {
        triggerWorkflows: 'workflow-1',
      },
      data: {
        title: 'hello',
        currentUserId: 200,
      },
    });
    expect(ctx.exit).not.toHaveBeenCalled();
  });
});
