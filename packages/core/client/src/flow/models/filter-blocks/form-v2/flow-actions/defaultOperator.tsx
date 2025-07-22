/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';
import { FilterFormEditableFieldModel } from '../fields';

export const defaultOperator = defineAction<FilterFormEditableFieldModel>({
  name: 'defaultOperator',
  title: 'Default operator',
  uiSchema(ctx) {
    if (!ctx.model.enableOperator) {
      return;
    }

    const operators = ctx.model.context.collectionField.filterable?.operators || [];
    return {
      // 用于选择字段默认的操作
      operator: {
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: operators,
      },
    };
  },
  defaultParams: (ctx) => {
    const operators = ctx.model.context.collectionField.filterable?.operators || [];
    const defaultOperator = operators[0]?.value;
    return {
      operator: defaultOperator,
    };
  },
  handler(ctx, params) {
    ctx.model.setProps('operator', params.operator);
  },
});
