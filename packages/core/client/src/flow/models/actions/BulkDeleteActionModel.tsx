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
import { GlobalActionModel } from '../base/ActionModel';

export class BulkDeleteActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Delete'),
    icon: 'DeleteOutlined',
  };
}

BulkDeleteActionModel.define({
  title: escapeT('Delete'),
});

BulkDeleteActionModel.registerFlow({
  key: 'deleteSettings',
  title: escapeT('Delete settings'),
  on: 'click',
  steps: {
    confirm: {
      use: 'confirm',
    },
    delete: {
      async handler(ctx, params) {
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.message.error(ctx.t('No resource selected for deletion'));
          return;
        }
        const resource = ctx.shared.currentBlockModel.resource as MultiRecordResource;
        if (resource.getSelectedRows().length === 0) {
          ctx.message.warning(ctx.t('No records selected for deletion'));
          return;
        }
        await resource.destroySelectedRows();
        ctx.message.success(ctx.t('Selected records deleted successfully'));
      },
    },
  },
});
