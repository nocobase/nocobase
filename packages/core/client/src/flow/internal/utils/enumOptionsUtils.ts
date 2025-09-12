/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, FlowModel } from '@nocobase/flow-engine';

export type UiSchemaEnumItem = string | number | boolean | { label?: any; value?: any; color?: string; icon?: any };

/**
 * 将 uiSchema.enum 归一化为 antd 可识别的 options 数组
 */
export function normalizeUiSchemaEnumToOptions(uiEnum: UiSchemaEnumItem[] = []) {
  if (!Array.isArray(uiEnum)) return [];
  return uiEnum.map((item: UiSchemaEnumItem) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const anyItem = item as any;
      const hasLabel = typeof anyItem.label !== 'undefined';
      const hasValue = typeof anyItem.value !== 'undefined';
      const label = hasLabel ? anyItem.label : String(anyItem.value ?? '');
      const value = hasValue ? anyItem.value : label;
      const opt: any = { label, value };
      if (anyItem.color) opt.color = anyItem.color;
      if (anyItem.icon) opt.icon = anyItem.icon;
      return opt;
    }
    // 基本类型：保持原始 value 类型，label 使用字符串呈现
    return { label: String(item), value: item };
  });
}

/**
 * 若符合条件，则为模型补全 options，返回是否发生了注入
 */
export function ensureOptionsFromUiSchemaEnumIfAbsent(model: FlowModel, collectionField: CollectionField): boolean {
  const iface = collectionField?.interface;
  const isLocalEnumInterface = ['radioGroup', 'checkboxGroup', 'select', 'multipleSelect'].includes(iface);
  if (!isLocalEnumInterface) return false;

  const hasOptions = Array.isArray(model.props?.options) && model.props?.options?.length > 0;
  if (hasOptions) return false;

  const uiEnum = collectionField.uiSchema?.enum as UiSchemaEnumItem[] | undefined;
  if (!Array.isArray(uiEnum) || uiEnum.length === 0) return false;

  const normalized = normalizeUiSchemaEnumToOptions(uiEnum);
  if (!normalized.length) return false;

  model.setProps({ options: normalized });
  return true;
}
