/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import {
  normalizeFilterableOperators,
  type FieldFilterable,
  type FieldFilterOperator,
} from '../../../../collection-manager/filter-operators';
import { operators } from '../../../../flow-compat';
import { BlockGridModel, CollectionBlockModel } from '../../base';

type FilterFormFieldMeta = {
  filterable?: FieldFilterable<unknown> | false;
  interface?: string;
  type?: string;
};

type FilterFormOperatorModel = FlowModel & {
  operator?: string;
  collectionField?: FilterFormFieldMeta;
  filterField?: FilterFormFieldMeta;
  subModels?: {
    field?: {
      operator?: string;
    };
  };
  getStepParams?: (flowKey: string, stepKey: string) => { value?: string } | undefined;
};

function getModelContext(model: FlowModel) {
  return model.context as unknown as Record<string, unknown>;
}

function getModelField(model: FlowModel, key: 'collectionField' | 'filterField') {
  const modelWithFields = model as FilterFormOperatorModel;
  const field = modelWithFields[key] || getModelContext(model)?.[key];
  return field && typeof field === 'object' ? (field as FilterFormFieldMeta) : undefined;
}

function getDataSourceManager(model: FlowModel) {
  const contextManager = getModelContext(model)?.dataSourceManager;
  if (contextManager) {
    return contextManager as Record<string, unknown>;
  }
  return model.flowEngine?.context?.dataSourceManager as unknown as Record<string, unknown> | undefined;
}

function cloneFilterable(filterable: FieldFilterable<unknown>): FieldFilterable<unknown> {
  return {
    operatorGroup: filterable.operatorGroup,
    operators: Array.isArray(filterable.operators) ? [...filterable.operators] : filterable.operators,
    operatorOverrides: Array.isArray(filterable.operatorOverrides)
      ? [...filterable.operatorOverrides]
      : filterable.operatorOverrides,
  };
}

function getFilterableOperators(filterable?: FieldFilterable<unknown> | false) {
  if (filterable === false) {
    return [];
  }

  if (!filterable || typeof filterable !== 'object') {
    return;
  }

  const normalized = normalizeFilterableOperators(cloneFilterable(filterable));
  if (Array.isArray(normalized?.operators) && normalized.operators.length > 0) {
    return normalized.operators;
  }

  if (Array.isArray(normalized?.operatorOverrides) && normalized.operatorOverrides.length > 0) {
    return normalized.operatorOverrides;
  }
}

function getFieldInterfaceFilterable(model: FlowModel, field?: FilterFormFieldMeta) {
  const interfaceName = typeof field?.interface === 'string' ? field.interface : undefined;
  if (!interfaceName) {
    return;
  }

  const dataSourceManager = getDataSourceManager(model);
  const fieldInterfaceManager = dataSourceManager?.collectionFieldInterfaceManager as
    | {
        getFieldInterface?: (name: string) => { filterable?: FieldFilterable<unknown> | false } | undefined;
      }
    | undefined;
  const fieldInterface = fieldInterfaceManager?.getFieldInterface?.(interfaceName);
  return fieldInterface?.filterable;
}

function getFallbackOperators(field?: FilterFormFieldMeta) {
  const fallbackKeys = [field?.interface, field?.type].filter((item): item is string => typeof item === 'string');
  const standardOperators = operators as Record<string, FieldFilterOperator<unknown>[] | undefined>;
  for (const key of fallbackKeys) {
    const operatorList = standardOperators[key];
    if (operatorList?.length) {
      return operatorList;
    }
  }
  return [];
}

export function getFilterFormOperatorList(model: FlowModel) {
  const collectionField = getModelField(model, 'collectionField');
  const filterField = getModelField(model, 'filterField');
  const field = collectionField || filterField;

  if (field?.filterable === false) {
    return [];
  }

  const fieldOperators = getFilterableOperators(field?.filterable);
  if (fieldOperators?.length) {
    return fieldOperators;
  }

  const fieldInterfaceFilterable = getFieldInterfaceFilterable(model, field);
  if (fieldInterfaceFilterable === false) {
    return [];
  }

  const fieldInterfaceOperators = getFilterableOperators(fieldInterfaceFilterable);
  if (fieldInterfaceOperators?.length) {
    return fieldInterfaceOperators;
  }

  return getFallbackOperators(field);
}

export function getFilterFormOperatorMeta(model: FlowModel, operator = getDefaultOperator(model)) {
  if (!operator) {
    return null;
  }

  const meta = getModelField(model, 'collectionField') || getModelField(model, 'filterField');
  return (
    getFilterFormOperatorList(model).find((op) => op.value === operator && (!op.visible || op.visible(meta))) || null
  );
}

export function getDefaultOperator(model: FilterFormOperatorModel) {
  const operatorList = getFilterFormOperatorList(model);
  return (
    model.operator ||
    model.getStepParams?.('filterFormItemSettings', 'defaultOperator')?.value ||
    model.subModels?.field?.operator ||
    operatorList.find((op) => op.selected)?.value ||
    operatorList[0]?.value ||
    '$includes'
  );
}

/**
 * 判断筛选值是否为空
 *
 * 专门用于筛选器场景的空值判断，不会将 boolean 类型视为空值
 *
 * @param value - 要判断的值
 * @returns 如果值为空则返回 true，否则返回 false
 */
export function isFilterValueEmpty(value: any): boolean {
  // null 或 undefined 视为空
  if (value === null || value === undefined) {
    return true;
  }

  // 空字符串视为空
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }

  // 空数组或仅包含空值的数组视为空
  if (Array.isArray(value)) {
    const nonEmptyItems = value.filter((item) => {
      if (item === null || item === undefined) {
        return false;
      }
      if (typeof item === 'string' && item.trim() === '') {
        return false;
      }
      return true;
    });
    if (nonEmptyItems.length === 0) {
      return true;
    }
  }

  // 空对象视为空（但不包括 Date、RegExp 等特殊对象）
  if (typeof value === 'object' && value.constructor === Object && Object.keys(value).length === 0) {
    return true;
  }

  // 其他情况（包括 boolean、number、Date 等）都不视为空
  return false;
}

export function getAllDataModels(gridModel: BlockGridModel): FlowModel[] {
  return gridModel.filterSubModels('items', (item: CollectionBlockModel) => {
    return !!item.resource?.supportsFilter;
  });
}
