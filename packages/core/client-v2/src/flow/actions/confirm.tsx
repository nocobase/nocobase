/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';
import { TextAreaWithContextSelector } from '../components/TextAreaWithContextSelector';

export const confirm = defineAction({
  name: 'confirm',
  title: tExpr('Confirmation'),
  uiSchema: {
    enable: {
      type: 'boolean',
      title: tExpr('Enable secondary confirmation'),
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
    title: {
      type: 'string',
      title: tExpr('Title'),
      'x-decorator': 'FormItem',
      // 自定义组件：textArea with Context Selector
      'x-component': TextAreaWithContextSelector,
      'x-component-props': {
        rows: 2,
      },
    },
    content: {
      type: 'string',
      title: tExpr('Content'),
      'x-decorator': 'FormItem',
      // 自定义组件：textArea with Context Selector
      'x-component': TextAreaWithContextSelector,
      'x-component-props': {
        rows: 3,
      },
    },
  },
  defaultParams: {
    enable: false,
    title: tExpr('Please Confirm'),
    content: tExpr('Are you sure you want to perform the action?'),
  },
  async handler(ctx, params) {
    if (params.enable) {
      const confirmed = await ctx.modal.confirm({
        title: ctx.t(params.title, { ns: 'lm-flow-engine' }),
        content: ctx.t(params.content, { ns: 'lm-flow-engine' }),
        okText: ctx.t('Confirm'),
        cancelText: ctx.t('Cancel'),
      });

      if (!confirmed) {
        ctx.exit();
      }
    }
  },
});
