/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createCurrentRecordMetaFactory,
  FlowModel,
  useFlowModel,
  type FlowRuntimeContext,
} from '@nocobase/flow-engine';
import type { SelectProps } from 'antd';
import React from 'react';
import { omit } from 'lodash';

export interface AssociationFieldNames {
  label: string;
  value: string;
}

const isPlaceholderFieldName = (value: unknown, fallback: 'label' | 'value') => value === fallback;

const unwrapAssociationOptionRecord = (option: unknown): Record<string, unknown> | undefined => {
  if (option && typeof option === 'object') {
    const raw = (option as Record<string, unknown>).data;
    if (raw && typeof raw === 'object') {
      return raw as Record<string, unknown>;
    }
    return option as Record<string, unknown>;
  }
  return undefined;
};

function normalizeFilterTargetKey(filterTargetKey: unknown): string | undefined {
  if (typeof filterTargetKey === 'string' && filterTargetKey) {
    return filterTargetKey;
  }
  if (Array.isArray(filterTargetKey) && filterTargetKey.length === 1 && typeof filterTargetKey[0] === 'string') {
    return filterTargetKey[0];
  }
  return undefined;
}

export function normalizeAssociationFieldNames(
  fieldNames: Partial<AssociationFieldNames> | undefined,
  targetCollection?: any,
): AssociationFieldNames {
  const titleCollectionFieldName =
    typeof targetCollection?.titleCollectionField?.name === 'string'
      ? targetCollection.titleCollectionField.name
      : undefined;
  const fallbackValue = normalizeFilterTargetKey(targetCollection?.filterTargetKey) || 'id';
  const explicitValue =
    typeof fieldNames?.value === 'string' && fieldNames.value && !isPlaceholderFieldName(fieldNames.value, 'value')
      ? fieldNames.value
      : undefined;
  const explicitLabel =
    typeof fieldNames?.label === 'string' && fieldNames.label && !isPlaceholderFieldName(fieldNames.label, 'label')
      ? fieldNames.label
      : undefined;
  const value = explicitValue || fallbackValue;
  const label = explicitLabel || titleCollectionFieldName || value;

  return { label, value };
}

export type AssociationOption = Record<string, any>;
export type PopupScrollEvent = Parameters<NonNullable<SelectProps<any>['onPopupScroll']>>[0];

export function buildOpenerUids(ctx: FlowRuntimeContext, inputArgs: Record<string, unknown> = {}): string[] {
  // Keep consistent with `packages/core/client/src/flow/actions/openView.tsx`
  const isRouteManaged = !!(inputArgs as { navigation?: unknown }).navigation;
  const toStringArray = (val: unknown): string[] | undefined => {
    if (!Array.isArray(val)) return undefined;
    return val.filter((item): item is string => typeof item === 'string' && !!item);
  };
  const viewOpenerUids = toStringArray(ctx.view?.inputArgs?.openerUids);
  const inputOpenerUids = toStringArray(inputArgs.openerUids);
  const parentOpenerUids = viewOpenerUids || inputOpenerUids || [];
  if (isRouteManaged) {
    return (inputOpenerUids || parentOpenerUids).filter(Boolean);
  }
  const viewUidFromView = (ctx.view?.inputArgs as { viewUid?: unknown } | undefined)?.viewUid;
  const viewUidFromModel = (ctx.model.context?.inputArgs as { viewUid?: unknown } | undefined)?.viewUid;
  const openerUid =
    typeof viewUidFromView === 'string' && viewUidFromView
      ? viewUidFromView
      : typeof viewUidFromModel === 'string' && viewUidFromModel
        ? viewUidFromModel
        : ctx.model.uid;
  return [...parentOpenerUids, openerUid].filter(Boolean);
}

export interface LazySelectProps extends Omit<SelectProps<any>, 'mode' | 'options' | 'value' | 'onChange'> {
  fieldNames: AssociationFieldNames;
  value?: AssociationOption | AssociationOption[] | string | string[] | number | number[];
  multiple?: boolean;
  allowMultiple?: boolean;
  // 在特定场景（如默认值弹窗）下，多选点击选项后保持下拉展开
  keepDropdownOpenOnSelect?: boolean;
  options?: AssociationOption[];
  valueMode?: 'record' | 'value';
  onChange: (option: AssociationOption | AssociationOption[] | string | string[] | number | number[]) => void;
  onDropdownVisibleChange?: (open: boolean) => void;
  onPopupScroll?: SelectProps<any>['onPopupScroll'];
  onSearch?: SelectProps<any>['onSearch'];
  loading?: boolean;
  onCompositionStart?: (e: any) => void;
  onCompositionEnd?: (e: any, flag?: boolean) => void;
  quickCreate?: 'none' | 'modalAdd' | 'quickAdd';
  onModalAddClick?: (e: any) => void;
  onDropdownAddClick?: (e: any) => void;
  searchText?: string;
  allowCreate?: boolean;
  allowEdit?: boolean;
}

