/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource } from '@nocobase/flow-engine';
import type { ButtonType } from 'antd/es/button';
import React from 'react';
import { ActionModel } from './ActionModel';

export class DeleteActionModel extends ActionModel {
  title = 'Delete';
  type: ButtonType = 'link';
}

DeleteActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    confirm: {
      uiSchema: {
        title: {
          type: 'string',
          title: 'Confirm title',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        content: {
          type: 'string',
          title: 'Confirm content',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        title: 'Confirm Deletion',
        content: 'Are you sure you want to delete this record?',
      },
      async handler(ctx, params) {
        const confirmed = await ctx.globals.modal.confirm({
          title: params.title,
          content: params.content,
        });
        if (!confirmed) {
          ctx.globals.message.info('Deletion cancelled.');
          return ctx.exit();
        }
      },
    },
    step1: {
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
