/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';

export const displayMode = defineAction({
  title: tval('Display mode'),
  name: 'displayMode',
  uiSchema: {
    textOnly: {
      type: 'string',
      enum: [
        { label: tval('Text only'), value: true },
        { label: tval('Html'), value: false },
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
