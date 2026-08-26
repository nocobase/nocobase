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
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
