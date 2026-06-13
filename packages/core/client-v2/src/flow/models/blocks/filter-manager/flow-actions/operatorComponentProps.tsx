/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';
import { FilterFormItemModel } from '../../filter-form/FilterFormItemModel';
import { getFilterFormOperatorMeta } from '../utils';

function applyOperatorComponentProps(model: FilterFormItemModel) {
  const meta = getFilterFormOperatorMeta(model, model.operator);
  if (!meta) {
    return;
  }
  const xComponentProps = meta?.schema?.['x-component-props'];
  if (!xComponentProps) {
    return;
  }

  const fieldModel = model.subModels?.field;
  if (!fieldModel?.setProps) {
    return;
  }

  fieldModel.setProps(xComponentProps);
}

export const operatorComponentProps = defineAction<FilterFormItemModel>({
  name: 'operatorComponentProps',
  handler(ctx) {
    applyOperatorComponentProps(ctx.model);
  },
});
