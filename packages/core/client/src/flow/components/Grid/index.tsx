/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import React from 'react';

export function Grid(props: {
  rows: Record<string, string[][]>;
  sizes?: Record<string, number[]>;
  renderItem: (uid: string) => React.ReactNode;
}) {
  const { rows, sizes = {}, renderItem } = props;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Object.entries(rows).map(([rowKey, cells]) => {
        const colCount = cells.length;
        const rowSizes = sizes[rowKey] || [];
        const hasAnySize = rowSizes.some((v) => v != null && v !== undefined);

        return (
          <div key={rowKey} style={{ display: 'flex', flexDirection: 'row', gap: 16 }}>
            {cells.map((cell, cellIdx) => {
              const style: React.CSSProperties = {};
              if (hasAnySize) {
                // 兼容部分有 size 部分没有 size 的情况
                const assigned = rowSizes.reduce((sum, v) => sum + (v || 0), 0);
                const unassignedCount = colCount - rowSizes.filter(Boolean).length;
                const autoSize = unassignedCount > 0 ? (24 - assigned) / unassignedCount : 0;
                const width = rowSizes[cellIdx] ?? autoSize;
                const totalGap = (colCount - 1) * 16;
                const availableWidth = `calc((100% - ${totalGap}px) * ${width / 24})`;
                style.flex = `0 0 ${availableWidth}`;
              } else {
                // 没有 sizes，等分
                const percent = 100 / colCount;
                style.flex = `0 0 calc((100% - ${(colCount - 1) * 16}px) * ${percent / 100})`;
              }
              return (
                <div key={cellIdx} style={style}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {cell.map((uid) => (
                      <div key={uid}>{renderItem(uid)}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
