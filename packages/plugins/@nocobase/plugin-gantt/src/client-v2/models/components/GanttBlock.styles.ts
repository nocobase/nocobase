/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';

export const createGanttBlockClassNames = ({
  token,
  tableWidth,
  hasVerticalScroll,
  hasHorizontalScroll,
  hasHorizontalTableScroll,
  rowHeight,
}: {
  token: any;
  tableWidth: number;
  hasVerticalScroll?: boolean;
  hasHorizontalScroll?: boolean;
  hasHorizontalTableScroll?: boolean;
  rowHeight: number;
}) => {
  return {
    tableClass: cx(css`
      .ant-table-container::after {
        box-shadow: none !important;
      }
    `),
    contentClass: cx(css`
      position: relative;
      display: flex;
      align-items: stretch;
      width: 100%;
      overflow: hidden;
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: ${token.borderRadius}px;
    `),
    actionsColumnClass: cx(css`
      flex: 0 0 min(${tableWidth}px, calc(100% - 160px));
      width: min(${tableWidth}px, calc(100% - 160px));
      max-width: calc(100% - 160px);
      min-width: ${Math.min(tableWidth, 120)}px;
      background: ${token.colorBgContainer};
      border-inline-end: 1px solid ${token.colorBorderSecondary};
      overflow: hidden;
      ${hasHorizontalScroll && !hasHorizontalTableScroll ? 'padding-bottom: 16px;' : ''}
    `),
    actionsTableClass: cx(css`
      .ant-table {
        background: ${token.colorBgContainer};
      }
      .ant-table-cell {
        border-color: ${token.colorSplit};
        white-space: nowrap;
      }
      .ant-table-tbody > tr {
        height: ${rowHeight}px;
      }
      .ant-table-tbody > tr > td {
        height: ${rowHeight}px;
      }
      .nb-gantt-table-index {
        opacity: 0;
      }
      .nb-gantt-row-selection:not(.checked) .nb-gantt-table-index {
        opacity: 1;
      }
      .nb-gantt-row-selection:hover .nb-gantt-table-index {
        opacity: 0;
      }
      .nb-gantt-origin-node {
        opacity: 0;
        pointer-events: none;
      }
      .nb-gantt-row-selection:hover .nb-gantt-origin-node,
      .nb-gantt-origin-node.checked {
        opacity: 1;
        pointer-events: auto;
      }
      ${hasVerticalScroll
        ? `
          .ant-table-body,
          .ant-table-content {
            overflow-y: scroll !important;
            scrollbar-gutter: stable;
          }
        `
        : ''}
    `),
    chartClass: cx(css`
      flex: 1 1 auto;
      min-width: 0;
      position: relative;
      ${hasHorizontalScroll ? 'padding-bottom: 16px;' : ''}
      ${hasVerticalScroll ? 'padding-inline-end: 1rem;' : ''}
    `),
    paginationClass: cx(css`
      display: flex;
      justify-content: flex-end;
      padding-top: ${token.paddingSM}px;
    `),
  };
};
