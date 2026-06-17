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
import { getErrorMessage } from '../utils';
import { CommentActionModel } from './CommentActionGroupModel';

export class DeleteCommentActionModel extends CommentActionModel {
  static scene: typeof ActionSceneEnum.record = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    type: 'link',
    title: tExpr('Delete'),
  };

  getAclActionName() {
    return 'destroy';
  }
}

DeleteCommentActionModel.define({
  label: tExpr('Delete'),
  toggleable: true,
});

DeleteCommentActionModel.registerFlow({
  key: 'deleteSettings',
  title: tExpr('Delete settings'),
  on: 'click',
  steps: {
    confirm: {
      use: 'confirm',
      defaultParams: {
        enable: true,
        title: tExpr('Delete record'),
        content: tExpr('Are you sure you want to delete it?'),
      },
    },
    delete: {
      async handler(ctx) {
        try {
          if (!ctx.resource || !ctx.record || !ctx.collection) {
            ctx.message.error(ctx.t('No resource or record selected for deletion'));
            return;
          }

          await ctx.resource.destroy(ctx.record[ctx.collection.filterTargetKey || 'id']);
          await ctx.resource.refresh();
          ctx.message.success(ctx.t('Record deleted successfully'));
        } catch (error) {
          ctx.message.error(getErrorMessage(error, ctx.t('Failed to delete comment')));
        }
      },
    },
  },
});
