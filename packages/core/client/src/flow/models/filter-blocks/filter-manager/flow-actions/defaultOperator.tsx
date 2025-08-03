/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, FlowContext } from '@nocobase/flow-engine';

export const defaultOperator = defineAction({
  name: 'defaultOperator',
  title: 'Default operator',
  uiSchema(ctx: FlowContext) {
    const operatorOptions = getOperatorOptions(ctx);

    if (!ctx.model.enableOperator) {
      return;
    }

    return {
      value: {
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: operatorOptions,
      },
    };
  },
  defaultParams(ctx) {
    const operatorOptions = getOperatorOptions(ctx);
    return {
      value: operatorOptions.length > 0 ? operatorOptions[0].value : '',
    };
  },
  handler(ctx, params) {},
});

function getOperatorOptions(ctx: FlowContext) {
  return (ctx.model.context.collectionField.filterable?.operators || []).map((op) => ({
    ...op,
    label: ctx.t(op.label),
  }));
}
