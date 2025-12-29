/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, MultiRecordResource } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { ActionModel, ActionSceneEnum } from '../base';

export class BulkDeleteActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    title: tExpr('Delete'),
    icon: 'DeleteOutlined',
  };

  getAclActionName() {
    return 'destroy';
  }
}

BulkDeleteActionModel.define({
  label: tExpr('Delete'),
});

BulkDeleteActionModel.registerFlow({
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
        if (!ctx.blockModel?.resource) {
          ctx.message.error(ctx.t('No resource selected for deletion'));
          return;
        }
        const resource = ctx.blockModel.resource as MultiRecordResource;
        if (resource.getSelectedRows().length === 0) {
          ctx.message.warning(ctx.t('Please select at least one record to delete'));
          return;
        }
        await resource.destroy(ctx.blockModel.collection.getFilterByTK(resource.getSelectedRows()));
        ctx.message.success(ctx.t('Selected records deleted successfully'));
      },
    },
  },
});
