/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, observable } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { useMemo, useRef } from 'react';
import { FilterOption, useFilterOptions, UseFilterOptionsArgs } from '../../../flow/components/filter/useFilterOptions';
import { CollectionFilterItemValue, createCollectionFilterItem } from './CollectionFilterItem';

/** A single condition row (`{ path, operator, value }`) or a nested group. */
export type FilterGroupItem = CollectionFilterItemValue | FilterGroupValue;

/**
 * Reactive shape consumed by `FilterContainer` / `FilterGroup`. `logic` is the join (`$and` / `$or`) and `items` is a heterogeneous list of leaf conditions and nested groups.
 */
export type FilterGroupValue = {
  logic: '$and' | '$or';
  items: FilterGroupItem[];
};

/** Compiled filter param accepted by NocoBase resource `list`. */
export type CompiledFilter = Record<string, unknown> | undefined;

interface FilterCtxModel {
  translate: (key: string) => string;
  dispatchEvent: (event: 'submit' | 'reset' | (string & {})) => void;
}

export interface FilterCtx {
  model: FilterCtxModel;
}

const isGroup = (item: FilterGroupItem): item is FilterGroupValue =>
  Array.isArray((item as FilterGroupValue).items) && typeof (item as FilterGroupValue).logic === 'string';

const isCondition = (item: FilterGroupItem): item is CollectionFilterItemValue =>
  typeof (item as CollectionFilterItemValue).path === 'string' &&
  Object.prototype.hasOwnProperty.call(item, 'operator');

/**
 * `true` when the rhs of a condition is "no real value yet" — covers `undefined` / `null` / empty string / empty array / empty plain object. Mirrors v1's `removeNullCondition` `isEmpty` predicate so half-filled rows ("Locked time → is → (no date picked yet)") get dropped on Submit instead of being sent to the server as `{lockedTs:{}}` and triggering a 500.
 */
const isEmptyFilterValue = (value: unknown): boolean => {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    // Plain `{}` only — descriptor shapes like `{ type: 'today' }` have own keys and survive this check.
    return Object.keys(value as Record<string, unknown>).length === 0;
  }
  return false;
};

/**
 * Build a nested object from a dotted path. `'user.createdBy.password'` + `{ $includes: '123' }` becomes `{ user: { createdBy: { password: { $includes: '123' } } } }`. Matches v1's filter payload shape so server-side filter resolution sees the same association chain whether the request came from a v1 or v2 page.
 */
const nestPath = (path: string, leaf: unknown): Record<string, unknown> => {
  const segments = path.split('.');
  let result: unknown = leaf;
  for (let i = segments.length - 1; i >= 0; i--) {
    result = { [segments[i]]: result };
  }
  return result as Record<string, unknown>;
};

const decompileConditions = (value: unknown, path: string[] = []): CollectionFilterItemValue[] => {
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
};

const getGroupLogic = (record: Record<string, unknown>): FilterGroupValue['logic'] | undefined => {
  if (Array.isArray(record.$or)) {
    return '$or';
  }
  if (Array.isArray(record.$and)) {
    return '$and';
  }
  return undefined;
};

const decompileFilterItem = (item: unknown): FilterGroupItem[] => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return [];
  }
  const record = item as Record<string, unknown>;
  if (getGroupLogic(record)) {
    const group = decompileFilterGroup(record);
    return group ? [group] : [];
  }
  return decompileConditions(record);
};

export function decompileFilterGroup(filter: CompiledFilter): FilterGroupValue | undefined {
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
    .filter((item): item is FilterGroupItem => Boolean(item));

  return items.length ? { logic, items } : undefined;
}

/**
 * Compile a reactive filter group into the `{ $and: [{ path: { op: val } }] }` envelope accepted by NocoBase's resource `list` filter param. Returns `undefined` when the group is empty so callers can drop the param.
 *
 * Mirrors v1's `removeNullCondition` + filter compile path, but works on the v2 `{ logic, items }` group structure rather than v1's Formily-bracketed `$and.0.path.$eq` shape:
 *
 * - Rows missing `path` or `operator` are dropped (still mid-edit).
 * - Rows whose `value` is empty (`undefined`, `''`, `[]`, `{}`) are dropped — matches v1, which sends `filter={}` for a row with only a field/operator picked. Sending `{lockedTs:{}}` would 500.
 * - Dotted association paths (`user.createdBy.password`) are expanded into nested objects — matches v1's payload shape, which the server resolves along the association chain rather than treating the dotted string as a single key.
 * - Empty groups (after pruning) propagate as `undefined` so the outermost caller can drop the whole `filter` param.
 */
export function compileFilterGroup(group: FilterGroupValue | undefined): CompiledFilter {
  if (!group?.items?.length) return undefined;
  const compiled = group.items
    .map((entry) => {
      if (isGroup(entry)) return compileFilterGroup(entry);
      if (!isCondition(entry) || !entry.path || !entry.operator) return undefined;
      if (isEmptyFilterValue(entry.value)) return undefined;
      return nestPath(entry.path, { [entry.operator]: entry.value });
    })
    .filter((v): v is Record<string, unknown> => !!v);
  if (!compiled.length) return undefined;
  return { [group.logic]: compiled };
}

