/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { defineAction } from '@nocobase/flow-engine';
import { FilterFormItemModel } from '../../filter-form/FilterFormItemModel';
import { InputFieldModel } from '../../../fields/InputFieldModel';
import { resolveOperatorComponent } from '../../../../internal/utils/operatorSchemaHelper';

const KEYWORD_OPERATORS = new Set(['$in', '$notIn']);

function isOperatorSupported(model: FilterFormItemModel, operator: string) {
  const ops = model.collectionField?.filterable?.operators || [];
  return ops.some((op) => op.value === operator);
}

// 重新包裹 render，确保仍由 flow-engine 的响应式包装驱动
function rewrapReactiveRender(fieldModel: any) {
  if (!fieldModel) return;
  fieldModel._reactiveWrapperCache = undefined;
  fieldModel.setupReactiveRender?.();
}

function applyCustomizeFilterRender(model: FilterFormItemModel) {
  const operator = model.operator;
  const fieldModel = model.subModels?.field;
  if (!fieldModel) return;

  // 强制子组件在 operator 变更时刷新
  model.setProps({
    key: `${model.uid}-${operator || ''}`,
  });

  // 非关键词操作符，恢复原始渲染
  if (!KEYWORD_OPERATORS.has(operator)) {
    const originalRender = fieldModel['__originalRender'];
    if (typeof originalRender === 'function') {
      // 清理缓存，防止沿用上一轮的 reactive wrapper
      (fieldModel as any)._reactiveWrapperCache = undefined;
      fieldModel.render = originalRender;
    }
    return;
  }

  if (!(fieldModel instanceof InputFieldModel)) return;
  if (!isOperatorSupported(model, operator)) return;

  const resolved = resolveOperatorComponent(
    model.context.app,
    operator,
    model.collectionField?.filterable?.operators || [],
  );
  if (!resolved) return;
  const { Comp, props: xProps } = resolved;

  // 缓存一次原始 render/props，用于回退
  if (!fieldModel['__originalRender']) {
    fieldModel['__originalRender'] = fieldModel.render;
  }

  fieldModel.render = () => (
    <Comp {...xProps} {...fieldModel.props} onCompositionStart={null} onCompositionEnd={null} />
  );
  rewrapReactiveRender(fieldModel);
}

export const customizeFilterRender = defineAction<FilterFormItemModel>({
  name: 'customizeFilterRender',
  handler(ctx) {
    applyCustomizeFilterRender(ctx.model);
  },
});
