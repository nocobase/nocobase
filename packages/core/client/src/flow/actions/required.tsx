/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT } from '@nocobase/flow-engine';

export const required = defineAction({
  title: escapeT('Required'),
  name: 'required',
  uiSchema: {
    required: {
      'x-component': 'Switch',
      'x-decorator': 'FormItem',
      'x-component-props': {
        checkedChildren: escapeT('Yes'),
        unCheckedChildren: escapeT('No'),
      },
    },
  },

  defaultParams: (ctx) => {
    return {
      required: ctx.model.getProps().required,
    };
  },
  handler(ctx, params) {
    const rules = ctx.model.getProps().rules || [];
    if (params.required) {
      rules.push({
        required: true,
        message: ctx.t('The field value is required'),
      });
    }
    ctx.model.setProps({ rules });
  },
});
