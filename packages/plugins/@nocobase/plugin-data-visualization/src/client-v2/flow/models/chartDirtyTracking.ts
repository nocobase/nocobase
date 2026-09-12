/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client-v2';
import type { Collection, CollectionField, FlowEngine } from '@nocobase/flow-engine';
import _ from 'lodash';

type ChartDirtyTarget = {
  dataSourceKey: string;
  collectionName: string;
};

type ChartQueryFieldItem = {
  field?: unknown;
};

export type ChartQueryForDirtyTracking = {
  mode?: string;
  collectionPath?: unknown[];
  measures?: ChartQueryFieldItem[];
  dimensions?: ChartQueryFieldItem[];
  orders?: ChartQueryFieldItem[];
  filter?: unknown;
};

export type ChartDirtyRefreshSnapshot = {
  query: ChartQueryForDirtyTracking;
  targetKey: string;
  dirtyVersion: number;
};

type DataSourceManagerLike = {
  getCollection?: (dataSourceKey: string, collectionName: string) => Collection | undefined;
};

function getDirtyTargetKey(target: ChartDirtyTarget): string {
  return `${target.dataSourceKey}:${target.collectionName}`;
}

function addDirtyTarget(targets: Map<string, ChartDirtyTarget>, dataSourceKey: string, collectionName: string) {
  if (!collectionName) return;
  const target = {
    dataSourceKey: dataSourceKey || DEFAULT_DATA_SOURCE_KEY,
    collectionName,
  };
  targets.set(getDirtyTargetKey(target), target);
}

function normalizeFieldSegments(field: unknown): string[] {
  if (Array.isArray(field)) {
    return field.filter((segment): segment is string => typeof segment === 'string' && !!segment);
  }
  if (typeof field === 'string') {
    return field.split('.').filter(Boolean);
  }
  return [];
}

function collectFilterFieldSegments(filter: unknown, result: string[][]) {
  if (!filter) return;
  if (Array.isArray(filter)) {
    filter.forEach((item) => collectFilterFieldSegments(item, result));
    return;
  }
  if (typeof filter !== 'object') return;

  const item = filter as Record<string, unknown>;
  const pathSegments = normalizeFieldSegments(item.path);
  if (pathSegments.length) {
    result.push(pathSegments);
  }

  collectFilterFieldSegments(item.items, result);
  collectFilterFieldSegments(item.$and, result);
  collectFilterFieldSegments(item.$or, result);
}

function collectQueryFieldSegments(query: ChartQueryForDirtyTracking): string[][] {
  const result: string[][] = [];
  [query.measures, query.dimensions, query.orders].forEach((items) => {
    items?.forEach((item) => {
      const fieldSegments = normalizeFieldSegments(item?.field);
      if (fieldSegments.length) {
        result.push(fieldSegments);
      }
    });
  });
  collectFilterFieldSegments(query.filter, result);
  return result;
}

function addRelatedDirtyTargets(
  targets: Map<string, ChartDirtyTarget>,
  dataSourceManager: DataSourceManagerLike,
  dataSourceKey: string,
  collectionName: string,
  fieldSegments: string[],
) {
  let collection = dataSourceManager.getCollection?.(dataSourceKey, collectionName);
  if (!collection) return;

  for (const fieldName of fieldSegments) {
    const collectionField = collection.getField(fieldName) as CollectionField | undefined;
    if (!collectionField) return;

    const targetCollection = collectionField.targetCollection;
    if (!targetCollection) {
      continue;
    }

    addDirtyTarget(targets, targetCollection.dataSourceKey || dataSourceKey, targetCollection.name);
    collection = targetCollection;
  }
}

function getDirtyTrackingTargets(
  dataSourceManager: DataSourceManagerLike,
  query?: ChartQueryForDirtyTracking,
): ChartDirtyTarget[] | null {
  if (!query || query.mode === 'sql') {
    return null;
  }

  const [rawDataSourceKey = DEFAULT_DATA_SOURCE_KEY, rawCollectionName] = query.collectionPath || [];
  if (typeof rawCollectionName !== 'string' || !rawCollectionName) {
    return null;
  }

  const dataSourceKey =
    typeof rawDataSourceKey === 'string' && rawDataSourceKey ? rawDataSourceKey : DEFAULT_DATA_SOURCE_KEY;
  const targets = new Map<string, ChartDirtyTarget>();
  addDirtyTarget(targets, dataSourceKey, rawCollectionName);
  collectQueryFieldSegments(query).forEach((fieldSegments) => {
    addRelatedDirtyTargets(targets, dataSourceManager, dataSourceKey, rawCollectionName, fieldSegments);
  });

  return Array.from(targets.values()).sort(
    (a, b) => a.dataSourceKey.localeCompare(b.dataSourceKey) || a.collectionName.localeCompare(b.collectionName),
  );
}

function getDirtyTrackingVersion(engine: FlowEngine, targets: ChartDirtyTarget[]): number {
  return targets.reduce(
    (version, target) => version + engine.getDataSourceDirtyVersion(target.dataSourceKey, target.collectionName),
    0,
  );
}

function getDirtyTargetsKey(targets: ChartDirtyTarget[]): string {
  return targets.map((target) => getDirtyTargetKey(target)).join('|');
}

export function getChartDirtyRefreshSnapshot(options: {
  engine: FlowEngine;
  dataSourceManager: DataSourceManagerLike;
  query?: ChartQueryForDirtyTracking;
}): ChartDirtyRefreshSnapshot | null {
  const targets = getDirtyTrackingTargets(options.dataSourceManager, options.query);
  if (!targets) {
    return null;
  }

  return {
    query: _.cloneDeep(options.query || {}),
    targetKey: getDirtyTargetsKey(targets),
    dirtyVersion: getDirtyTrackingVersion(options.engine, targets),
  };
}

export function shouldRefreshChartOnActive(options: {
  forceRefresh?: boolean;
  currentSnapshot: ChartDirtyRefreshSnapshot | null;
  lastSnapshot: ChartDirtyRefreshSnapshot | null;
}): boolean {
  const { forceRefresh, currentSnapshot, lastSnapshot } = options;
  if (!currentSnapshot) return true;
  if (forceRefresh || !lastSnapshot) return true;

  return (
    currentSnapshot.targetKey !== lastSnapshot.targetKey ||
    currentSnapshot.dirtyVersion !== lastSnapshot.dirtyVersion ||
    !_.isEqual(currentSnapshot.query, lastSnapshot.query)
  );
}