const createEmptyGroup = (): FilterGroupValue => ({ logic: '$and', items: [] });

/** Which footer button triggered the apply — useful for closing a popover on Submit but keeping it open on Reset. */
export type FilterApplyAction = 'submit' | 'reset';

export interface UseFilterActionPropsArgs extends UseFilterOptionsArgs {
  /** Collection whose fields populate the filter row's field picker. */
  collection: Collection | undefined;
  /** Previously compiled filter param used to seed the editable filter group. */
  initialValue?: CompiledFilter;
  /**
   * Called when the user submits or resets the filter popover. Receives the compiled filter param (`undefined` when cleared) and which footer button triggered the call. Typical implementation: `(filter, action) => { listRequest.run(filter); if (action === 'submit') closePopover(); }`.
   */
  onApply: (filter: CompiledFilter, action: FilterApplyAction) => void;
}

export interface UseFilterActionPropsResult {
  /**
   * Reactive filter group state. Pass directly to `<FilterContent value={...}>`. Stable across renders.
   */
  value: FilterGroupValue;
  /** Field-option tree (for inspection or custom badges). */
  options: FilterOption[];
  /** Bound `FilterItem` component to plug into `<FilterContent FilterItem={...}>`. */
  FilterItem: ReturnType<typeof createCollectionFilterItem> | undefined;
  /**
   * Ready-to-use `ctx` for `<FilterContent ctx={...}>`. Wires Submit / Reset buttons to `onSubmit` / `onReset` below.
   */
  ctx: FilterCtx;
  /** Imperative trigger — submit current group as a compiled filter. */
  onSubmit: () => void;
  /** Imperative trigger — clear the group and emit an empty filter. */
  onReset: () => void;
  /**
   * Count of top-level condition rows. Useful for showing a badge like `Filter (3)` on the trigger button — matches v1's `field.title = t('{{count}} filter items', { count })`.
   */
  conditionCount: number;
}

/**
 * v2 equivalent of v1's `useFilterActionProps` for non-schema surfaces (settings pages, panels, side drawers). Bundles three things v1's hook returned implicitly through schema:
 *
 * - A reactive `{ logic, items }` group state that `<FilterContent>` reads.
 * - A bound `FilterItem` component (driven by `createCollectionFilterItem`).
 * - A `ctx` object that turns `<FilterContent>`'s `dispatchEvent('submit' | 'reset')` into a compiled filter param passed to `onApply`.
 *
 * Pair with antd `Popover` to recreate the legacy `Filter.Action` UX:
 *
 * ```tsx
 * const { value, ctx, FilterItem, onSubmit, conditionCount } = useFilterActionProps({
 *   collection,
 *   onApply: (filter) => listRequest.run(filter),
 *   t,
 * });
 * return (
 *   <Popover content={<FilterContent value={value} ctx={ctx} FilterItem={FilterItem} />}>
 *     <Button>{t('Filter')}{conditionCount ? ` (${conditionCount})` : ''}</Button>
 *   </Popover>
 * );
 * ```
 */
export function useFilterActionProps(args: UseFilterActionPropsArgs): UseFilterActionPropsResult {
  const { collection, initialValue, onApply, filterableFieldNames, nonfilterableFieldNames, noIgnore, t } = args;

  // Held in a ref so the group object identity is stable for the lifetime of the host component — `<FilterContent>` mutates this object directly (push/splice on `items`, swap `logic`), and a fresh observable on every render would reset that internal state.
  const valueRef = useRef<FilterGroupValue>();
  if (!valueRef.current) {
    valueRef.current = observable(decompileFilterGroup(initialValue) || createEmptyGroup()) as FilterGroupValue;
  }
  const value = valueRef.current;

  const options = useFilterOptions(collection, { filterableFieldNames, nonfilterableFieldNames, noIgnore, t });

  const FilterItem = useMemo(
    () =>
      collection
        ? createCollectionFilterItem(collection, { filterableFieldNames, nonfilterableFieldNames, noIgnore, t })
        : undefined,
    [collection, filterableFieldNames, nonfilterableFieldNames, noIgnore, t],
  );

  const onSubmit = useMemoizedFn(() => {
    onApply(compileFilterGroup(value), 'submit');
  });

  const onReset = useMemoizedFn(() => {
    value.logic = '$and';
    value.items = [];
    onApply(undefined, 'reset');
  });

  const translate = useMemoizedFn((key: string) => (t ? t(key) : key));

  const ctx = useMemo<FilterCtx>(
    () => ({
      model: {
        translate,
        dispatchEvent: (event: string) => {
          if (event === 'submit') onSubmit();
          else if (event === 'reset') onReset();
        },
      },
    }),
    [translate, onSubmit, onReset],
  );

  // Re-read on each render so `observer`-wrapped hosts re-render when the reactive `items` array length changes. No useMemo needed — the `value` object's identity is stable (held in a ref), but its observable `items.length` is what we actually care about, and the eslint exhaustive-deps rule rightly complains about depending on a mutable property of a stable ref.
  const conditionCount = value.items.length;

  return { value, options, FilterItem, ctx, onSubmit, onReset, conditionCount };
}
