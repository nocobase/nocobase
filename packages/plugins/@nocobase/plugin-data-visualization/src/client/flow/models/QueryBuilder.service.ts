/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client';
import { formatters, debugLog } from '../utils';

function isDatabaseDataSource(dataSource: any) {
  return dataSource?.key === DEFAULT_DATA_SOURCE_KEY || dataSource?.options?.isDBInstance || dataSource?.isDBInstance;
}

function getFieldInterface(dm: any, field: any) {
  return field?.getInterfaceOptions?.() || dm?.collectionFieldInterfaceManager?.getFieldInterface?.(field?.interface);
}

function getFieldFilterable(dm: any, field: any) {
  if (field?.filterable === false) {
    return false;
  }
  return field?.filterable || getFieldInterface(dm, field)?.filterable;
}

function getFieldTitle(field: any) {
  return field?.uiSchema?.title ?? field?.options?.uiSchema?.title ?? field?.title ?? field?.name;
}

function getTargetFields(dm: any, dataSourceKey: string, field: any) {
  try {
    return (
      field?.getFields?.() ||
      field?.targetCollection?.getFields?.() ||
      dm.getCollection?.(dataSourceKey, field.target)?.getFields?.() ||
      []
    );
  } catch {
    return [];
  }
}

// 纯函数：构建字段树
export function getFieldOptions(dm: any, compile: (v: any) => string, collectionPath?: string[]) {
  const [dataSourceKey, collectionName] = collectionPath || [];
  if (!dm || !collectionName) return [];

  const dsKey = dataSourceKey || DEFAULT_DATA_SOURCE_KEY;
  const collection = dm.getCollection?.(dsKey, collectionName);

  if (!collection) return [];

  const collectionFields = collection.getFields?.() || [];

  const toOption = (field: any, depth: number, prefix?: string) => {
    if (!field?.interface) return undefined;
    const filterable = getFieldFilterable(dm, field);
    if (!filterable) return undefined;

    const value = prefix ? `${prefix}.${field.name}` : field.name;
    const opt: any = {
      name: field.name,
      title: compile(getFieldTitle(field)),
      key: value,
      value: field.name,
    };

    if (depth < 1) {
      const children = filterable?.children || [];
      if (children.length) {
        opt.children = children.map((c: any) => ({
          ...c,
          title: compile(c?.title ?? c?.name),
          key: `${field.name}.${c.name}`,
          value: c.name,
        }));
      }
      if (filterable?.nested && field.target) {
        const targetFields = getTargetFields(dm, dsKey, field);
        const nested = targetFields.map((tf: any) => toOption(tf, depth + 1, field.name)).filter(Boolean);
        opt.children = [...(opt.children || []), ...nested];
      }
    }
    return opt;
  };

  return collectionFields.map((f: any) => toOption(f, 0)).filter(Boolean);
}

// 纯函数：将字段值规范为别名字符串（数组拼接、字符串原样、空值返回空串）
export function aliasOf(val: any): string {
  return Array.isArray(val) ? val.filter(Boolean).join('.') : val || '';
}

function orderKeyOf(item: any): string {
  return item?.alias || aliasOf(item?.field);
}

function findOptionByPath(options: any[] = [], path: string[]): any {
  if (!path.length) return null;

  let currentOptions = options;
  let currentOption = null;

  for (const segment of path) {
    currentOption = (currentOptions || []).find((opt) => opt?.name === segment);
    if (!currentOption) return null;
    currentOptions = currentOption?.children || [];
  }

  return currentOption;
}

export function buildOrderFieldOptions(
  fieldOptions: any[] = [],
  dimensionsValue: any[] = [],
  measuresValue: any[] = [],
) {
  const hasAgg = (measuresValue || []).some((m: any) => !!m?.aggregation);
  if (!hasAgg) return fieldOptions;

  const toPath = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean).map(String);
    return [String(val)];
  };

  const selectedFields = [...(dimensionsValue || []), ...(measuresValue || [])];
  const uniqueOptions = new Map<string, any>();

  selectedFields.forEach((item: any) => {
    const path = toPath(item?.field);
    const key = orderKeyOf(item);
    if (!path.length || !key || uniqueOptions.has(key)) {
      return;
    }

    const matched = findOptionByPath(fieldOptions, path);
    uniqueOptions.set(key, {
      ...(matched || {}),
      name: key,
      key,
      value: key,
      title: item?.alias || matched?.title || aliasOf(item?.field),
      children: undefined,
    });
  });

  return Array.from(uniqueOptions.values());
}

