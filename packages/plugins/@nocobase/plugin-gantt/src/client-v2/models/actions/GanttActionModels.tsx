/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionGroupModel, ActionModel, ActionSceneEnum, CollectionActionGroupModel } from '@nocobase/client-v2';
import { buildSubModelItem, type FlowModelContext } from '@nocobase/flow-engine';
import { tExpr } from '../../locale';

export const ALLOWED_GANTT_COLLECTION_ACTIONS = [
  'GanttTodayActionModel',
  'FilterActionModel',
  'AddNewActionModel',
  'PopupCollectionActionModel',
  'BulkDeleteActionModel',
  'LinkActionModel',
  'RefreshActionModel',
  'BulkEditActionModel',
  'BulkUpdateActionModel',
  'ExportActionModel',
  'ImportActionModel',
  'CollectionTriggerWorkflowActionModel',
  'CustomRequestActionModel',
  'AIEmployeeActionModel',
  'JSItemActionModel',
  'JSCollectionActionModel',
];

const getGanttActionModelClass = (
  modelName: string,
  ctx: FlowModelContext,
  actionGroupModel: typeof ActionGroupModel,
) =>
  (ctx.engine.getModelClass(modelName) ||
    actionGroupModel.models.get(modelName) ||
    CollectionActionGroupModel.models.get(modelName)) as typeof ActionModel | undefined;

const isGanttActionContext = (ctx: FlowModelContext) => {
  const blockModel = ctx.blockModel || ctx.model;

  return (
    blockModel?.constructor?.name === 'GanttBlockModel' ||
    blockModel?.use === 'GanttBlockModel' ||
    blockModel?.getModelClassName?.('CollectionActionGroupModel') === 'GanttCollectionActionGroupModel'
  );
};

export class GanttCollectionActionGroupModel extends ActionGroupModel {
  static async defineChildren(ctx: FlowModelContext) {
    const items = [];

    for (const modelName of ALLOWED_GANTT_COLLECTION_ACTIONS) {
      const ModelClass = getGanttActionModelClass(modelName, ctx, this);
      if (!ModelClass) {
        continue;
      }
      if (!this.isActionModelVisible(ModelClass, ctx)) {
        continue;
      }
      if (!ModelClass._isScene?.(ActionSceneEnum.collection)) {
        continue;
      }

      const item = await buildSubModelItem(ModelClass, ctx);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }
}

GanttCollectionActionGroupModel.define({
  label: tExpr('Gantt action'),
});

export class GanttTodayActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps = {
    type: 'default' as const,
    title: tExpr('Today'),
    icon: 'AimOutlined',
  };
}

GanttTodayActionModel.define({
  label: tExpr('Today'),
  toggleable: true,
  sort: 10,
  hide(ctx) {
    return !isGanttActionContext(ctx);
  },
});

GanttTodayActionModel.registerFlow({
  key: 'todaySettings',
  title: tExpr('Today'),
  on: 'click',
  steps: {
    scrollToToday: {
      handler(ctx) {
        ctx.blockModel?.scrollToToday?.();
      },
    },
  },
});

GanttCollectionActionGroupModel.registerActionModels({
  GanttTodayActionModel,
});
