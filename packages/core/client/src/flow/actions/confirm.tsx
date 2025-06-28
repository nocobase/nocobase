/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';

export const confirm = defineAction({
  name: 'confirm',
  title: '{{t("Secondary confirmation")}}',
  uiSchema: {
    enable: {
      type: 'boolean',
      title: '{{t("Enable secondary confirmation")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
    title: {
      type: 'string',
      title: '{{t("Title")}}',
      default: '{{t("Delete record")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
    content: {
      type: 'string',
      title: '{{t("Content")}}',
      default: '{{t("Are you sure you want to delete it?")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
  defaultParams: {
    enable: true,
    title: 'Delete record',
    content: 'Are you sure you want to delete it?',
  },
  async handler(ctx, params) {
    if (params.enable) {
      const confirmed = await ctx.globals.modal.confirm({
        title: params.title,
        content: params.content,
      });

      if (!confirmed) {
        ctx.exit();
      }
    }
  },
});
