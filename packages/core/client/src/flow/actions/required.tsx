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
  uiSchema: (ctx) => {
    const joiRules: any[] = (ctx.model as any).collectionField?.validation?.rules || [];
    // 检查 collectionField.validation 是否已有 required
    const hasRequiredInCollection = joiRules.some((rule) => rule.name === 'required');
    return {
      required: {
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        'x-component-props': {
          checkedChildren: escapeT('Yes'),
          unCheckedChildren: escapeT('No'),
        },
        'x-disabled': hasRequiredInCollection,
      },
    };
  },

  defaultParams: (ctx) => {
    return {
      required: ctx.model.getProps().required,
    };
  },
  handler(ctx, params) {
    let rules = ctx.model.getProps().rules || [];
    const joiRules: any[] = (ctx.model as any).collectionField?.validation?.rules || [];
    // 检查 collectionField.validation 是否已有 required
    const hasRequiredInCollection = joiRules.some((rule) => rule.name === 'required');
    rules = rules.filter((rule) => !rule.required);
    // 全局已设置必填不可覆盖
    if (params.required && !hasRequiredInCollection) {
      rules.push({
        required: true,
        message: ctx.t('The field value is required'),
      });
    }
    ctx.model.setProps({ rules, required: params.required || hasRequiredInCollection });
  },
});
