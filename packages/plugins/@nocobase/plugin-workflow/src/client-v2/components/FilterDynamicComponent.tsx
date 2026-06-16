/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterGroup, VariableFilterItem, type VariableFilterItemValue } from '@nocobase/client-v2';
import {
  FlowModel,
  observable,
  randomId,
  reaction,
  toJS,
  useFlowEngine,
  type MetaTreeNode,
} from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo, useRef } from 'react';
import { removeInvalidFilterItems, type FilterGroupType } from '@nocobase/utils/client';
import { useWorkflowVariableOptions } from '../canvas/useWorkflowVariableOptions';
import { useT } from '../locale';
import { getCollection } from './collection/utils';

type FilterCondition = VariableFilterItemValue;

type FilterGroupValue = {
  logic: '$and' | '$or';
  items: Array<FilterCondition | FilterGroupValue>;
};

function createEmptyGroup(): FilterGroupType {
  return { logic: '$and', items: [] };
}

const WORKFLOW_VARIABLE_REGEXP = /^\{\{\s*([^{}]+?)\s*\}\}$/;
const CTX_WORKFLOW_VARIABLE_REGEXP = /^\{\{\s*ctx\.(\$[^{}]+?)\s*\}\}$/;

const dateRangeVariableKeys = [
  'yesterday',
  'today',
  'tomorrow',
  'lastWeek',
  'thisWeek',
  'nextWeek',
  'lastMonth',
  'thisMonth',
  'nextMonth',
  'lastQuarter',
  'thisQuarter',
  'nextQuarter',
  'lastYear',
  'thisYear',
  'nextYear',
  'last7Days',
  'next7Days',
  'last30Days',
  'next30Days',
  'last90Days',
  'next90Days',
] as const;

const dateRangeVariableTitles: Record<(typeof dateRangeVariableKeys)[number], string> = {
  yesterday: 'Yesterday',
  today: 'Today',
  tomorrow: 'Tomorrow',
  lastWeek: 'Last week',
  thisWeek: 'This week',
  nextWeek: 'Next week',
  lastMonth: 'Last month',
  thisMonth: 'This month',
  nextMonth: 'Next month',
  lastQuarter: 'Last quarter',
  thisQuarter: 'This quarter',
  nextQuarter: 'Next quarter',
  lastYear: 'Last year',
  thisYear: 'This year',
  nextYear: 'Next year',
  last7Days: 'Last 7 days',
  next7Days: 'Next 7 days',
  last30Days: 'Last 30 days',
  next30Days: 'Next 30 days',
  last90Days: 'Last 90 days',
  next90Days: 'Next 90 days',
};

function toVariableFilterValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const match = value.trim().match(WORKFLOW_VARIABLE_REGEXP);
  if (!match || match[1].startsWith('ctx.')) {
    return value;
  }
  return `{{ ctx.${match[1]} }}`;
}

function toWorkflowFilterValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const match = value.trim().match(CTX_WORKFLOW_VARIABLE_REGEXP);
  if (!match) {
    return value;
  }
  return `{{${match[1]}}}`;
}

function createDateRangeNode(t: (key: string) => string): MetaTreeNode {
  return {
    name: 'dateRange',
    title: t('Date range'),
    type: 'object',
    paths: ['$system', 'dateRange'],
    children: dateRangeVariableKeys.map((key) => ({
      name: key,
      title: t(dateRangeVariableTitles[key]),
      type: 'string',
      paths: ['$system', 'dateRange', key],
    })),
  };
}

function withDateRangeSystemVariable(tree: MetaTreeNode[], t: (key: string) => string): MetaTreeNode[] {
  const dateRangeNode = createDateRangeNode(t);
  const systemIndex = tree.findIndex((node) => node.name === '$system');
  if (systemIndex < 0) {
    return [
      ...tree,
      {
        name: '$system',
        title: t('System variables'),
        type: '',
        paths: ['$system'],
        children: [dateRangeNode],
      },
    ];
  }

  return tree.map((node, index) => {
    if (index !== systemIndex) {
      return node;
    }
    if (typeof node.children === 'function') {
      return node;
    }
    const children = Array.isArray(node.children) ? node.children.filter((item) => item.name !== 'dateRange') : [];
    return {
      ...node,
      children: [...children, dateRangeNode],
    };
  });
}

function isFilterGroupValue(item: unknown): item is FilterGroupValue {
  return Boolean(item && typeof item === 'object' && 'logic' in (item as object) && 'items' in (item as object));
}

function isConditionItem(item: FilterCondition | FilterGroupValue): item is FilterCondition {
  return typeof (item as FilterCondition).path === 'string' && typeof (item as FilterCondition).operator === 'string';
}

function nestPath(path: string, leaf: unknown): Record<string, unknown> {
  const segments = path.split('.');
  let result: unknown = leaf;
  for (let i = segments.length - 1; i >= 0; i--) {
    result = { [segments[i]]: result };
  }
  return result as Record<string, unknown>;
}

function compileFilterGroup(group: FilterGroupType | undefined): Record<string, unknown> | undefined {
  if (!group?.items?.length) {
    return undefined;
  }
  const compiled = group.items
    .map((item) => {
      if (isFilterGroupValue(item)) {
        return compileFilterGroup(item as FilterGroupType);
      }
      if (!isConditionItem(item)) {
        return undefined;
      }
      if (!item.path || !item.operator) {
        return undefined;
      }
      return nestPath(item.path, { [item.operator]: toWorkflowFilterValue(item.value) });
    })
    .filter((item): item is Record<string, unknown> => Boolean(item));
  if (!compiled.length) {
    return undefined;
  }
  return { [group.logic]: compiled };
}

