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
const TEXT_INTERFACES = new Set([
  'input',
  'phone',
  'email',
  'uuid',
  'sequence',
  'integer',
  'number',
  'percent',
  'nanoid',
]);

export function applyCustomizeFilterRender(model: FilterFormItemModel) {
  const operator = (model as any)?.operator;
  const fieldModel = model.subModels?.field as any;
  if (!fieldModel) return;

  const protoRender = Object.getPrototypeOf(fieldModel)?.render;
  // 非关键词操作符，恢复原始渲染
  if (!KEYWORD_OPERATORS.has(operator)) {
    if (typeof protoRender === 'function') {
      fieldModel.render = protoRender;
    }
    return;
  }

  if (!(fieldModel instanceof InputFieldModel)) return;
  if (!TEXT_INTERFACES.has(model.collectionField?.interface)) return;

  const MultipleKeywordsInput = model.context.app?.getComponent?.('MultipleKeywordsInput');
  if (!MultipleKeywordsInput) return;

  const placeholder = model.context.t('Multiple keywords separated by line breaks');

  fieldModel.setProps({
    mode: 'tags',
    tokenSeparators: ['\n'],
    placeholder,
    suffixIcon: null,
    allowClear: true,
  });
  fieldModel.render = () => (
    <MultipleKeywordsInput
      fieldInterface={model.collectionField?.interface}
      {...fieldModel.props}
      placeholder={fieldModel.props?.placeholder ?? placeholder}
      tokenSeparators={fieldModel.props?.tokenSeparators ?? ['\n']}
    />
  );
}

export const customizeFilterRender = defineAction<FilterFormItemModel>({
  name: 'customizeFilterRender',
  // 无 UI，仅在保存/初始化时应用渲染改写
  handler(ctx) {
    applyCustomizeFilterRender(ctx.model);
  },
});
