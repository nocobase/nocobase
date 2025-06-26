/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { RecordActionModel } from '../base/ActionModel';

export class DeleteActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: 'Delete',
  };
}

DeleteActionModel.define({
  title: 'Delete',
});

DeleteActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    confirm: {
      use: 'confirm',
    },
    delete: {
      async handler(ctx, params) {
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.globals.message.error('No resource selected for deletion.');
          return;
        }
        if (!ctx.shared.currentRecord) {
          ctx.globals.message.error('No resource or record selected for deletion.');
          return;
        }
        const resource = ctx.shared.currentBlockModel.resource as MultiRecordResource;
        await resource.destroy(ctx.shared.currentRecord);
        ctx.globals.message.success('Record deleted successfully.');
      },
    },
  },
});
