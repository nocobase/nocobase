/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr, FlowModel } from '@nocobase/flow-engine';
import {
  resolveFilterOperators,
  type FieldFilterable,
  type FieldFilterOperator,
  type FieldFilterOperatorList,
} from '../../../../../collection-manager/filter-operators';
import { operators } from '../../../../../flow-compat';
import { FilterFormFieldModel } from '../../filter-form/fields';

export const defaultOperator: any = defineAction<FilterFormFieldModel>({
  name: 'defaultOperator',
  title: tExpr('Default operator'),
  uiMode(ctx) {
    const operatorOptions = getOperatorOptions(ctx.model);
    return {
      type: 'select',
      key: 'value',
      props: {
        options: operatorOptions,
      },
    };
  },
  defaultParams(ctx) {
    const operatorOptions = getOperatorOptions(ctx.model);
    return {
      value: operatorOptions.length > 0 ? operatorOptions[0].value : '',
    };
  },
  handler(ctx, params) {
    ctx.model.operator = params.value;
  },
});

function getOperatorOptions(model: FlowModel) {
  const meta = model.context.collectionField || model.context.filterField;
  return getOperatorList(model)
    .filter((op) => !op.visible || op.visible(meta))
    .map((op) => ({
      ...op,
      label: model.translate(op.label),
    }));
}

function getOperatorList(model: FlowModel) {
  const collectionField = model.context.collectionField;
  const collectionFieldOperators = getFilterableOperators(collectionField?.filterable);
  if (collectionFieldOperators) {
    return collectionFieldOperators;
  }

  const fieldInterfaceOperators = getFieldInterfaceOperators(model, collectionField || model.context.filterField);
  if (fieldInterfaceOperators.length > 0) {
    return fieldInterfaceOperators;
  }

  const filterFieldType = model.context.filterField?.type;
  if (!filterFieldType) {
    return [];
  }

  return ((operators as Record<string, FieldFilterOperator[]>)[filterFieldType] || []) as FieldFilterOperator[];
}

function getFilterableOperators(filterable?: FieldFilterable): FieldFilterOperator[] | undefined {
  if (!filterable) {
    return;
  }

  if (Array.isArray(filterable.operators) || typeof filterable.operators === 'string') {
    return resolveFilterOperators(filterable.operators as FieldFilterOperatorList);
  }

  if (typeof filterable.operatorGroup === 'string') {
    return resolveFilterOperators(filterable.operatorGroup);
  }
}

function getFieldInterfaceOperators(model: FlowModel, field?: Record<string, unknown>) {
  const interfaceName = typeof field?.interface === 'string' ? field.interface : undefined;
  if (!interfaceName) {
    return [];
  }

  const dataSourceManager = model.context.dataSourceManager || model.flowEngine?.context?.dataSourceManager;
  const fieldInterface = dataSourceManager?.collectionFieldInterfaceManager?.getFieldInterface?.(interfaceName);
  return getFilterableOperators(fieldInterface?.filterable) || [];
}
