/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT } from '@nocobase/flow-engine';

export const confirm = defineAction({
  name: 'confirm',
  title: escapeT('Confirmation'),
  uiSchema: {
    enable: {
      type: 'boolean',
      title: escapeT('Enable secondary confirmation'),
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
    title: {
      type: 'string',
      title: escapeT('Title'),
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
    content: {
      type: 'string',
      title: escapeT('Content'),
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
  defaultParams: {
    enable: true,
    title: 'Please Confirm',
    content: 'Are you sure you want to proceed with this action?',
  },
  async handler(ctx, params) {
    if (params.enable) {
      const confirmed = await ctx.globals.modal.confirm({
        title: ctx.t(params.title),
        content: ctx.t(params.content),
      });

      if (!confirmed) {
        ctx.exit();
      }
    }
  },
});
