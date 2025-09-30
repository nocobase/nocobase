/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EMPTY_COLUMN_UID } from '@nocobase/flow-engine';
import { Col, Row } from 'antd';
import _ from 'lodash';
import React from 'react';

export function Grid(props: {
  rows: Record<string, string[][]>;
  sizes?: Record<string, number[]>;
  renderItem: (uid: string) => React.ReactNode;
  rowGap?: number;
  colGap?: number;
}) {
  const { rows, sizes = {}, renderItem, rowGap = 16, colGap = 16 } = props;

  if (Object.keys(rows || {}).length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: rowGap }}>
      {Object.entries(rows).map(([rowKey, cells]) => {
        const colCount = cells.length;
        const rowSizes = sizes[rowKey] || [];
        const hasAnySize = rowSizes.some((v) => v != null && v !== undefined);

        // 计算每个 cell 的 span
        const spans = cells.map((_, cellIdx) => {
          if (hasAnySize) {
            const assigned = rowSizes.reduce((sum, v) => sum + (v || 0), 0);
            const unassignedCount = colCount - rowSizes.filter(Boolean).length;
            const autoSize = unassignedCount > 0 ? (24 - assigned) / unassignedCount : 0;
            return rowSizes[cellIdx] ?? autoSize;
          } else {
            return 24 / colCount;
          }
        });

        return (
          <Row key={rowKey} gutter={colGap}>
            {cells.map((cell, cellIdx) => (
              <Col key={cellIdx} span={spans[cellIdx]}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: rowGap }}>
                  {cell.map((uid) => {
                    if (uid === EMPTY_COLUMN_UID) {
                      return null;
                    }
                    return <React.Fragment key={uid}>{renderItem(uid)}</React.Fragment>;
                  })}
                </div>
              </Col>
            ))}
          </Row>
        );
      })}
    </div>
  );
}
