/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { GanttBlockModel } from '../GanttBlockModel';

export const ROW_SELECTION_COLUMN_WIDTH = 50;
export const TREE_EXPAND_COLUMN_WIDTH = 42;

export const getColumnWidth = (dataSetLength: any, clientWidth: any) => {
  return clientWidth / dataSetLength > 50 ? Math.floor(clientWidth / dataSetLength) + 20 : 60;
};

export const getGanttRowKey = (model: GanttBlockModel, record: any) => {
  const filterByTk = model.collection?.getFilterByTK?.(record);
  if (filterByTk !== undefined && filterByTk !== null) {
    return typeof filterByTk === 'object' ? JSON.stringify(filterByTk) : String(filterByTk);
  }
  return String(record?.id);
};

export const measureElementHeight = (element: Element | null) => {
  return element?.getBoundingClientRect().height || 0;
};

export const getDateIndex = (date: Date, dates: Date[]) => {
  return dates.findIndex(
    (currentDate, index) =>
      date.valueOf() >= currentDate.valueOf() &&
      index + 1 !== dates.length &&
      date.valueOf() < dates[index + 1].valueOf(),
  );
};

export const getTreeRowNumber = (path?: string) => {
  const numbers = [];
  path?.split('.').forEach((item) => {
    if (!isNaN(Number(item))) {
      numbers.push(String(Number(item) + 1));
    }
  });
  return numbers.join('.');
};

export const getRowNumber = ({
  page,
  pageSize,
  rowIndex,
  rowPath,
}: {
  page?: number;
  pageSize?: number;
  rowIndex: number;
  rowPath?: string;
}) => {
  if (rowPath) {
    return getTreeRowNumber(rowPath);
  }

  const currentPage = page || 1;
  const currentPageSize = pageSize || 20;
  return rowIndex + (currentPage - 1) * currentPageSize + 1;
};
