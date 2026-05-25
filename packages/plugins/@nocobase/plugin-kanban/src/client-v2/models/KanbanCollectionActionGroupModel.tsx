/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionGroupModel, ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { buildSubModelItem, escapeT, type FlowModelContext } from '@nocobase/flow-engine';

const ALLOWED_KANBAN_COLLECTION_ACTIONS = [
  'AddNewActionModel',
  'PopupCollectionActionModel',
  'FilterActionModel',
  'LinkActionModel',
  'RefreshActionModel',
  'CustomRequestActionModel',
  'AIEmployeeActionModel',
  'JSItemActionModel',
  'JSCollectionActionModel',
];

export class KanbanCollectionActionGroupModel extends ActionGroupModel {
  static async defineChildren(ctx: FlowModelContext) {
    const items = [];

    for (const modelName of ALLOWED_KANBAN_COLLECTION_ACTIONS) {
      const ModelClass = ctx.engine.getModelClass(modelName) as typeof ActionModel | undefined;
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

KanbanCollectionActionGroupModel.define({
  label: escapeT('Kanban action', { ns: 'kanban' }),
});
