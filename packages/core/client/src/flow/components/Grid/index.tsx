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
import React from 'react';

interface DragOverlayRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly type: 'column' | 'column-edge' | 'row-gap' | 'empty-row' | 'empty-column';
}

interface GridProps {
  readonly rows: string[][][];
  readonly sizes?: number[][];
  readonly renderItem: (uid: string) => React.ReactNode;
  readonly rowGap?: number;
  readonly colGap?: number;
  readonly dragOverlayRect?: DragOverlayRect | null;
}

export function Grid({ rows, sizes = [], renderItem, rowGap = 16, colGap = 16, dragOverlayRect }: GridProps) {
  if (!rows?.length) {
    return (
      <div style={{ position: 'relative' }} data-grid-empty-container>
        {dragOverlayRect && <GridDragOverlay rect={dragOverlayRect} />}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: rowGap }}>
      {dragOverlayRect && <GridDragOverlay rect={dragOverlayRect} />}
      {rows.map((cells, rowIndex) => {
        const colCount = cells.length;
        const rowSizes = sizes[rowIndex] || [];
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
          <Row key={rowIndex} gutter={colGap} data-grid-row-id={rowIndex}>
            {cells.map((cell, cellIdx) => (
              <GridColumn
                key={`${rowIndex}:${cell.join('|') || 'empty'}`}
                rowKey={rowIndex}
                columnIndex={cellIdx}
                span={spans[cellIdx]}
                rowGap={rowGap}
                cell={cell}
                renderItem={renderItem}
              />
            ))}
          </Row>
        );
      })}
    </div>
  );
}

interface GridColumnProps {
  readonly rowKey: number;
  readonly columnIndex: number;
  readonly span: number;
  readonly rowGap: number;
  readonly cell: readonly string[];
  readonly renderItem: (uid: string) => React.ReactNode;
}

const GridColumn = React.memo(function GridColumn({
  rowKey,
  columnIndex,
  span,
  rowGap,
  cell,
  renderItem,
}: GridColumnProps) {
  return (
    <Col span={span} data-grid-column-row-id={rowKey} data-grid-column-index={columnIndex}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: rowGap }}>
        {cell.map((uid, itemIdx) => {
          if (uid === EMPTY_COLUMN_UID) {
            return null;
          }
          return (
            <div
              key={uid}
              data-grid-item-row-id={rowKey}
              data-grid-column-index={columnIndex}
              data-grid-item-index={itemIdx}
              data-grid-item-uid={uid}
            >
              {renderItem(uid)}
            </div>
          );
        })}
      </div>
    </Col>
  );
});
GridColumn.displayName = 'GridColumn';
function GridDragOverlay({ rect }: Readonly<{ rect: DragOverlayRect }>) {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    borderRadius: 6,
    pointerEvents: 'none',
    transition: 'all 60ms ease-out',
    zIndex: 100,
  };

  const typeStyles: Record<DragOverlayRect['type'], React.CSSProperties> = {
    column: {
      border: '2px dashed var(--colorPrimary)',
      backgroundColor: 'rgba(22, 119, 255, 0.08)',
    },
    'column-edge': {
      border: '2px solid var(--colorPrimary)',
      backgroundColor: 'rgba(22, 119, 255, 0.12)',
    },
    'row-gap': {
      border: '2px dashed var(--colorPrimary)',
      backgroundColor: 'rgba(22, 119, 255, 0.05)',
    },
    'empty-row': {
      border: '2px dashed var(--colorPrimary)',
      backgroundColor: 'rgba(22, 119, 255, 0.04)',
    },
    'empty-column': {
      border: '2px dashed var(--colorPrimary)',
      backgroundColor: 'rgba(22, 119, 255, 0.04)',
    },
  };

  return <div style={{ ...baseStyle, ...typeStyles[rect.type] }} />;
}
