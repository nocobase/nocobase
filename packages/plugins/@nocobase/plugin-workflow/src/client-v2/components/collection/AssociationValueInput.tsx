/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { useDebounce } from 'ahooks';
import { RemoteSelect } from '@nocobase/client-v2';
import { useFlowEngine } from '@nocobase/flow-engine';
import { WorkflowVariableWrapper } from '../WorkflowVariableWrapper';
import { getCollection, parseCollectionName, type CollectionTriggerField } from './utils';

type RecordValue = Record<string, unknown>;
type Key = string | number;

function recordKey(value: unknown, key: string): Key | undefined {
  const result = value && typeof value === 'object' ? (value as RecordValue)[key] : value;
  return typeof result === 'string' || typeof result === 'number' ? result : undefined;
}

export function AssociationValueInput({
  collection,
  field,
  value,
  onChange,
  disabled,
}: {
  collection: string;
  field: CollectionTriggerField & { name: string };
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}) {
  const engine = useFlowEngine();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, { wait: 300 });
  const [dataSourceKey] = parseCollectionName(collection);
  const source = getCollection(engine.context.dataSourceManager, collection);
  const association = source?.getField(field.name);
  const target = association?.targetCollection;
  const valueKey = field.targetKey || target?.filterTargetKey || 'id';
  const key = typeof valueKey === 'string' ? valueKey : 'id';
  const label = association?.targetCollectionTitleFieldName || target?.titleCollectionField?.name || key;
  const multiple = ['hasMany', 'belongsToMany', 'belongsToArray'].includes(field.type ?? '');
  const normalize = (current: unknown) =>
    Array.isArray(current)
      ? current.map((item) => recordKey(item, key)).filter((item): item is Key => item !== undefined)
      : recordKey(current, key);
  const normalized = normalize(value);
  const selected = Array.isArray(normalized) ? normalized : normalized == null || normalized === '' ? [] : [normalized];
  const selectedKeys = JSON.stringify(selected);

  return (
    <WorkflowVariableWrapper<Key | Key[]>
      value={normalized}
      onChange={(next) => {
        if (!disabled) onChange(next);
      }}
      selectorProps={{ disabled }}
      render={({ value: current, onChange: change }) => (
        <RemoteSelect<RecordValue, RecordValue[], Key | Key[]>
          value={current === '' ? undefined : current}
          onChange={(next) => change?.(next ?? (multiple ? [] : null))}
          disabled={disabled}
          mode={multiple ? 'multiple' : undefined}
          style={{ width: '100%' }}
          filterOption={false}
          onSearch={setSearch}
          fieldNames={{ label, value: key }}
          refreshDeps={[dataSourceKey, field.target, key, label, debouncedSearch, selectedKeys]}
          request={async () => {
            const resource = engine.context.api.resource(field.target, null, { 'x-data-source': dataSourceKey });
            const response = await resource.list({
              pageSize: 50,
              ...(debouncedSearch ? { filter: { [label]: { $includes: debouncedSearch } } } : {}),
            });
            const items: RecordValue[] = response?.data?.data ?? [];
            const missing = selected.filter((id) => !items.some((item) => item[key] === id));
            if (!missing.length) return items;
            const selectedResponse = await resource.list({
              filter: { [key]: { $in: missing } },
              paginate: false,
            });
            return [...items, ...(selectedResponse?.data?.data ?? [])];
          }}
        />
      )}
    />
  );
}
