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

export class DeleteCommentActionModel extends CommentActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: escapeT('Delete'),
  };

  getAclActionName() {
    return 'destroy';
  }
}

DeleteCommentActionModel.define({
  label: escapeT('Delete'),
  toggleable: true,
});

DeleteCommentActionModel.registerFlow({
  key: 'deleteSettings',
  title: escapeT('Delete settings'),
  on: 'click',
  steps: {
    confirm: {
      use: 'confirm',
      defaultParams: {
        enable: true,
        title: escapeT('Delete record'),
        content: escapeT('Are you sure you want to delete it?'),
      },
    },
    delete: {
      async handler(ctx, params) {
        if (!ctx.resource) {
          ctx.message.error(ctx.t('No resource selected for deletion'));
          return;
        }
        if (!ctx.record) {
          ctx.message.error(ctx.t('No resource or record selected for deletion'));
          return;
        }
        await ctx.resource.destroy(ctx.record[ctx.collection.filterTargetKey]);
        ctx.message.success(ctx.t('Record deleted successfully'));
      },
    },
  },
});
