/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionGroupModel, ActionModel } from '@nocobase/client-v2';
import { tExpr } from '../../locale';

export class CommentActionModel extends ActionModel {}

export class CommentActionGroupModel extends ActionGroupModel {
  static baseClass = CommentActionModel;
}

CommentActionGroupModel.define({
  label: tExpr('Comment action'),
});
