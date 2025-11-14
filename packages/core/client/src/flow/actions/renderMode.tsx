/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';

export const renderMode = defineAction({
  title: tExpr('Render mode'),
  name: 'renderMode',
  uiSchema: {
    textOnly: {
      type: 'string',
      enum: [
        { label: tExpr('Text only'), value: true },
        { label: tExpr('Html'), value: false },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
  },

  defaultParams: {
    textOnly: true,
  },
  handler(ctx, params) {
    ctx.model.setProps({ textOnly: params.textOnly });
  },
});