// 纯函数：根据维度“字段值”返回格式化选项
export function getFormatterOptionsByField(dm: any, collectionPath: string[] | undefined, dimField: any) {
  const alias = aliasOf(dimField);
  if (!alias) return [];

  const [dataSourceKey, collectionName] = collectionPath || [];
  if (!dm || !collectionName) return [];

  const dsKey = dataSourceKey || DEFAULT_DATA_SOURCE_KEY;
  const collection = dm.getCollection?.(dsKey, collectionName);
  if (!collection) return [];

  const parts = alias.split('.');
  const [first, second] = parts;

  const rootFields = collection.getFields?.() || [];
  const root = rootFields.find((f: any) => f.name === first);
  if (!root) return [];

  const iface =
    second && root.target
      ? getTargetFields(dm, dsKey, root).find((f: any) => f.name === second)?.interface
      : root.interface;

  switch (iface) {
    case 'datetime':
    case 'datetimeTz':
    case 'unixTimestamp':
    case 'datetimeNoTz':
    case 'createdAt':
    case 'updatedAt':
      return formatters.datetime;
    case 'date':
      return formatters.date;
    case 'time':
      return formatters.time;
    default:
      return [];
  }
}

// 新增：纯函数，构建“数据源/集合”选项（保持原有签名）
export function getCollectionOptions(dm: any, compile: (v: any) => string) {
  if (!dm) return [];

  const dataSources = dm.getDataSources?.() || [];
  return dataSources
    .filter(isDatabaseDataSource)
    .map((dataSource: any) => ({
      key: dataSource.key,
      displayName: dataSource.displayName,
      collections: dataSource.getCollections?.() || [],
    }))
    .map(({ key, displayName, collections }: any) => ({
      value: key,
      label: compile(displayName),
      children: (collections || []).map((c: any) => ({
        value: c.name,
        label: compile(c.title ?? c.name),
      })),
    }));
}

export function validateQuery(query: Record<string, any>): { success: boolean; message: string } {
  debugLog('---validateQuery', query);
  if (!query) {
    return { success: false, message: 'query is required' };
  }
  if (!query.mode) {
    return { success: false, message: 'please select query mode' };
  }
  if (query.mode === 'sql' && !query.sql) {
    return { success: false, message: 'please input SQL' };
  }
  if (query.mode === 'builder') {
    if (!query.collectionPath?.length) {
      return { success: false, message: 'please select datasource and collection' };
    }
    if (!query.measures?.length) {
      return { success: false, message: 'please select measures' };
    }

    const hasAgg = (query.measures || []).some((m: any) => !!m?.aggregation);
    if (hasAgg) {
      const allowedOrderFields = new Set<string>();
      (query.dimensions || []).forEach((d: any) => {
        const alias = orderKeyOf(d);
        if (alias) allowedOrderFields.add(alias);
      });
      (query.measures || []).forEach((m: any) => {
        const alias = orderKeyOf(m);
        if (alias) allowedOrderFields.add(alias);
      });

      if (Array.isArray(query.orders) && query.orders.length) {
        for (const order of query.orders) {
          const alias = orderKeyOf(order);
          if (!alias || !allowedOrderFields.has(alias)) {
            return { success: false, message: 'please select valid sort field' };
          }
        }
      }
    }

    // 允许filter整体为空（undefined/null），允许 items 为空或空数组
    const filter = query.filter;
    if (filter && Array.isArray(filter.items) && filter.items.length > 0) {
      // 递归检测是否存在非法空 path
      const hasInvalidPath = (items: any[]): boolean => {
        for (const it of items) {
          if (it && typeof it === 'object') {
            // 组：继续递归
            if (it.logic && Array.isArray(it.items)) {
              if (hasInvalidPath(it.items)) return true;
            } else {
              // 规则项：校验 path
              const path = (it as any).path;
              if (typeof path === 'string' && path.trim().length === 0) {
                return true;
              }
            }
          }
        }
        return false;
      };

      if (hasInvalidPath(filter.items)) {
        return { success: false, message: 'please select filter field' };
      }
    }
  }

  return { success: true, message: '' };
}
