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
import { LEGACY_NAMESPACE, NAMESPACE, tExpr } from '../../locale';

export const ALLOWED_GANTT_COLLECTION_ACTIONS = [
  'GanttExpandCollapseActionModel',
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

const resolveGanttBlockModel = (ctx: FlowModelContext) => {
  const model = ctx.blockModel || ctx.model;
  if (isGanttActionContext(ctx)) {
    return model as any;
  }
  return undefined;
};

const getTreeCollectionState = (ctx: FlowModelContext) => {
  const blockModel = resolveGanttBlockModel(ctx);
  const collection = ctx.collection || blockModel?.collection;
  const isTreeCollection =
    blockModel?.isTreeCollection?.() ||
    collection?.template === 'tree' ||
    collection?.options?.template === 'tree' ||
    !!collection?.tree;
  const treeTableEnabled =
    blockModel?.isTreeTableEnabled?.() || blockModel?.props?.treeTable === true || blockModel?.treeTable === true;

  return {
    blockModel,
    isTreeCollection,
    treeTableEnabled,
  };
};

const withGanttBlockModel = (ctx: FlowModelContext, blockModel: any) => {
  if (!blockModel || ctx.blockModel) {
    return ctx;
  }

  if (typeof (ctx as any).defineProperty === 'function') {
    (ctx as any).defineProperty('blockModel', { value: blockModel });
    return ctx;
  }

  return {
    ...ctx,
    blockModel,
  } as unknown as FlowModelContext;
};

export class GanttCollectionActionGroupModel extends ActionGroupModel {
  static async defineChildren(ctx: FlowModelContext) {
    const normalizedCtx = withGanttBlockModel(ctx, resolveGanttBlockModel(ctx));
    const items = [];

    for (const modelName of ALLOWED_GANTT_COLLECTION_ACTIONS) {
      const ModelClass = getGanttActionModelClass(modelName, normalizedCtx, this);
      if (!ModelClass) {
        continue;
      }
      if (!this.isActionModelVisible(ModelClass, normalizedCtx)) {
        continue;
      }
      if (!ModelClass._isScene?.(ActionSceneEnum.collection)) {
        continue;
      }

      const item = await buildSubModelItem(ModelClass, normalizedCtx);
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

export class GanttExpandCollapseActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  expandFlag = false;

  defaultProps = {
    type: 'default' as const,
    title: tExpr('Expand all'),
    icon: 'NodeExpandOutlined',
  };

  getTitle() {
    return this.context.t(this.expandFlag ? 'Collapse all' : 'Expand all', {
      ns: [NAMESPACE, LEGACY_NAMESPACE, 'client'],
      nsMode: 'fallback',
    });
  }

  setExpandFlag(flag: boolean) {
    this.expandFlag = flag;
    this.setProps({
      icon: flag ? 'NodeCollapseOutlined' : 'NodeExpandOutlined',
    });
  }
}

GanttExpandCollapseActionModel.define({
  label: tExpr('Expand/Collapse'),
  toggleable: true,
  sort: 11,
  hide(ctx) {
    const { blockModel, isTreeCollection, treeTableEnabled } = getTreeCollectionState(ctx);
    return !blockModel || !isTreeCollection || !treeTableEnabled;
  },
});

GanttExpandCollapseActionModel.registerFlow({
  key: 'expandCollapseSettingsInit',
  sort: 200,
  steps: {
    init: {
      handler(ctx) {
        ctx.model.setExpandFlag(!!ctx.blockModel?.isTreeExpanded?.());
      },
    },
  },
});

GanttExpandCollapseActionModel.registerFlow({
  key: 'expandCollapseSettings',
  title: tExpr('Expand/Collapse'),
  on: 'click',
  steps: {
    expandCollapse: {
      handler(ctx) {
        if (!ctx.blockModel?.isTreeTableEnabled?.()) {
          return;
        }
        ctx.blockModel.toggleAllTreeRows?.();
        ctx.model.setExpandFlag(!ctx.blockModel.isTreeExpanded?.());
      },
    },
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
  GanttExpandCollapseActionModel,
  GanttTodayActionModel,
});
