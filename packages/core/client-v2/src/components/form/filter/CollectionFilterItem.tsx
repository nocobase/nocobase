/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { Collection, observer, useFlowEngine } from '@nocobase/flow-engine';
import { Cascader, Select, Space } from 'antd';
import React, { FC, useMemo } from 'react';
import { FilterOption, useFilterOptions } from '../../../flow/components/filter/useFilterOptions';
import { FilterValueInput } from './FilterValueInput';

/**
 * Lift the Cascader sub-menu height so a target collection with many fields (e.g. `users` → id / nickname / username / email / phone / password / createdAt / updatedAt / roles / createdBy / updatedBy) doesn't get truncated below the default antd menu viewport.
 */
const cascaderPopupClass = css`
  .ant-cascader-menu {
    height: fit-content;
    max-height: 50vh;
  }
`;

export interface CollectionFilterItemValue {
  path: string;
  operator: string;
  /** Operator-dependent — string for default ops, descriptor for $date*, etc. */
  value: any;
}

type CascaderOption = {
  value: string;
  label: string;
  children?: CascaderOption[];
};

export interface CollectionFilterItemProps {
  /** Reactive filter row managed by the parent `FilterContainer`. */
  value: CollectionFilterItemValue;
  /** Target collection whose fields populate the field selector. */
  collection: Collection;
  /** Whitelist of field names to expose; empty/undefined means all filterable fields. */
  filterableFieldNames?: string[];
  /**
   * Blacklist of field names to drop. Mirrors v1's `nonfilterable: [...]` on `Filter.Action`. When both whitelist and blacklist are supplied, both apply (final = whitelist ∩ ¬blacklist).
   */
  nonfilterableFieldNames?: string[];
  /**
   * Bypass the `filterableFieldNames` whitelist (matches the legacy FilterItem `noIgnore`).
   *
   * Legacy escape hatch — prefer adjusting `filterableFieldNames` / `nonfilterableFieldNames` instead.
   */
  noIgnore?: boolean;
  /** Translator; defaults to identity so callers can omit it. */
  t?: (key: string) => string;
  /** Optional v2 app registry used to resolve plugin-provided operator components. */
  app?: { getComponent?: (name: string) => React.ComponentType<any> | undefined };
}

const identity = (s: string) => s;

/**
 * Walk a tree of field options by name path, returning the leaf option (or undefined when the path doesn't resolve). Used to look up operators for the currently selected field.
 */
const findOptionByPath = (options: FilterOption[], path: string[]): FilterOption | undefined => {
  if (!path.length) return undefined;
  const [head, ...rest] = path;
  const match = options.find((option) => option.name === head);
  if (!match) return undefined;
  if (!rest.length) return match;
  return findOptionByPath(match.children || [], rest);
};

/**
 * Convert the field-option tree (as produced by `useFilterOptions`) into antd `Cascader`'s expected `{ value, label, children }` shape. With `changeOnSelect={false}` (see the render below), antd already requires selection at a leaf — we don't need to mark association parents as `disabled`, and doing so would also block `expandTrigger="hover"` from descending into them.
 */
const toCascaderOptions = (options: FilterOption[]): CascaderOption[] =>
  options.map((option) => {
    const children = option.children?.length ? toCascaderOptions(option.children) : undefined;
    return {
      value: option.name,
      label: option.title,
      children,
    };
  });

/**
 * Filter row bound directly to a `Collection`, with no `FlowModel` dependency. Use this from settings pages or other surfaces that need a filter UI but don't have (and shouldn't synthesise) a block model just to satisfy `FilterItem`. Pair with `FilterContainer` via either an inline wrapper or `createCollectionFilterItem(collection)`.
 *
 * The field selector is an antd `Cascader`, mirroring v1's `Filter.Action` so association fields (belongsTo / m2o / etc.) can be drilled into — picking `user.username` is a first-class action. The value renderer is delegated to `FilterValueInput`, which dispatches to interface-specific controls (the smart date picker for `$date*` operators, tag-mode Select for array/enum, etc.) the same way v1's `DynamicComponent` did.
 */
