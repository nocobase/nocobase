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

const KEYWORD_OPERATORS = new Set(['$in', '$notIn']);

function isOperatorSupported(model: FilterFormItemModel, operator: string) {
  const ops = model.collectionField?.filterable?.operators || [];
  return ops.some((op) => op.value === operator);
}

export function applyCustomizeFilterRender(model: FilterFormItemModel) {
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
      fieldModel.render = originalRender;
    }
    return;
  }

  if (!(fieldModel instanceof InputFieldModel)) return;
  if (!isOperatorSupported(model, operator)) return;

  // 优先使用操作符 schema 中声明的组件/props
  const opSchema = (model.collectionField?.filterable?.operators || []).find((op) => op.value === operator)?.schema;
  const xComp = opSchema?.['x-component'];
  const xProps = opSchema?.['x-component-props'] || {};
  if (!xComp) return;
  const Comp = model.context.app?.getComponent?.(xComp as any);
  if (!Comp) return;

  // 缓存一次原始 render/props，用于回退
  if (!fieldModel['__originalRender']) {
    fieldModel['__originalRender'] = fieldModel.render;
  }

  fieldModel.render = () => <Comp {...fieldModel.props} {...xProps} />;
}

export const customizeFilterRender = defineAction<FilterFormItemModel>({
  name: 'customizeFilterRender',
  handler(ctx) {
    applyCustomizeFilterRender(ctx.model);
  },
});
