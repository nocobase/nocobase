/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterOutlined } from '@ant-design/icons';
import type { Collection } from '@nocobase/flow-engine';
import { Button, type ButtonProps, Popover, type PopoverProps } from 'antd';
import React, { FC, useState } from 'react';
import { FilterContent } from '../../../flow/components/filter';
import { CompiledFilter, FilterApplyAction, useFilterActionProps } from './useFilterActionProps';

const identity = (s: string) => s;

export interface CollectionFilterProps {
  /** Collection whose fields drive the filter row's field picker. */
  collection: Collection | undefined;
  /** Previously compiled filter param used to seed the editable filter group. */
  initialValue?: CompiledFilter;
  /** Default compiled filter used both for initial empty state and Reset. */
  defaultValue?: CompiledFilter;
  /** Called on Submit or Reset with the compiled NocoBase filter param (`undefined` when cleared). */
  onChange: (filter: CompiledFilter) => void;
  /** Translator. Defaults to identity. */
  t?: (key: string, options?: Record<string, any>) => string;
  /** Whitelist of root-level field names to expose. */
  filterableFieldNames?: string[];
  /**
   * Blacklist of root-level field names to drop. Mirrors v1's `nonfilterable: [...]` on `Filter.Action`. When both `filterableFieldNames` and this prop are supplied, both apply (final = whitelist ∩ ¬blacklist).
   */
  nonfilterableFieldNames?: string[];
  /**
   * Bypass the `filterableFieldNames` whitelist.
   *
   * Legacy escape hatch — prefer adjusting `filterableFieldNames` / `nonfilterableFieldNames` instead.
   */
  noIgnore?: boolean;
  /** Override the trigger button's label. Defaults to `t('Filter')`, or the v1-style `t('{{count}} filter items', { count })` when conditions are present. */
  buttonText?: React.ReactNode;
  /** Swap the default `t('Filter')` label for v1's `t('{{count}} filter items', { count })` when conditions are present. Defaults to `true`. */
  showCount?: boolean;
  /** Pass-through props for the antd `<Popover>`. */
  popoverProps?: Omit<PopoverProps, 'open' | 'onOpenChange' | 'content' | 'children'>;
  /** Pass-through props for the trigger `<Button>`. */
  buttonProps?: Omit<ButtonProps, 'icon' | 'type' | 'children' | 'onClick'>;
  /** Min-width applied to the popover body. Defaults to `520`. */
  popoverMinWidth?: number;
}

/**
 * Filter button bound to a collection. Renders an antd `<Popover>` over a `<Button>`; the popover hosts a multi-condition filter form (field picker, operator, value). Submit dismisses the popover and emits the compiled filter via `onChange`; Reset keeps the popover open and emits `undefined`.
 *
 * Pair with `<ExtendCollectionsProvider>` when the target collection is client-only (e.g. a `schema-only` server collection that isn't auto-published to the v2 data source).
 */
export const CollectionFilter: FC<CollectionFilterProps> = (props) => {
  const {
    collection,
    initialValue,
    defaultValue,
    onChange,
    t = identity,
    filterableFieldNames,
    nonfilterableFieldNames,
    noIgnore,
    buttonText,
    showCount = true,
    popoverProps,
    buttonProps,
    popoverMinWidth = 520,
  } = props;

  const [open, setOpen] = useState(false);

  const filterAction = useFilterActionProps({
    collection,
    initialValue,
    defaultValue,
    filterableFieldNames,
    nonfilterableFieldNames,
    noIgnore,
    t,
    onApply: (filter: CompiledFilter, action: FilterApplyAction) => {
      onChange(filter);
      if (action === 'submit') setOpen(false);
    },
  });

  // Matches v1's `Filter.Action`: when at least one condition is set, the button label switches to the count-aware string (`"N 个筛选项"` in zh-CN). The button itself stays in the default (white) style — v1 never flipped it to `type='primary'`.
  const label =
    buttonText ??
    (showCount && filterAction.conditionCount > 0
      ? t('{{count}} filter items', { count: filterAction.conditionCount })
      : t('Filter'));

  return (
    <Popover
      trigger="click"
      placement="bottomLeft"
      {...popoverProps}
      open={open}
      onOpenChange={setOpen}
      content={
        <div style={{ minWidth: popoverMinWidth }}>
          <FilterContent value={filterAction.value} ctx={filterAction.ctx} FilterItem={filterAction.FilterItem} />
        </div>
      }
    >
      <Button icon={<FilterOutlined />} disabled={!collection} {...buttonProps}>
        {label}
      </Button>
    </Popover>
  );
};

export default CollectionFilter;
