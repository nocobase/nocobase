/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionField, DataSourceManager } from '@nocobase/flow-engine';
import type { FieldTreeCollectionManager } from '../../canvas/collectionFieldOptions';

export type ScheduleCollectionField = {
  name?: string;
  type?: string;
  target?: string;
  hidden?: boolean;
  uiSchema?: { title?: string; ['x-read-pretty']?: boolean };
};

export function joinCollectionName(dataSourceKey: string, collectionName: string) {
  if (!dataSourceKey || dataSourceKey === 'main') {
    return collectionName;
  }
  return `${dataSourceKey}:${collectionName}`;
}

export function parseCollectionName(value?: string): [string, string] | [] {
  if (!value) {
    return [];
  }
  const parts = value.split(':');
  const collectionName = parts.pop();
  const dataSourceKey = parts[0] ?? 'main';
  return collectionName ? [dataSourceKey, collectionName] : [];
}

function normalizeField(field: CollectionField): ScheduleCollectionField {
  return (field.options ?? field) as ScheduleCollectionField;
}

export function getCollectionManagerAdapter(
  dataSourceManager: DataSourceManager | undefined,
  dataSourceKey = 'main',
): FieldTreeCollectionManager {
  return {
    getCollection(collectionName: string) {
      return dataSourceManager?.getDataSource?.(dataSourceKey)?.collectionManager?.getCollection?.(collectionName);
    },
    getCollectionAllFields(collectionName: string) {
      return (
        dataSourceManager
          ?.getDataSource?.(dataSourceKey)
          ?.collectionManager?.getCollection?.(collectionName)
          ?.getFields?.()
          ?.map(normalizeField) ?? []
      );
    },
  };
}

export type CollectionOption = { value: string; label: string; children?: CollectionOption[] };

export function getCollectionOptions(dataSourceManager: DataSourceManager | undefined): CollectionOption[] {
  const dataSources = dataSourceManager?.getDataSources?.() ?? [];
  return dataSources
    .filter((ds) => ds.key === 'main' || ds.options?.isDBInstance)
    .map((ds) => ({
      value: ds.key,
      label: ds.displayName,
      children: ds
        .getCollections()
        .filter((collection) => !collection.hidden)
        .map((collection) => ({
          value: collection.name,
          label: collection.title,
        })),
    }));
}

export function getCollectionFields(
  dataSourceManager: DataSourceManager | undefined,
  collectionValue?: string,
): ScheduleCollectionField[] {
  const [dataSourceKey, collectionName] = parseCollectionName(collectionValue) as [string, string];
  if (!dataSourceKey || !collectionName) {
    return [];
  }
  return (
    dataSourceManager
      ?.getDataSource?.(dataSourceKey)
      ?.collectionManager?.getCollection?.(collectionName)
      ?.getFields?.()
      ?.map(normalizeField) ?? []
  );
}

export function isDateField(field: ScheduleCollectionField) {
  return !field.hidden && Boolean(field.uiSchema) && ['date', 'datetimeTz', 'datetimeNoTz'].includes(field.type);
}

export function isAssociationField(field: ScheduleCollectionField) {
  return ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany', 'belongsToArray'].includes(field.type);
}

export function hasFieldName(field: ScheduleCollectionField): field is ScheduleCollectionField & { name: string } {
  return typeof field.name === 'string' && field.name.length > 0;
}
