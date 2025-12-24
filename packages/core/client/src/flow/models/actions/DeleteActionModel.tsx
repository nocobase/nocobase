/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { ActionModel, ActionSceneEnum } from '../base';
import { beforeAction } from '../../events/beforeAction';
import { afterAction } from '../../events/afterAction';

export class DeleteActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;

  defaultProps: ButtonProps = {
    type: 'link',
    title: tExpr('Delete'),
  };

  getAclActionName() {
    return 'destroy';
  }
}

DeleteActionModel.define({
  label: tExpr('Delete'),
});

DeleteActionModel.registerFlow({
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
      async handler(ctx, params) {
        if (!ctx.resource) {
          ctx.message.error(ctx.t('No resource selected for deletion'));
          return;
        }
        if (!ctx.record) {
          ctx.message.error(ctx.t('No resource or record selected for deletion'));
          return;
        }
        await ctx.resource.destroy(ctx.blockModel.collection.getFilterByTK(ctx.record));
        ctx.message.success(ctx.t('Record deleted successfully'));
      },
    },
  },
});

DeleteActionModel.registerEvent(beforeAction);
DeleteActionModel.registerEvent(afterAction);
