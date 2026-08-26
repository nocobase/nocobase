/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cx } from '@emotion/css';
import React from 'react';
import { SORT_HANDLE_GUTTER } from './constants';
import { SortHandle } from './dnd/SortableRow';

export interface SelectionCellProps {
  /** Whether the row is currently selected — drives the index/checkbox swap. */
  checked: boolean;
  /** Zero-based row index (within the current page). `TableIndex` displays it as `index + 1`. */
  index: number;
  /** Render the drag handle on the left gutter. Mutually exclusive with `showStandaloneHandle`. */
  showHandle: boolean;
  /** Render the row index numeric. When `false` only the antd checkbox is shown (default antd UX). */
  showIndex: boolean;
  /** The original antd checkbox node produced by `rowSelection.renderCell`. */
  originalNode: React.ReactNode;
}

const handleSpanStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: SORT_HANDLE_GUTTER,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/**
 * The body half of the rowSelection column. Renders, in order:
 *   1. An absolute-positioned drag handle pinned to the left gutter (only
 *      when `showHandle` is true). The parent `<td>` must be
 *      `position: relative` for the handle to land inside the gutter —
 *      `selectionGutterClassName` in `styles.ts` adds that.
 *   2. A `.nb-row-selection-cell` wrapper that contains both the row index
 *      and the checkbox. CSS in `indexSwapClassName` swaps which one is
 *      visible depending on hover / `checked` state.
 *
 * When `showIndex` is false we drop the swap entirely and render only the
 * original antd checkbox — matches the default antd selection column UX for
 * tables that don't want the index numeric.
 */
export function SelectionCell(props: SelectionCellProps) {
  const { checked, index, showHandle, showIndex, originalNode } = props;
  return (
    <>
      {showHandle ? (
        <span style={handleSpanStyle}>
          <SortHandle />
        </span>
      ) : null}
      {showIndex ? (
        <span className={cx('nb-row-selection-cell', { checked })}>
          <span className="nb-table-index">{index + 1}</span>
          <span className="nb-origin-node">{originalNode}</span>
        </span>
      ) : (
        originalNode
      )}
    </>
  );
}
