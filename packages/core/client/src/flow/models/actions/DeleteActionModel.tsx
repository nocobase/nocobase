/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import { RecordActionModel } from '../base/ActionModel';
import { secondaryConfirmationAction } from '../../actions/secondaryConfirmationAction';
import { MultiRecordResource } from '@nocobase/flow-engine';
import { refreshOnCompleteAction } from '../../actions/refreshOnCompleteAction';

export class DeleteActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: 'Delete',
  };
}

DeleteActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    secondaryConfirmation: secondaryConfirmationAction,
    delete: {
      async handler(ctx, params) {
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.globals.message.error('No resource selected for deletion.');
          return;
        }
        if (!ctx.extra.currentRecord) {
          ctx.globals.message.error('No resource or record selected for deletion.');
          return;
        }
        const resource = ctx.shared.currentBlockModel.resource as MultiRecordResource;
        await resource.destroy(ctx.extra.currentRecord);
        ctx.globals.message.success('Record deleted successfully.');
      },
    },
    refresh: refreshOnCompleteAction,
  },
});
