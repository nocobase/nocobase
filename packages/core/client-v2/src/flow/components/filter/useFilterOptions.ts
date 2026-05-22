/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection } from '@nocobase/flow-engine';
import { useMemo } from 'react';
import { fieldsToOptions } from './fieldsToOptions';

/**
 * One operator entry on a `FilterOption`. Mirrors v1's interface-defined operator shape so the v2 filter value renderer can pick up the same per-operator value-side schema (e.g. datetime operators wanting the smart date picker, array/enum operators wanting a tag-mode Select).
 */
export type FilterOperator = {
  value: string;
  label: string;
  /**
   * Per-operator override for the value-side renderer. Wins over the field's own `uiSchema` when set. The `x-component` string is looked up against the v2 filter component registry.
   */
  schema?: { 'x-component'?: string; 'x-component-props'?: Record<string, any> } & Record<string, any>;
  /** Operator takes no right-hand value (e.g. `$empty`, `$notEmpty`). */
  noValue?: boolean;
  [key: string]: any;
};

/** Single field-tree node returned by `useFilterOptions`. */
export type FilterOption = {
  name: string;
  type?: string;
  target?: string;
  title: string;
  schema?: Record<string, any>;
  operators?: FilterOperator[];
  children?: FilterOption[];
};

export interface UseFilterOptionsArgs {
  /**
   * Whitelist of root-level field names to expose. Empty/undefined means "all filterable fields". The whitelist applies only at depth 1 — nested fields under an allowed association field are always included, matching the legacy v1 `Filter.Action` behaviour.
   */
  filterableFieldNames?: string[];
  /** Bypass the `filterableFieldNames` whitelist (mirrors v1 `noIgnore`). */
  noIgnore?: boolean;
  /** Translator used for field/operator labels. Defaults to identity. */
  t?: (key: string) => string;
}

const identity = (s: string) => s;

/**
 * v2 equivalent of v1's `useFilterOptions`/`useFilterFieldOptions`. Walks a `Collection`'s fields and returns the nested option tree consumed by antd `Cascader` in `CollectionFilterItem` (and any other v2 filter surface that wants the same field picker).
 *
 * Mirrors v1 in two ways that matter:
 * - association fields (belongsTo / hasMany / m2m / etc.) are kept and recursed into via `fieldsToOptions`'s `nested` branch — so picking `user.username` is a first-class action, just like the legacy cascader.
 * - the whitelist applies at depth 1 only, so capping the root field list (e.g. to `['lockedTs', 'unlockTs', 'user']`) doesn't accidentally hide the nested `user.username` / `user.nickname` leaves.
 */
export function useFilterOptions(collection: Collection | undefined, args: UseFilterOptionsArgs = {}): FilterOption[] {
  const { filterableFieldNames, noIgnore = false, t = identity } = args;

  const fields = useMemo(() => collection?.getFields() || [], [collection]);

  const ignoreFieldsNames = useMemo(() => {
    if (noIgnore || !filterableFieldNames?.length) return [];
    return fields.map((f) => f.name).filter((n) => !filterableFieldNames.includes(n));
  }, [fields, filterableFieldNames, noIgnore]);

  return useMemo(
    () =>
      fieldsToOptions(
        fields.filter((field) => field.target !== 'attachments' && field.interface !== 'formula'),
        1,
        ignoreFieldsNames,
        t,
      ).filter(Boolean) as FilterOption[],
    [fields, ignoreFieldsNames, t],
  );
}
