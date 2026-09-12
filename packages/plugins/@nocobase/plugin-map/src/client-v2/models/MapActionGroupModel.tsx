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
import { tExpr } from '../locale';

export const ALLOWED_MAP_ACTION_MODELS = [
  'FilterActionModel',
  'AddNewActionModel',
  'PopupCollectionActionModel',
  'LinkActionModel',
  'RefreshActionModel',
  'CustomRequestActionModel',
  'AIEmployeeActionModel',
  'JSItemActionModel',
  'JSCollectionActionModel',
];

const getMapActionModelClass = (modelName: string, ctx: FlowModelContext) =>
  (ctx.engine.getModelClass(modelName) || CollectionActionGroupModel.models.get(modelName)) as
    | typeof ActionModel
    | undefined;

export class MapActionGroupModel extends ActionGroupModel {
  static async defineChildren(ctx: FlowModelContext) {
    const items = [];

    for (const modelName of ALLOWED_MAP_ACTION_MODELS) {
      const ModelClass = getMapActionModelClass(modelName, ctx);
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

MapActionGroupModel.define({
  label: tExpr('Map action'),
});
