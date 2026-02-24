/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { ActionSceneEnum } from '@nocobase/client';
import { CommentActionModel } from './CommentActionGroupModel';

export class EditCommentActionModel extends CommentActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: escapeT('Edit'),
  };

  getAclActionName() {
    return 'update';
  }
}

EditCommentActionModel.define({
  label: escapeT('Edit'),
  toggleable: true,
});

EditCommentActionModel.registerFlow({
  key: 'editCommentSettings',
  on: 'click',
  steps: {
    edit: {
      async handler(ctx, params) {
        const itemModel = ctx.model;
        ctx.setEditing();
      },
    },
  },
});
