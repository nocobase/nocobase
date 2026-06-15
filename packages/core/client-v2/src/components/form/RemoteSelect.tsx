/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import { Select, type SelectProps } from 'antd';
import React, { useMemo } from 'react';

export interface RemoteSelectFieldNames {
  label?: string;
  value?: string;
}

export interface RemoteSelectProps<RawItem = any, Resp = RawItem[], V = any>
  extends Omit<SelectProps<V>, 'options' | 'loading'> {
  /**
   * Fetch the option source. Receives no arguments; caller closes over the
   * `ctx.api.resource(...)` (or any other source) it needs. May resolve
   * with either an array of raw items (the common case) or an arbitrary
   * envelope object — in the latter case, supply `selectItems` to pluck
   * the array out.
   */
  request: () => Promise<Resp | undefined>;
  /**
   * When `request` returns an envelope (object with metadata around the
   * list), use this to extract the array of items that drives the
   * dropdown. Defaults to identity, i.e. `request` itself returns the
   * array.
   */
  selectItems?: (response: Resp) => RawItem[] | undefined;
  /**
   * Names of the raw item properties that hold the display label and the
   * persisted value. Defaults to `{ label: 'label', value: 'value' }`.
   * Ignored when `mapOptions` is supplied.
   */
  fieldNames?: RemoteSelectFieldNames;
  /**
   * Full custom mapping from a raw item to an antd `OptionType`. When
   * provided, overrides `fieldNames`.
   */
  mapOptions?: (item: RawItem, index: number) => { label: React.ReactNode; value: any };
  /**
   * Stable cache key for ahooks `useRequest` so the dropdown doesn't re-fetch
   * on every re-mount. Pass a value tied to the request's effective inputs.
   */
  cacheKey?: string;
  /**
   * Re-run the request when any of these values changes. Forwarded to
   * `useRequest`'s `refreshDeps`.
   */
  refreshDeps?: unknown[];
  /**
   * Skip the auto-fetch on mount when `false`. Defaults to `true`.
   */
  ready?: boolean;
  /**
   * Notified once the request resolves. Receives both the mapped item
   * array and the raw response envelope — useful when callers need to
   * read sibling metadata (counts, availability hints, etc.) without
   * issuing a second request.
   */
  onLoaded?: (items: RawItem[], response: Resp) => void;
}

/**
 * Generic settings-page Select bound to an async option source. The
 * component itself stays framework-agnostic — it knows nothing about
 * NocoBase resources, data sources, or Formily. Pass any async `request`
 * that resolves with an array, and supply `fieldNames` (or `mapOptions`)
 * to map raw items to antd option shape.
 *
 * Search is local-only (antd's default `optionFilterProp="label"`). For
 * server-side search, drive `request` from external state and pass the
 * search input via `refreshDeps`.
 */
export function RemoteSelect<RawItem = any, Resp = RawItem[], V = any>(props: RemoteSelectProps<RawItem, Resp, V>) {
  const {
    request,
    selectItems,
    fieldNames,
    mapOptions,
    cacheKey,
    refreshDeps,
    ready = true,
    onLoaded,
    showSearch = true,
    allowClear = true,
    ...selectProps
  } = props;

  const { data: response, loading } = useRequest<Resp | undefined, []>(request, {
    cacheKey,
    refreshDeps,
    ready,
    onSuccess: (resp) => {
      if (resp === undefined) return;
      const items = (selectItems ? selectItems(resp) : (resp as unknown as RawItem[])) || [];
      onLoaded?.(items, resp);
    },
  });

  const items = useMemo<RawItem[]>(() => {
    if (response === undefined) return [];
    return (selectItems ? selectItems(response) : (response as unknown as RawItem[])) || [];
  }, [response, selectItems]);

  const labelKey = fieldNames?.label ?? 'label';
  const valueKey = fieldNames?.value ?? 'value';

  const options = useMemo(() => {
    if (mapOptions) {
      return items.map((item, index) => mapOptions(item, index));
    }
    return items.map((item: any) => ({
      label: item?.[labelKey],
      value: item?.[valueKey],
    }));
  }, [items, mapOptions, labelKey, valueKey]);

  return (
    <Select
      {...selectProps}
      showSearch={showSearch}
      allowClear={allowClear}
      optionFilterProp="label"
      loading={loading}
      options={options}
    />
  );
}

export default RemoteSelect;