function decompileConditions(value: unknown, path: string[] = []): FilterCondition[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return path.length ? [{ path: path.join('.'), operator: '$eq', value }] : [];
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const operatorEntries = entries.filter(([key]) => key.startsWith('$'));
  if (operatorEntries.length) {
    if (!path.length) {
      return [];
    }
    return operatorEntries.map(([operator, operatorValue]) => ({
      path: path.join('.'),
      operator,
      value: toVariableFilterValue(operatorValue) as VariableFilterItemValue['value'],
    }));
  }

  return entries.flatMap(([fieldName, nextValue]) => decompileConditions(nextValue, [...path, fieldName]));
}

function getGroupLogic(record: Record<string, unknown>): FilterGroupType['logic'] | undefined {
  if (Array.isArray(record.$or)) {
    return '$or';
  }
  if (Array.isArray(record.$and)) {
    return '$and';
  }
  return undefined;
}

function decompileFilterItem(item: unknown): Array<FilterCondition | FilterGroupValue> {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return [];
  }
  const record = item as Record<string, unknown>;
  const logic = getGroupLogic(record);
  if (logic) {
    const group = decompileFilterGroup(record);
    return group ? [group] : [];
  }
  return decompileConditions(record);
}

function decompileFilterGroup(filter: unknown): FilterGroupValue | undefined {
  if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
    return undefined;
  }

  const record = filter as Record<string, unknown>;
  const logic = getGroupLogic(record);
  if (!logic) {
    const items = decompileConditions(record);
    return items.length ? { logic: '$and', items } : undefined;
  }
  const sourceItems = record[logic] as unknown[];
  const items = sourceItems
    .flatMap((item) => decompileFilterItem(item))
    .filter((item): item is FilterCondition | FilterGroupValue => Boolean(item));
  return items.length ? { logic, items } : undefined;
}

function toFilterGroup(value: unknown): FilterGroupType {
  if (isFilterGroupValue(value)) {
    return value as FilterGroupType;
  }
  return decompileFilterGroup(value) ?? createEmptyGroup();
}

export function FilterDynamicComponent({
  collection,
  value,
  onChange,
}: {
  collection?: string;
  value?: Record<string, unknown> | null;
  onChange?: (value: Record<string, unknown> | null) => void;
}) {
  const flowEngine = useFlowEngine();
  const t = useT();
  const stableT = useMemoizedFn((key: string, options?: Record<string, unknown>) => t(key, options));
  const workflowMetaTree = useWorkflowVariableOptions();
  const rightMetaTree = useMemo(
    () => withDateRangeSystemVariable(workflowMetaTree, stableT),
    [stableT, workflowMetaTree],
  );
  const currentCollection = useMemo(
    () => getCollection(flowEngine.context.dataSourceManager, collection),
    [flowEngine, collection],
  );
  const filterModel = useMemo(() => {
    if (!currentCollection) {
      return null;
    }
    const model = flowEngine.createModel<FlowModel>({ uid: randomId('workflowFilter_'), use: FlowModel });
    const app = flowEngine.context.app;
    if (app) {
      model.context.defineProperty('app', { value: app });
    }
    model.context.defineProperty('collection', { get: () => currentCollection });
    return model;
  }, [currentCollection, flowEngine]);

  useEffect(() => {
    return () => {
      filterModel?.remove?.();
    };
  }, [filterModel]);

  const filterRef = useRef<FilterGroupType>();
  if (!filterRef.current) {
    filterRef.current = observable(toFilterGroup(value)) as FilterGroupType;
  }

  const lastExternalSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const nextSignature = JSON.stringify(value ?? {});
    if (lastExternalSignatureRef.current === nextSignature) {
      return;
    }
    const next = toFilterGroup(value);
    if (filterRef.current) {
      filterRef.current.logic = next.logic;
      filterRef.current.items = next.items;
      lastExternalSignatureRef.current = nextSignature;
    }
  }, [value]);

  useEffect(() => {
    if (!filterRef.current) {
      return;
    }

    return reaction(
      () => JSON.stringify(toJS(filterRef.current)),
      (serialized) => {
        const current = JSON.parse(serialized) as FilterGroupType;
        const draftItemsLength = Array.isArray(current.items) ? current.items.length : 0;
        const filtered = removeInvalidFilterItems(current);
        if (!filtered.items.length) {
          if (!draftItemsLength) {
            onChange?.({});
          }
          return;
        }
        const nextValue = compileFilterGroup(filtered) ?? {};
        lastExternalSignatureRef.current = JSON.stringify(nextValue);
        onChange?.(nextValue);
      },
      { fireImmediately: false },
    );
  }, [onChange]);

  const FilterItemComponent = useMemo(() => {
    if (!filterModel) {
      return null;
    }

    const Component = ({ value }: { value: VariableFilterItemValue }) => (
      <VariableFilterItem value={value} model={filterModel} rightAsVariable rightMetaTree={rightMetaTree} />
    );
    Component.displayName = 'WorkflowVariableFilterItem';
    return Component;
  }, [filterModel, rightMetaTree]);

  return <FilterGroup value={filterRef.current} FilterItem={FilterItemComponent ?? undefined} />;
}

export const ConditionField = FilterDynamicComponent;

export default FilterDynamicComponent;
