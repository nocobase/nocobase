/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionGroupModel, ActionModel, ActionSceneEnum, JSActionModel, JSItemActionModel } from '@nocobase/client-v2';
import { buildSubModelItem, type FlowModelContext } from '@nocobase/flow-engine';

import { tExpr } from '../../locale';

const ALLOWED_RECORD_COMMENT_SUBMIT_ACTIONS = ['AIEmployeeActionModel', 'JSItemActionModel', 'JSActionModel'];

export class RecordCommentActionModel extends ActionModel {}

export class RecordCommentActionGroupModel extends ActionGroupModel {
  static baseClass = RecordCommentActionModel;
}

export class RecordCommentSubmitActionGroupModel extends ActionGroupModel {
  static async defineChildren(ctx: FlowModelContext) {
    const items = [];

    for (const modelName of ALLOWED_RECORD_COMMENT_SUBMIT_ACTIONS) {
      const ModelClass = (ctx.engine.getModelClass(modelName) || this.models.get(modelName)) as
        | typeof ActionModel
        | undefined;

      if (!ModelClass) {
        continue;
      }
      if (!this.isActionModelVisible(ModelClass, ctx)) {
        continue;
      }
      if (!ModelClass._isScene?.(ActionSceneEnum.all)) {
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

RecordCommentActionGroupModel.define({
  label: tExpr('Record comment action'),
});

RecordCommentSubmitActionGroupModel.define({
  label: tExpr('Record comment action'),
});

RecordCommentActionGroupModel.registerActionModels({
  JSActionModel,
  JSItemActionModel,
});

RecordCommentSubmitActionGroupModel.registerActionModels({
  JSActionModel,
  JSItemActionModel,
});
