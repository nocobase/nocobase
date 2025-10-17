/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';
import { ColorPicker } from '@nocobase/client';

import { tval } from '@nocobase/utils/client';

export const addAction = defineAction({
  title: tval('Add action'),
  name: 'addAction',
  uiSchema(ctx) {
    const t = ctx.t;
    return {
      title: {
        title: t('Title'),
        required: true,
        'x-component': 'Input',
        'x-decorator': 'FormItem',
      },
      icon: {
        title: t('Icon'),
        required: true,
        'x-component': 'IconPicker',
        'x-decorator': 'FormItem',
      },
      iconColor: {
        title: t('Color'),
        required: true,
        default: '#1677FF',
        'x-component': ColorPicker,
        'x-decorator': 'FormItem',
      },
    };
  },
  handler(ctx, params) {
    ctx.model.setProps({
      title: params.title,
      icon: params.icon,
      iconColor: params.iconColor,
    });
  },
});
