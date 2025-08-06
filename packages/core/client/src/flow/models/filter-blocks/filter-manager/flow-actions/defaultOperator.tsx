/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, FlowContext, FlowModel } from '@nocobase/flow-engine';
import { FilterFormEditableFieldModel } from '../../form-v2/fields';

export const defaultOperator = defineAction<FilterFormEditableFieldModel>({
  name: 'defaultOperator',
  title: 'Default operator',
  uiSchema(ctx: FlowContext) {
    const operatorOptions = getOperatorOptions(ctx.model);

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
    const operatorOptions = getOperatorOptions(ctx.model);
    return {
      value: operatorOptions.length > 0 ? operatorOptions[0].value : '',
    };
  },
  handler(ctx, params) {
    ctx.model.operator = params.value;
  },
});

function getOperatorOptions(model: FlowModel) {
  return (model.context.collectionField.filterable?.operators || []).map((op) => ({
    ...op,
    label: model.translate(op.label),
  }));
}
