/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { SORT_HANDLE_GUTTER } from './constants';

/**
 * Restore horizontal scrolling on `.ant-table-content` so wide tables in
 * narrow containers (drawer / settings panel) scroll their inner `<table>`
 * instead of getting clipped or forcing the outer container to grow.
 *
 * `width: max-content` on the inner `<table>` lets columns size to their
 * natural width; `min-width: 100%` keeps the table filling the viewport
 * when total column width is smaller than the container.
 */
export const tableScrollClassName = css`
  &.ant-table-wrapper .ant-table-content {
    overflow: auto hidden;
  }
  &.ant-table-wrapper .ant-table-content > table {
    width: max-content;
    min-width: 100%;
  }
`;

/**
 * Reserve a `SORT_HANDLE_GUTTER`-wide gap on the left of the rowSelection
 * column so the handle's `left:0` lands inside a `position:relative` cell.
 * Padding is mirrored on both the header `<th>` and body `<td>` so the
 * "select all" checkbox stays vertically aligned with body checkboxes.
 *
 * The class is a module-level constant — emotion's hash is stable across
 * re-renders, so the caller doesn't need a `useMemo` to keep referential
 * equality.
 */
export const selectionGutterClassName = css`
  .ant-table-thead > tr > th.ant-table-selection-column,
  .ant-table-tbody > tr > td.ant-table-selection-column {
    padding-left: ${SORT_HANDLE_GUTTER}px !important;
    position: relative;
  }
`;

/**
 * Index ↔ checkbox hover swap CSS. Both `.nb-table-index` and the antd
 * checkbox (wrapped in `.nb-origin-node`) are absolutely positioned and
 * centered inside `.nb-row-selection-cell`, so they share the same anchor
 * without one displacing the other. `display: none/flex` flips so they never
 * overlap mid-transition.
 */
export const indexSwapClassName = css`
  .ant-table-tbody > tr > td.ant-table-selection-column {
    .nb-row-selection-cell {
      position: relative;
      display: inline-block;
      min-width: 22px;
      min-height: 22px;
      vertical-align: middle;
    }
    .nb-row-selection-cell .nb-table-index,
    .nb-row-selection-cell .nb-origin-node {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nb-row-selection-cell .nb-origin-node {
      display: none;
    }
    .nb-row-selection-cell.checked .nb-table-index {
      display: none;
    }
    .nb-row-selection-cell.checked .nb-origin-node {
      display: flex;
    }
  }
  .ant-table-tbody > tr:hover > td.ant-table-selection-column {
    .nb-row-selection-cell .nb-table-index {
      display: none;
    }
    .nb-row-selection-cell .nb-origin-node {
      display: flex;
    }
  }
`;

/**
 * Self-contained styles for the drag-overlay clone. The runtime
 * `selectionGutterClassName` + `indexSwapClassName` are scoped to AntdTable's
 * emotion hash, so they don't reach the cloned `<tr>` injected via
 * `dangerouslySetInnerHTML`. This class replays the minimal subset that the
 * clone needs:
 *   - selection column gutter + `position: relative` so the absolute handle
 *     lands correctly
 *   - hide the row index inside the overlay (drag preview shouldn't carry
 *     a stale ordinal)
 *   - force the checkbox (`.nb-origin-node`) absolute-centered and visible
 *     regardless of hover/checked state, so the selection cell isn't empty
 */
export const overlayCellStylesClassName = css`
  .ant-table-cell.ant-table-selection-column {
    padding-left: ${SORT_HANDLE_GUTTER}px !important;
    position: relative;
  }
  .nb-table-index {
    display: none !important;
  }
  .nb-row-selection-cell {
    position: relative;
    display: inline-block;
    min-width: 22px;
    min-height: 22px;
    vertical-align: middle;
  }
  .nb-row-selection-cell .nb-origin-node {
    position: absolute;
    inset: 0;
    display: flex !important;
    align-items: center;
    justify-content: center;
  }
`;
