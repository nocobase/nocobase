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
   * **Preferred way to restrict fields**, alongside `nonfilterableFieldNames`.
   *
   * Whitelist of root-level field names to expose. Empty/undefined means "all filterable fields". The whitelist applies only at depth 1 — nested fields under an allowed association field are always included, matching the legacy v1 `Filter.Action` behaviour.
   */
  filterableFieldNames?: string[];
  /**
   * **Preferred way to restrict fields**, alongside `filterableFieldNames`.
   *
   * Blacklist of root-level field names to drop. Mirrors v1's `nonfilterable: [...]` schema prop on `Filter.Action`. Applies at depth 1 only, same as the whitelist. When both `filterableFieldNames` and `nonfilterableFieldNames` are provided, both apply: the final field set is `(whitelist or all) minus blacklist`.
   */
  nonfilterableFieldNames?: string[];
  /**
   * Bypass the `filterableFieldNames` whitelist (mirrors v1 `noIgnore`).
   *
   * Legacy escape hatch from v1 schemas — prefer adjusting `filterableFieldNames` / `nonfilterableFieldNames` instead. Kept only for parity with existing v1 schemas that already set `noIgnore`.
   */
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
  const { filterableFieldNames, nonfilterableFieldNames, noIgnore = false, t = identity } = args;

  const fields = useMemo(() => collection?.getFields() || [], [collection]);

  const ignoreFieldsNames = useMemo(() => {
    // Whitelist contribution: every field not in `filterableFieldNames`.
    // Skipped when `noIgnore` is set, or when no whitelist was provided.
    const whitelistIgnored =
      noIgnore || !filterableFieldNames?.length
        ? []
        : fields.map((f) => f.name).filter((n) => !filterableFieldNames.includes(n));
    // Blacklist contribution: explicit names. Always applied, even with
    // `noIgnore` (the blacklist's whole job is to subtract specific fields).
    const blacklistIgnored = nonfilterableFieldNames ?? [];
    if (!blacklistIgnored.length) return whitelistIgnored;
    // Union the two so the final ignore set is `whitelist-derived ∪ blacklist`.
    return Array.from(new Set([...whitelistIgnored, ...blacklistIgnored]));
  }, [fields, filterableFieldNames, nonfilterableFieldNames, noIgnore]);

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
