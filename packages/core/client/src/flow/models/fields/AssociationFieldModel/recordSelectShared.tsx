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
  const field: any = currentModel.subModels.field as FlowModel;
  if (!field) {
    return;
  }
  const key = option[fieldNames.value];
  const fieldModel = field.createFork({}, key);
  fieldModel.context.defineProperty('record', {
    get: () => option,
    cache: false,
    meta: createCurrentRecordMetaFactory(fieldModel.context, () => fieldModel.context.collection),
  });
  const labelValue =
    toSafeDisplayLabel(option?.[fieldNames.label]) ??
    toSafeDisplayLabel(option?.label) ??
    toSafeDisplayLabel(option?.[fieldNames.value]);
  const titleCollectionField = currentModel.context.collectionField.targetCollection.getField(fieldNames.label);
  const titleFieldComponentProps =
    titleCollectionField && typeof titleCollectionField.getComponentProps === 'function'
      ? titleCollectionField.getComponentProps()
      : {};
  fieldModel.setProps({ value: labelValue, clickToOpen: false, ...titleFieldComponentProps });
  const hasLabelValue = labelValue !== null && typeof labelValue !== 'undefined' && labelValue !== '';
  return (
    <span style={{ pointerEvents: 'none' }} key={key}>
      {hasLabelValue ? fieldModel.render() : 'N/A'}
    </span>
  );
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

  const convert = (item: AssociationOption) => {
    if (!isAssociationOption(item)) return undefined;
    return {
      label: <LabelByField option={item} fieldNames={fieldNames} />,
      value: item[valueKey],
    };
  };

  if (valueMode === 'value') {
    const toValue = (item: AssociationOption | string | number) => {
      if (typeof item === 'object' && item !== null) {
        return convert(item);
      }
      const matchedOption = options.find((option) => option?.[valueKey] === item);
      if (matchedOption) {
        return convert(matchedOption);
      }
      // Handle string or number values
      return {
        label: item,
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
      return omit(v, 'disabled', 'options');
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
