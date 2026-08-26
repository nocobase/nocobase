/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection } from '@nocobase/flow-engine';
import { Empty } from 'antd';
import React, { forwardRef, useImperativeHandle } from 'react';
import { FilterGroup } from '../../../flow/components/filter';
import {
  compileFilterGroup,
  type CompiledFilter,
  type FilterApplyAction,
  useFilterActionProps,
} from './useFilterActionProps';

const identity = (s: string) => s;

export interface CollectionFilterPanelRef {
  getFilter: () => CompiledFilter;
  reset: () => void;
}

export interface CollectionFilterPanelProps {
  /** Collection whose fields drive the filter row's field picker. */
  collection: Collection | undefined;
  /** Previously compiled filter param used to seed the editable filter group. */
  initialValue?: CompiledFilter;
  /** Called when the condition group structure changes or `reset()` is invoked. */
  onChange?: (filter: CompiledFilter) => void;
  /** Translator. Defaults to identity. */
  t?: (key: string, options?: Record<string, unknown>) => string;
  /** Whitelist of root-level field names to expose. */
  filterableFieldNames?: string[];
  /**
   * Blacklist of root-level field names to drop. Mirrors v1's `nonfilterable: [...]` on `Filter.Action`.
   */
  nonfilterableFieldNames?: string[];
  /** Bypass the `filterableFieldNames` whitelist. */
  noIgnore?: boolean;
}

/**
 * Inline collection filter editor for forms and drawers. Unlike `CollectionFilter`, this does not render a trigger button, popover, or nested `<form>`, so it can safely live inside an antd form and be submitted by the outer drawer action.
 */
export const CollectionFilterPanel = forwardRef<CollectionFilterPanelRef, CollectionFilterPanelProps>((props, ref) => {
  const {
    collection,
    initialValue,
    onChange,
    t = identity,
    filterableFieldNames,
    nonfilterableFieldNames,
    noIgnore,
  } = props;

  const filterAction = useFilterActionProps({
    collection,
    initialValue,
    filterableFieldNames,
    nonfilterableFieldNames,
    noIgnore,
    t,
    onApply: (filter: CompiledFilter, _action: FilterApplyAction) => {
      onChange?.(filter);
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      getFilter: () => compileFilterGroup(filterAction.value),
      reset: filterAction.onReset,
    }),
    [filterAction.onReset, filterAction.value],
  );

  if (!collection || !filterAction.FilterItem) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No data')} />;
  }

  return (
    <FilterGroup
      value={filterAction.value}
      FilterItem={filterAction.FilterItem}
      onChange={() => onChange?.(compileFilterGroup(filterAction.value))}
    />
  );
});

CollectionFilterPanel.displayName = 'CollectionFilterPanel';

export default CollectionFilterPanel;
