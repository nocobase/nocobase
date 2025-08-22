/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, MultiRecordResource } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { CollectionActionModel } from '../base/ActionModel';

export class BulkDeleteActionModel extends CollectionActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Delete'),
    icon: 'DeleteOutlined',
  };
  getActionName() {
    return 'destroy';
  }
}

BulkDeleteActionModel.define({
  label: escapeT('Delete'),
});

BulkDeleteActionModel.registerFlow({
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
