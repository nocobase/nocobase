/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr, FlowModel } from '@nocobase/flow-engine';
import { FilterFormFieldModel } from '../../filter-form/fields';
import { getFilterFormOperatorList } from '../utils';

export const defaultOperator: any = defineAction<FilterFormFieldModel>({
  name: 'defaultOperator',
  title: tExpr('Default operator'),
  uiMode(ctx) {
    const operatorOptions = getOperatorOptions(ctx.model);
    return {
      type: 'select',
      key: 'value',
      props: {
        options: operatorOptions,
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
  const meta = model.context.collectionField || model.context.filterField;
  return getFilterFormOperatorList(model)
    .filter((op) => !op.visible || op.visible(meta))
    .map((op) => ({
      ...op,
      label: typeof op.label === 'string' ? model.translate(op.label) : op.label,
    }));
}
