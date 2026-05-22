/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, observer } from '@nocobase/flow-engine';
import { Input, Select, Space } from 'antd';
import React, { FC, useMemo } from 'react';
import { fieldsToOptions } from '../../flow/components/filter/fieldsToOptions';

export interface CollectionFilterItemValue {
  path: string;
  operator: string;
  value: string;
}

export interface CollectionFilterItemProps {
  /** Reactive filter row managed by the parent `FilterContainer`. */
  value: CollectionFilterItemValue;
  /** Target collection whose fields populate the field selector. */
  collection: Collection;
  /** Whitelist of field names to expose; empty/undefined means all filterable fields. */
  filterableFieldNames?: string[];
  /** Bypass the `filterableFieldNames` whitelist (matches the legacy FilterItem `noIgnore`). */
  noIgnore?: boolean;
  /** Translator; defaults to identity so callers can omit it. */
  t?: (key: string) => string;
}

const identity = (s: string) => s;

/**
 * Filter row bound directly to a `Collection`, with no `FlowModel`
 * dependency. Use this from settings pages or other surfaces that need
 * a filter UI but don't have (and shouldn't synthesise) a block model
 * just to satisfy `FilterItem`. Pair with `FilterContainer` via either
 * an inline wrapper or `createCollectionFilterItem(collection)`.
 */
export const CollectionFilterItem: FC<CollectionFilterItemProps> = observer(
  (props) => {
    const { collection, filterableFieldNames, noIgnore = false, t = identity } = props;
    const { path: leftValue, operator, value: rightValue } = props.value;

    const fields = useMemo(() => collection?.getFields() || [], [collection]);

    const ignoreFieldsNames = useMemo(() => {
      if (noIgnore || !filterableFieldNames?.length) return [];
      return fields.map((f) => f.name).filter((n) => !filterableFieldNames.includes(n));
    }, [fields, filterableFieldNames, noIgnore]);

    const options = useMemo(
      () =>
        fieldsToOptions(
          fields.filter(
            (field) =>
              field.target !== 'attachments' &&
              field.interface !== 'formula' &&
              !['belongsTo', 'belongsToMany', 'hasOne', 'hasMany', 'oho', 'obo', 'm2o', 'o2m', 'm2m'].includes(
                field.type,
              ),
          ),
          1,
          ignoreFieldsNames,
          t,
        ).filter(Boolean),
      [fields, ignoreFieldsNames, t],
    );

    const operatorOptions = useMemo(() => {
      const selectedField = options.find((option: { name: string }) => option.name === leftValue);
      return (selectedField as { operators?: { value: string; label: string }[] } | undefined)?.operators || [];
    }, [options, leftValue]);

    const handleFieldChange = (value: string) => {
      props.value.path = value;
      const selectedField = options.find((option: { name: string }) => option.name === value) as
        | { operators?: { value: string }[] }
        | undefined;
      if (selectedField?.operators?.length) {
        props.value.operator = selectedField.operators[0].value;
      } else {
        props.value.operator = '';
      }
      props.value.value = '';
    };
    const handleOperatorChange = (value: string) => {
      props.value.operator = value;
    };
    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      props.value.value = e.target.value;
    };

    // Widths mirror the long-standing `FilterItem` row (200 / 120 / 200) so a
    // settings page mixing CollectionFilterItem and FilterContainer doesn't
    // visually drift from existing block-bound filter rows.
    return (
      <Space>
        <Select
          style={{ width: 200 }}
          placeholder={t('Select field')}
          value={leftValue || undefined}
          onChange={handleFieldChange}
        >
          {options.map((option: { name: string; title: string }) => (
            <Select.Option key={option.name} value={option.name}>
              {option.title}
            </Select.Option>
          ))}
        </Select>
        <Select
          style={{ width: 120 }}
          placeholder={t('Select operator')}
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
        <Input style={{ width: 200 }} placeholder={t('Enter value')} value={rightValue} onChange={handleValueChange} />
      </Space>
    );
  },
  { displayName: 'CollectionFilterItem' },
);

/**
 * Convenience factory returning a `FilterContainer`-compatible
 * `FilterItem` component bound to a specific collection. Avoids creating
 * an inline closure on every parent render, which would otherwise reset
 * any focused inner antd control.
 */
export function createCollectionFilterItem(
  collection: Collection,
  bound?: Pick<CollectionFilterItemProps, 'filterableFieldNames' | 'noIgnore' | 't'>,
) {
  const Component: FC<{ value: CollectionFilterItemValue }> = (props) => (
    <CollectionFilterItem {...bound} value={props.value} collection={collection} />
  );
  Component.displayName = 'BoundCollectionFilterItem';
  return Component;
}

export default CollectionFilterItem;
