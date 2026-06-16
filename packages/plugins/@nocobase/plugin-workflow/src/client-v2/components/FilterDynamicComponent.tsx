/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterGroup, CollectionFilterItem, type CollectionFilterItemValue } from '@nocobase/client-v2';
import { observable, reaction, toJS, useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { cloneDeep } from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';
import { removeInvalidFilterItems, type FilterGroupType } from '@nocobase/utils/client';
import { useT } from '../locale';
import { getCollection } from './collection/utils';

type FilterCondition = CollectionFilterItemValue;

type FilterGroupValue = {
  logic: '$and' | '$or';
  items: Array<FilterCondition | FilterGroupValue>;
};

function createEmptyGroup(): FilterGroupType {
  return { logic: '$and', items: [] };
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
      return nestPath(item.path, { [item.operator]: item.value });
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
      value: operatorValue,
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
  const currentCollection = useMemo(
    () => getCollection(flowEngine.context.dataSourceManager, collection),
    [flowEngine, collection],
  );

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
    if (!currentCollection) {
      return null;
    }

    const Component = ({ value }: { value: CollectionFilterItemValue }) => (
      <CollectionFilterItem
        value={value}
        collection={currentCollection}
        t={stableT}
        fieldPlaceholder={stableT('Select field')}
        operatorPlaceholder={stableT('Comparision')}
        valuePlaceholder={null}
        fieldWidth={160}
        operatorMinWidth={110}
      />
    );
    Component.displayName = 'WorkflowCollectionFilterItem';
    return Component;
  }, [currentCollection, stableT]);

  return <FilterGroup value={filterRef.current} FilterItem={FilterItemComponent ?? undefined} />;
}

export const ConditionField = FilterDynamicComponent;

export default FilterDynamicComponent;
