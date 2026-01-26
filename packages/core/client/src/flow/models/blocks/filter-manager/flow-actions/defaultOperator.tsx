/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr, FlowModel } from '@nocobase/flow-engine';
import { operators } from '../../../../../collection-manager';
import { FilterFormFieldModel } from '../../filter-form/fields';

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
  const operatorList =
    model.context.collectionField?.filterable?.operators || operators[model.context.filterField.type];
  return (operatorList || [])
    .filter((op) => !op.visible || op.visible(meta))
    .map((op) => ({
      ...op,
      label: model.translate(op.label),
    }));
}
