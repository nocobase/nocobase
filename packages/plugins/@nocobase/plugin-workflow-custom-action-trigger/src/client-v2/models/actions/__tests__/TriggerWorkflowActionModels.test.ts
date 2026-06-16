/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionGroupModel,
  CollectionActionGroupModel,
  FormActionGroupModel,
  RecordActionGroupModel,
} from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CollectionTriggerWorkflowActionModel,
  FormTriggerWorkflowActionModel,
  RecordTriggerWorkflowActionModel,
  registerTriggerWorkflowActionGroups,
  WorkbenchTriggerWorkflowActionModel,
} from '../TriggerWorkflowActionModels';

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
    | { handler?: (ctx: any, params: { group?: unknown[] }) => Promise<void> }
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
      data: { values: undefined },
    });
    expect(ctx.message.error).not.toHaveBeenCalled();
    expect(ctx.message.success).not.toHaveBeenCalled();
    expect(ctx.exit).not.toHaveBeenCalled();
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
