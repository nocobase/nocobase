/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionSceneEnum } from '@nocobase/client-v2';
import type { ButtonProps } from 'antd/es/button';
import { tExpr } from '../../locale';
import { CommentActionModel } from './CommentActionGroupModel';

export class EditCommentActionModel extends CommentActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    type: 'link',
    title: tExpr('Edit'),
  };

  getAclActionName() {
    return 'update';
  }
}

EditCommentActionModel.define({
  label: tExpr('Edit'),
  toggleable: true,
});

EditCommentActionModel.registerFlow({
  key: 'editCommentSettings',
  on: 'click',
  steps: {
    edit: {
      async handler(ctx) {
        ctx.setEditing();
      },
    },
  },
});
