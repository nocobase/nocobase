/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { GlobalActionModel } from '../base/ActionModel';
import { secondaryConfirmationAction } from '../../actions/secondaryConfirmationAction';
import { refreshOnCompleteAction } from '../../actions/refreshOnCompleteAction';

export class BulkDeleteActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    children: 'Delete',
  };
}

BulkDeleteActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    secondaryConfirmationAction,
    delete: {
      async handler(ctx, params) {
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.globals.message.error('No resource selected for deletion.');
          return;
        }
        const resource = ctx.shared.currentBlockModel.resource as MultiRecordResource;
        if (resource.getSelectedRows().length === 0) {
          ctx.globals.message.warning('No records selected for deletion.');
          return;
        }
        await resource.destroySelectedRows();
        ctx.globals.message.success('Selected records deleted successfully.');
      },
    },
    refreshOnCompleteAction,
  },
});
