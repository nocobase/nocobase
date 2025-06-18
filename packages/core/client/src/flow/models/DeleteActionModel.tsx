/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import { ActionModel } from './ActionModel';

export class DeleteActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: 'Delete',
  };
}

DeleteActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        if (!ctx.extra.currentResource || !ctx.extra.currentRecord) {
          ctx.globals.message.error('No resource or record selected for deletion.');
          return;
        }
        await ctx.extra.currentResource.destroy(ctx.extra.currentRecord);
        ctx.globals.message.success('Record deleted successfully.');
      },
    },
  },
});
