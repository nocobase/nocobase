/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';

export const required = defineAction({
  title: tExpr('Required'),
  name: 'required',
  uiMode: (ctx) => {
    const joiRules: any[] = (ctx.model as any).collectionField?.validation?.rules || [];
    const rules = ctx.model.props.validation?.rules || [];
    // 检查 validation 是否已有 required
    const hasRequiredInCollection = joiRules.concat(rules).some((rule) => rule.name === 'required');
    return {
      type: 'switch',
      key: 'required',
      props: {
        disabled: hasRequiredInCollection,
      },
    };
  },
  uiSchema: async (ctx) => {
    const joiRules: any[] = (ctx.model as any).collectionField?.validation?.rules || [];
    const rules = ctx.model.props.validation?.rules || [];
    // 检查 validation 是否已有 required
    const hasRequiredInCollection = joiRules.concat(rules).some((rule) => rule.name === 'required');
    return {
      required: {
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        'x-component-props': {
          checkedChildren: tExpr('Yes'),
          unCheckedChildren: tExpr('No'),
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
    // collection validation 已内置 required 时，不再额外注入 required 规则，避免重复报错
    if (hasRequiredInCollection) {
      ctx.model.setProps({ rules, required: true });
      return;
    }
    if (params.required) {
      rules.push({
        required: true,
        message: ctx.t('The field value is required'),
      });
    }
    ctx.model.setProps({ rules, required: params.required });
  },
});
