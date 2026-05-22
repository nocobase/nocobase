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
  /** Called on Submit or Reset with the compiled NocoBase filter param (`undefined` when cleared). */
  onChange: (filter: CompiledFilter) => void;
  /** Translator. Defaults to identity. */
  t?: (key: string) => string;
  /** Whitelist of root-level field names to expose. */
  filterableFieldNames?: string[];
  /** Bypass the `filterableFieldNames` whitelist. */
  noIgnore?: boolean;
  /** Override the trigger button's label. Defaults to `t('Filter')`. */
  buttonText?: React.ReactNode;
  /** Show the `(N)` condition-count badge on the trigger. Defaults to `true`. */
  showCount?: boolean;
  /** Pass-through props for the antd `<Popover>`. */
  popoverProps?: Omit<PopoverProps, 'open' | 'onOpenChange' | 'content' | 'children'>;
  /** Pass-through props for the trigger `<Button>`. */
  buttonProps?: Omit<ButtonProps, 'icon' | 'type' | 'children' | 'onClick'>;
  /** Min-width applied to the popover body. Defaults to `520`. */
  popoverMinWidth?: number;
}

/**
 * Filter button bound to a collection. Renders an antd `<Popover>` over a
 * `<Button>`; the popover hosts a multi-condition filter form (field
 * picker, operator, value). Submit dismisses the popover and emits the
 * compiled filter via `onChange`; Reset keeps the popover open and emits
 * `undefined`.
 *
 * Pair with `<ExtendCollectionsProvider>` when the target collection is
 * client-only (e.g. a `schema-only` server collection that isn't
 * auto-published to the v2 data source).
 */
export const CollectionFilter: FC<CollectionFilterProps> = (props) => {
  const {
    collection,
    onChange,
    t = identity,
    filterableFieldNames,
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
    filterableFieldNames,
    noIgnore,
    t,
    onApply: (filter: CompiledFilter, action: FilterApplyAction) => {
      onChange(filter);
      if (action === 'submit') setOpen(false);
    },
  });

  const label = buttonText ?? t('Filter');
  const hasConditions = filterAction.conditionCount > 0;

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
      <Button
        icon={<FilterOutlined />}
        type={hasConditions ? 'primary' : 'default'}
        disabled={!collection}
        {...buttonProps}
      >
        {label}
        {showCount && hasConditions ? ` (${filterAction.conditionCount})` : ''}
      </Button>
    </Popover>
  );
};

export default CollectionFilter;
