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
  value?: AssociationOption | AssociationOption[];
  multiple?: boolean;
  allowMultiple?: boolean;
  options?: AssociationOption[];
  onChange: (option: AssociationOption | AssociationOption[]) => void;
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
  const labelValue = option?.[fieldNames.label] || option.label;
  const titleCollectionField = currentModel.context.collectionField.targetCollection.getField(fieldNames.label);
  fieldModel.setProps({ value: labelValue, clickToOpen: false, ...titleCollectionField.getComponentProps() });
  return (
    <span style={{ pointerEvents: 'none' }} key={key}>
      {labelValue ? fieldModel.render() : 'N/A'}
    </span>
  );
}

export function toSelectValue(
  record: AssociationOption | AssociationOption[] | undefined,
  fieldNames: AssociationFieldNames,
  multiple = false,
) {
  if (!record) return multiple ? [] : undefined;

  const { value: valueKey } = fieldNames || {};

  const convert = (item: AssociationOption) => {
    if (typeof item !== 'object' || item === null || item === undefined) return undefined;
    return {
      label: <LabelByField option={item} fieldNames={fieldNames} />,
      value: item[valueKey],
    };
  };

  if (multiple) {
    if (!Array.isArray(record)) return [];
    return record.map(convert).filter(Boolean);
  }
  if (Array.isArray(record) && !multiple) {
    return convert(record[0]);
  }
  return convert(record as AssociationOption);
}

export function resolveOptions(
  options: AssociationOption[] | undefined,
  value: AssociationOption | AssociationOption[] | undefined,
  isMultiple: boolean,
) {
  if (options?.length) {
    return options.map((v) => {
      return omit(v, 'disabled', 'options');
    });
  }

  if (isMultiple) {
    if (Array.isArray(value)) {
      return value.filter(Boolean) as AssociationOption[];
    }
    return [];
  }

  if (value && typeof value === 'object') {
    return [value as AssociationOption];
  }

  return [];
}
