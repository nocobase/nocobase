/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { Select } from 'antd';
import React from 'react';
import type { Collection, CollectionField, DataSource, DataSourceManager } from '../data-source';
import { useFlowSettingsContext } from '../hooks/useFlowSettingsContext';
import type { CollectionEnvelope, DataSourceEnvelope } from './types';
import { isPlainRecord } from './values';

type SelectOption = {
  label: string;
  value: string;
};

type EnvelopeSelectProps<TValue> = {
  value?: TValue;
  onChange?: (value?: TValue) => void;
  disabled?: boolean;
  placeholder?: string;
};

function useDataSourceManager(): DataSourceManager | undefined {
  const ctx = useFlowSettingsContext();
  return ctx?.dataSourceManager;
}

function getEnvelopeName(value: unknown): string | undefined {
  return isPlainRecord(value) && typeof value.name === 'string' ? value.name : undefined;
}

function resolveDataSourceKeys(
  manager: DataSourceManager | undefined,
  dataSourceRef: unknown,
  values: Record<string, unknown>,
) {
  if (!manager) {
    return [];
  }
  if (typeof dataSourceRef === 'string' && dataSourceRef.startsWith('$')) {
    const key = getEnvelopeName(values[dataSourceRef.slice(1)]);
    return key ? [key] : [];
  }
  if (isPlainRecord(dataSourceRef) && dataSourceRef.$type === 'dataSource' && typeof dataSourceRef.name === 'string') {
    return [dataSourceRef.name];
  }
  return manager.getDataSources().map((dataSource) => dataSource.key);
}

function resolveCollectionRef(collectionRef: unknown, values: Record<string, unknown>): CollectionEnvelope | undefined {
  if (typeof collectionRef === 'string' && collectionRef.startsWith('$')) {
    const value = values[collectionRef.slice(1)];
    if (
      isPlainRecord(value) &&
      value.$type === 'collection' &&
      typeof value.dataSource === 'string' &&
      typeof value.name === 'string'
    ) {
      return { $type: 'collection', dataSource: value.dataSource, name: value.name };
    }
    return undefined;
  }
  if (
    isPlainRecord(collectionRef) &&
    collectionRef.$type === 'collection' &&
    typeof collectionRef.dataSource === 'string' &&
    typeof collectionRef.name === 'string'
  ) {
    return { $type: 'collection', dataSource: collectionRef.dataSource, name: collectionRef.name };
  }
  return undefined;
}

function useFormValues(): Record<string, unknown> {
  try {
    const form = useForm();
    return (form?.values || {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function RunJSSettingsDataSourceSelect(props: EnvelopeSelectProps<DataSourceEnvelope>) {
  const manager = useDataSourceManager();
  const options: SelectOption[] =
    manager?.getDataSources().map((dataSource: DataSource) => ({
      label: dataSource.displayName || dataSource.key,
      value: dataSource.key,
    })) || [];
  return (
    <Select
      allowClear
      disabled={props.disabled}
      options={options}
      placeholder={props.placeholder}
      value={props.value?.name}
      onChange={(name?: string) => {
        props.onChange?.(name ? { $type: 'dataSource', name } : undefined);
      }}
    />
  );
}

export function RunJSSettingsCollectionSelect(
  props: EnvelopeSelectProps<CollectionEnvelope> & { dataSource?: string | DataSourceEnvelope },
) {
  const manager = useDataSourceManager();
  const values = useFormValues();
  const dataSourceKeys = resolveDataSourceKeys(manager, props.dataSource, values);
  const options: SelectOption[] = dataSourceKeys.flatMap((dataSourceKey) => {
    const dataSource = manager?.getDataSource(dataSourceKey);
    return (
      dataSource?.getCollections().map((collection: Collection) => ({
        label: `${dataSource.displayName || dataSource.key} / ${collection.title || collection.name}`,
        value: `${dataSource.key}.${collection.name}`,
      })) || []
    );
  });
  const value = props.value ? `${props.value.dataSource}.${props.value.name}` : undefined;
  return (
    <Select
      allowClear
      disabled={props.disabled}
      options={options}
      placeholder={props.placeholder}
      value={value}
      onChange={(nextValue?: string) => {
        if (!nextValue) {
          props.onChange?.(undefined);
          return;
        }
        const [dataSource, ...collectionParts] = nextValue.split('.');
        props.onChange?.({ $type: 'collection', dataSource, name: collectionParts.join('.') });
      }}
    />
  );
}

export function RunJSSettingsCollectionFieldSelect(
  props: EnvelopeSelectProps<{
    $type: 'collectionField';
    dataSource: string;
    collection: string;
    name: string;
  }> & {
    collection?: string | CollectionEnvelope;
    fieldTypes?: string[];
  },
) {
  const manager = useDataSourceManager();
  const values = useFormValues();
  const collectionRef = resolveCollectionRef(props.collection, values);
  const collection = collectionRef ? manager?.getCollection(collectionRef.dataSource, collectionRef.name) : undefined;
  const fieldTypes = new Set(props.fieldTypes || []);
  const options: SelectOption[] =
    collection
      ?.getFields()
      .filter((field: CollectionField) => !fieldTypes.size || fieldTypes.has(field.type))
      .map((field: CollectionField) => ({
        label: field.title || field.name,
        value: field.name,
      })) || [];
  return (
    <Select
      allowClear
      disabled={props.disabled || !collectionRef}
      options={options}
      placeholder={props.placeholder}
      value={props.value?.name}
      onChange={(fieldName?: string) => {
        if (!fieldName || !collectionRef) {
          props.onChange?.(undefined);
          return;
        }
        props.onChange?.({
          $type: 'collectionField',
          dataSource: collectionRef.dataSource,
          collection: collectionRef.name,
          name: fieldName,
        });
      }}
    />
  );
}
