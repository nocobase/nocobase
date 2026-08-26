/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
export function extractIndex(str) {
  const numbers = [];
  str?.split('.').forEach(function (element) {
    if (!isNaN(element)) {
      numbers.push(String(Number(element) + 1));
    }
  });
  return numbers.join('.');
}

export function adjustColumnOrder(columns) {
  const leftFixedColumns = [];
  const normalColumns = [];
  const rightFixedColumns = [];

  columns.forEach((column) => {
    if (column.fixed === 'left') {
      leftFixedColumns.push(column);
    } else if (column.fixed === 'right') {
      rightFixedColumns.push(column);
    } else {
      normalColumns.push(column);
    }
  });

  return [...leftFixedColumns, ...normalColumns, ...rightFixedColumns];
}

export function setNestedValue(data, recordIndex, value) {
  // 检查 recordIndex 是否为数字（表示平铺的数据）
  if (typeof recordIndex === 'number') {
    // 平铺数据：直接使用索引来更新
    data[recordIndex] = value;
  } else if (typeof recordIndex === 'string') {
    // 树形数据：路径是字符串，拆分并更新嵌套结构
    const keys = recordIndex.split('.'); // 将路径拆分成数组
    let current = data;

    // 遍历路径，找到目标位置
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]; // 深入到树形结构的下一层
    }

    // 更新最后一级的数据
    current[keys[keys.length - 1]] = value;
  }
}

export function extractIds(data) {
  let ids = [];
  data.forEach((item) => {
    ids.push(item.id); // 添加当前项的 id
    if (item.children && Array.isArray(item.children)) {
      // 如果有子项，递归提取子项的 id
      ids = ids.concat(extractIds(item.children));
    }
  });
  return ids;
}

/**
 * 生成表格行唯一 key
 * @param record 当前行数据
 * @param key string | string[] 单字段或多字段
 */
export function getRowKey(record: any, key: string | string[]) {
  if (Array.isArray(key)) {
    return key.map((k) => String(record?.[k] ?? '')).join('-');
  }
  return record?.[key] ?? '';
}

type UseBlockHeightOptions = {
  heightMode?: string;
  tableAreaRef: React.RefObject<HTMLDivElement>;
  deps?: React.DependencyList;
};

export const useBlockHeight = ({ heightMode, tableAreaRef, deps = [] }: UseBlockHeightOptions) => {
  const [scrollY, setScrollY] = useState<number>();

  const calcScrollY = useCallback(() => {
    if (heightMode !== 'specifyValue' && heightMode !== 'fullHeight') {
      setScrollY((prev) => (prev === undefined ? prev : undefined));
      return;
    }
    const tableArea = tableAreaRef.current;
    if (!tableArea) return;
    const areaHeight = tableArea.getBoundingClientRect().height;
    if (!areaHeight) return;
    const headerEl = tableArea.querySelector('.ant-table-header') || tableArea.querySelector('.ant-table-thead');
    const paginationEl = tableArea.querySelector('.ant-table-pagination');
    const headerHeight = headerEl?.getBoundingClientRect().height ?? 0;
    const paginationHeight = paginationEl?.getBoundingClientRect().height ?? 0;
    const nextScrollY = Math.max(0, Math.floor(areaHeight - headerHeight - paginationHeight));
    setScrollY((prev) => (prev === nextScrollY ? prev : nextScrollY));
  }, [heightMode, tableAreaRef]);

  useLayoutEffect(() => {
    calcScrollY();
  }, [calcScrollY, ...deps]);

  useEffect(() => {
    if (!tableAreaRef.current || typeof ResizeObserver === 'undefined') return;
    const tableArea = tableAreaRef.current;
    const headerEl = tableArea.querySelector('.ant-table-header') || tableArea.querySelector('.ant-table-thead');
    const paginationEl = tableArea.querySelector('.ant-table-pagination');
    const observer = new ResizeObserver(() => calcScrollY());
    observer.observe(tableArea);
    if (headerEl) observer.observe(headerEl);
    if (paginationEl) observer.observe(paginationEl);
    return () => observer.disconnect();
  }, [calcScrollY, tableAreaRef, ...deps]);

  return scrollY;
};
