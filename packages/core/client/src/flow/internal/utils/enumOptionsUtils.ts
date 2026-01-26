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

type Option = { label: any; value: any } & Record<string, any>;

// Internal utility: normalize uiSchema.enum into antd-friendly options
function normalizeUiSchemaEnumToOptions(uiEnum: UiSchemaEnumItem[] = []): Option[] {
  if (!Array.isArray(uiEnum)) return [];
  return uiEnum
    .map((item: UiSchemaEnumItem) => {
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
      // Primitive values: keep original value; stringify label
      return { label: String(item), value: item };
    })
    .filter((option) => option?.value !== undefined && option?.value !== '');
}

// Map option labels through t() (supports {{t('key')}} template and plain strings)
export function translateOptions(options: Option[] = [], t: (s: string) => string): Option[] {
  if (!Array.isArray(options)) return [] as Option[];
  return options.map((opt) => (typeof opt?.label === 'string' ? { ...opt, label: t(opt.label) } : opt));
}

// Build options from uiSchema.enum with translated labels
export function enumToOptions(uiEnum: UiSchemaEnumItem[] | undefined, t: (s: string) => string): Option[] | undefined {
  if (!uiEnum || !Array.isArray(uiEnum) || uiEnum.length === 0) return undefined;
  const normalized = normalizeUiSchemaEnumToOptions(uiEnum);
  return translateOptions(normalized, t);
}

// Populate model.props.options from uiSchema.enum if missing; returns whether options were injected
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