export const CollectionFilterItem: FC<CollectionFilterItemProps> = observer(
  (props) => {
    const { collection, filterableFieldNames, nonfilterableFieldNames, noIgnore = false, t = identity } = props;
    const { path: leftValue, operator, value: rightValue } = props.value;
    const flowEngine = useFlowEngine({ throwError: false }) as any;
    const app = props.app || flowEngine?.context?.app;

    const options = useFilterOptions(collection, { filterableFieldNames, nonfilterableFieldNames, noIgnore, t });

    const cascaderOptions = useMemo(() => toCascaderOptions(options), [options]);

    const fieldPath = useMemo(() => (leftValue ? leftValue.split('.') : []), [leftValue]);

    const selectedField = useMemo(() => findOptionByPath(options, fieldPath), [options, fieldPath]);

    const operatorOptions = useMemo(() => selectedField?.operators || [], [selectedField]);

    const selectedOperator = useMemo(
      () => operatorOptions.find((op) => op.value === operator),
      [operatorOptions, operator],
    );

    const handleFieldChange = (next: (string | number)[]) => {
      const path = next.map(String);
      props.value.path = path.join('.');
      const leaf = findOptionByPath(options, path);
      props.value.operator = leaf?.operators?.[0]?.value || '';
      // The value's shape is operator-dependent (e.g. string for `$eq`, `{ type, number, unit }` for `$dateInPast`); reset on every field change so stale shapes don't leak across interfaces.
      props.value.value = undefined;
    };
    const handleOperatorChange = (next: string) => {
      props.value.operator = next;
      // Same rationale as above — switching from `$eq` (string) to `$dateOn` (date descriptor) makes the previous value structurally incompatible. v1 handled this by remounting the DynamicComponent on operator change; we explicitly clear.
      props.value.value = undefined;
    };
    const handleValueChange = (next: any) => {
      props.value.value = next;
    };

    // Widths mirror the long-standing `FilterItem` row (200 / 120) so a settings page mixing CollectionFilterItem and FilterContainer doesn't visually drift from existing block-bound filter rows.
    return (
      <Space wrap>
        <Cascader
          style={{ width: 200 }}
          placeholder={t('Select field')}
          options={cascaderOptions}
          value={fieldPath}
          onChange={handleFieldChange}
          changeOnSelect={false}
          expandTrigger="click"
          popupClassName={cascaderPopupClass}
        />
        <Select
          style={{ width: 120 }}
          placeholder={t('Comparision')}
          value={operator || undefined}
          onChange={handleOperatorChange}
          disabled={!leftValue || operatorOptions.length === 0}
        >
          {operatorOptions.map((op) => (
            <Select.Option key={op.value} value={op.value}>
              {op.label}
            </Select.Option>
          ))}
        </Select>
        <FilterValueInput
          field={selectedField}
          operator={selectedOperator}
          value={rightValue}
          onChange={handleValueChange}
          placeholder={t('Enter value')}
          t={t}
          app={app}
        />
      </Space>
    );
  },
  { displayName: 'CollectionFilterItem' },
);

/**
 * Convenience factory returning a `FilterContainer`-compatible `FilterItem` component bound to a specific collection. Avoids creating an inline closure on every parent render, which would otherwise reset any focused inner antd control.
 */
export function createCollectionFilterItem(
  collection: Collection,
  bound?: Pick<
    CollectionFilterItemProps,
    'filterableFieldNames' | 'nonfilterableFieldNames' | 'noIgnore' | 't' | 'app'
  >,
) {
  const Component: FC<{ value: CollectionFilterItemValue }> = (props) => (
    <CollectionFilterItem {...bound} value={props.value} collection={collection} />
  );
  Component.displayName = 'BoundCollectionFilterItem';
  return Component;
}

export default CollectionFilterItem;
