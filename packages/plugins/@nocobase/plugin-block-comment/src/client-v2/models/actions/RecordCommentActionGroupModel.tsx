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
  ActionModel,
  ActionSceneEnum,
  CollectionActionGroupModel,
  JSActionModel,
  JSItemActionModel,
  RecordActionGroupModel,
} from '@nocobase/client-v2';
import { buildSubModelItem, type FlowModelContext } from '@nocobase/flow-engine';

import { tExpr } from '../../locale';
import { RecordCommentSubmitActionModel } from './RecordCommentSubmitActionModel';

const ALLOWED_RECORD_COMMENT_SUBMIT_ACTIONS = [
  'RecordCommentSubmitActionModel',
  'AIEmployeeActionModel',
  'JSItemActionModel',
  'JSActionModel',
];
const ALLOWED_RECORD_COMMENT_RECORD_ACTIONS = ['AIEmployeeActionModel'];

const getRecordCommentActionModelClass = (
  modelName: string,
  ctx: FlowModelContext,
  actionGroupModel: typeof ActionGroupModel,
) =>
  (ctx.engine.getModelClass(modelName) ||
    actionGroupModel.models.get(modelName) ||
    CollectionActionGroupModel.models.get(modelName) ||
    RecordActionGroupModel.models.get(modelName)) as typeof ActionModel | undefined;

export class RecordCommentActionModel extends ActionModel {}

export class RecordCommentActionGroupModel extends ActionGroupModel {
  static baseClass = RecordCommentActionModel;

  static async defineChildren(ctx: FlowModelContext) {
    const items = await super.defineChildren(ctx);

    for (const modelName of ALLOWED_RECORD_COMMENT_RECORD_ACTIONS) {
      const ModelClass = getRecordCommentActionModelClass(modelName, ctx, this);
      if (!ModelClass) {
        continue;
      }
      if (items.some((item) => item.useModel === ModelClass.name)) {
        continue;
      }
      if (!this.isActionModelVisible(ModelClass, ctx)) {
        continue;
      }
      if (!ModelClass._isScene?.(ActionSceneEnum.record)) {
        continue;
      }

      const item = await buildSubModelItem(ModelClass, ctx);
      if (item) {
        items.push(item);
      }
    }

    return items.sort((a, b) => (a.sort ?? 1000) - (b.sort ?? 1000));
  }
}

export class RecordCommentSubmitActionGroupModel extends ActionGroupModel {
  static async defineChildren(ctx: FlowModelContext) {
    const items = [];

    for (const modelName of ALLOWED_RECORD_COMMENT_SUBMIT_ACTIONS) {
      const ModelClass = getRecordCommentActionModelClass(modelName, ctx, this);
      if (!ModelClass) {
        continue;
      }
      if (!this.isActionModelVisible(ModelClass, ctx)) {
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
  RecordCommentSubmitActionModel,
  JSActionModel,
  JSItemActionModel,
});
