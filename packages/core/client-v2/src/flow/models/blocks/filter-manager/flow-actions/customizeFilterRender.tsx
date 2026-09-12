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
import {
  applyOperatorComponentRender,
  restoreOperatorComponentRender,
} from '../../../../internal/utils/operatorSchemaHelper';
import { getFilterFormOperatorList } from '../utils';

function applyCustomizeFilterRender(model: FilterFormItemModel) {
  const operator = model.operator;
  const fieldModel = model.subModels?.field;
  if (!fieldModel) return;

  // 强制子组件在 operator 变更时刷新
  model.setProps({
    key: `${model.uid}-${operator || ''}`,
  });

  if (!operator) {
    restoreOperatorComponentRender(fieldModel);
    return;
  }

  const operatorList = getFilterFormOperatorList(model);
  applyOperatorComponentRender({
    app: model.context.app,
    fieldModel,
    operator,
    operators: operatorList,
    propsPriority: 'field',
  });
}

export const customizeFilterRender = defineAction<FilterFormItemModel>({
  name: 'customizeFilterRender',
  handler(ctx) {
    applyCustomizeFilterRender(ctx.model);
  },
});