export interface LabelByFieldProps {
  option: AssociationOption;
  fieldNames: AssociationFieldNames;
}

function toSafeDisplayLabel(value: unknown): string | number | boolean | undefined {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          return item;
        }
        if (item && typeof item === 'object') {
          const nested = (item as Record<string, unknown>).label ?? (item as Record<string, unknown>).name;
          if (typeof nested === 'string' || typeof nested === 'number' || typeof nested === 'boolean') {
            return nested;
          }
        }
        return undefined;
      })
      .filter((item): item is string | number | boolean => item !== undefined);

    return parts.length ? parts.map(String).join(', ') : undefined;
  }

  if (value && typeof value === 'object') {
    const nested = (value as Record<string, unknown>).label ?? (value as Record<string, unknown>).name;
    if (typeof nested === 'string' || typeof nested === 'number' || typeof nested === 'boolean') {
      return nested;
    }
  }

  return undefined;
}

export function LabelByField(props: Readonly<LabelByFieldProps>) {
  const { option, fieldNames } = props;
  const currentModel = useFlowModel();
  const record = unwrapAssociationOptionRecord(option);
  const normalizedFieldNames = normalizeAssociationFieldNames(
    fieldNames,
    currentModel.context.collectionField?.targetCollection,
  );
  const field: any = currentModel.subModels.field as FlowModel;
  const labelValue =
    toSafeDisplayLabel(record?.[normalizedFieldNames.label]) ??
    toSafeDisplayLabel(record?.label) ??
    toSafeDisplayLabel(record?.[normalizedFieldNames.value]);
  if (!field) {
    return <span>{labelValue ?? 'N/A'}</span>;
  }

  const optionKey = String(record?.[normalizedFieldNames.value] ?? labelValue ?? 'association-option');
  const fieldModel = field.createFork({}, optionKey);
  fieldModel.context.defineProperty('record', {
    get: () => record,
    cache: false,
    meta: createCurrentRecordMetaFactory(fieldModel.context, () => fieldModel.context.collection),
  });

  const titleCollectionField = currentModel.context.collectionField.targetCollection?.getField?.(
    normalizedFieldNames.label,
  );
  const titleFieldComponentProps =
    titleCollectionField && typeof titleCollectionField.getComponentProps === 'function'
      ? titleCollectionField.getComponentProps()
      : {};
  fieldModel.setProps({ value: labelValue, clickToOpen: false, ...titleFieldComponentProps });

  const renderedLabel =
    labelValue !== null && typeof labelValue !== 'undefined' && labelValue !== ''
      ? (fieldModel.render() as React.ReactNode)
      : 'N/A';

  return <span style={{ pointerEvents: 'none' }}>{renderedLabel}</span>;
}

export function toSelectValue(
  record: AssociationOption | AssociationOption[] | string | string[] | number | number[] | undefined,
  fieldNames: AssociationFieldNames,
  multiple = false,
  valueMode: 'record' | 'value' = 'record',
  options: AssociationOption[] = [],
) {
  if (!record) return multiple ? [] : undefined;

  const { value: valueKey } = fieldNames || {};

  const isAssociationOption = (item: unknown): item is AssociationOption => typeof item === 'object' && item !== null;

  const convert = (item: AssociationOption): any => {
    if (!isAssociationOption(item)) return undefined;
    return {
      label: <LabelByField option={item} fieldNames={fieldNames} />,
      value: item[valueKey],
    };
  };

  if (valueMode === 'value') {
    const toValue = (item: AssociationOption | string | number): any => {
      if (typeof item === 'object' && item !== null) {
        return convert(item);
      }
      const matchedOption = options.find((option) => option?.[valueKey] === item);
      if (matchedOption) {
        return convert(matchedOption);
      }
      // Handle string or number values
      return {
        label: String(item),
        value: item,
      };
    };
    if (multiple) {
      if (!Array.isArray(record)) return [];
      return record.map((item) => toValue(item)).filter(Boolean);
    }
    if (Array.isArray(record)) {
      return toValue(record[0]);
    }
    return toValue(record as AssociationOption);
  }

  if (multiple) {
    if (!Array.isArray(record)) return [];
    return record.filter(isAssociationOption).map(convert).filter(Boolean);
  }
  if (Array.isArray(record)) {
    const first = record[0];
    return isAssociationOption(first) ? convert(first) : undefined;
  }
  return isAssociationOption(record) ? convert(record) : undefined;
}

export function resolveOptions(
  options: AssociationOption[] | undefined,
  value: AssociationOption | AssociationOption[] | string | string[] | number | number[] | undefined,
  isMultiple: boolean,
) {
  if (options?.length) {
    return options.map((v) => {
      return omit(v, 'disabled', 'options', 'style');
    });
  }

  if (isMultiple) {
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === 'object' && item !== null) as AssociationOption[];
    }
    return [];
  }

  if (value && typeof value === 'object') {
    return [value as AssociationOption];
  }

  return [];
}
