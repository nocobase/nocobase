/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cx } from '@emotion/css';
import { theme } from 'antd';
import React from 'react';
import { overlayCellStylesClassName } from './styles';
import type { RowSnapshot } from './utils';

/**
 * Floating clone of the row being dragged, rendered inside a `<DragOverlay>`
 * so it follows the cursor while the source row stays in place. We inject the
 * snapshot's `outerHTML` straight into a mini `<table>` so every antd class
 * (`ant-table-cell`, `ant-table-selection-column`, theme tokens, etc.) is
 * preserved. A `<colgroup>` re-applies the measured cell widths so the clone
 * lines up column-for-column with the source row; the wrapper's pinned
 * `height` + table `height:100%` keeps vertical sizing consistent regardless
 * of which antd table size variant the caller picked.
 *
 * The wrapper also carries `overlayCellStylesClassName` so the index numeric
 * (`.nb-table-index`) is hidden while dragging — only the handle + checkbox
 * are surfaced inside the floating clone.
 */
export function RowOverlayPreview(props: { snapshot: RowSnapshot }) {
  const { token } = theme.useToken();
  const { html, cellWidths, totalWidth, totalHeight } = props.snapshot;
  const colGroupHTML = cellWidths.map((width) => `<col style="width:${width}px" />`).join('');
  const tableHTML = `<table style="table-layout:fixed;width:100%;height:100%;border-collapse:collapse"><colgroup>${colGroupHTML}</colgroup><tbody class="ant-table-tbody">${html}</tbody></table>`;
  return (
    <div
      className={cx('ant-table-wrapper', overlayCellStylesClassName)}
      style={{
        width: totalWidth || 'auto',
        height: totalHeight || 'auto',
        background: token.colorBgContainer,
        boxShadow: token.boxShadowSecondary,
        borderRadius: token.borderRadius,
        pointerEvents: 'none',
        opacity: 0.95,
        overflow: 'hidden',
      }}
      dangerouslySetInnerHTML={{ __html: tableHTML }}
    />
  );
}
