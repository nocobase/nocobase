/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EMPTY_COLUMN_UID, GridLayoutPath, GridLayoutV2, normalizeGridLayout } from '@nocobase/flow-engine';
import { Col, Row } from 'antd';
import React from 'react';

interface DragOverlayRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly type: 'column' | 'column-edge' | 'row-gap' | 'empty-row' | 'empty-column' | 'item-edge';
}

interface GridProps {
  readonly rows?: Record<string, string[][]>;
  readonly sizes?: Record<string, number[]>;
  readonly layout?: GridLayoutV2;
  readonly renderItem: (uid: string) => React.ReactNode;
  readonly rowGap?: number;
  readonly colGap?: number;
  readonly dragOverlayRect?: DragOverlayRect | null;
}

export function Grid({
  rows = {},
  sizes = {},
  layout,
  renderItem,
  rowGap = 16,
  colGap = 16,
  dragOverlayRect,
}: GridProps) {
  const normalizedLayout = layout || normalizeGridLayout({ rows, sizes });
  if (!normalizedLayout.rows.length) {
    return (
      <div style={{ position: 'relative' }} data-grid-root data-grid-empty-container>
        {dragOverlayRect && <GridDragOverlay rect={dragOverlayRect} />}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: rowGap }} data-grid-root>
      {dragOverlayRect && <GridDragOverlay rect={dragOverlayRect} />}
      <GridRows rows={normalizedLayout.rows} renderItem={renderItem} rowGap={rowGap} colGap={colGap} parentPath={[]} />
    </div>
  );
}

interface GridRowsProps {
  readonly rows: GridLayoutV2['rows'];
  readonly renderItem: (uid: string) => React.ReactNode;
  readonly rowGap: number;
  readonly colGap: number;
  readonly parentPath: GridLayoutPath;
}

function GridRows({ rows, renderItem, rowGap, colGap, parentPath }: GridRowsProps) {
  return (
    <>
      {rows.map((row) => {
        const colCount = row.cells.length;
        const rowSizes = row.sizes || [];
        const hasAnySize = rowSizes.some((v) => v != null && v !== undefined);
        const rowPath = [...parentPath, { rowId: row.id }];

        const spans = row.cells.map((_, cellIdx) => {
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
          <Row key={row.id} gutter={colGap} data-grid-row-id={row.id} data-grid-path={JSON.stringify(rowPath)}>
            {row.cells.map((cell, cellIdx) => (
              <GridColumn
                key={cell.id}
                rowKey={row.id}
                columnIndex={cellIdx}
                span={spans[cellIdx]}
                rowGap={rowGap}
                colGap={colGap}
                cell={cell}
                path={[...rowPath.slice(0, -1), { rowId: row.id, cellId: cell.id }]}
                renderItem={renderItem}
              />
            ))}
          </Row>
        );
      })}
    </>
  );
}

interface GridColumnProps {
  readonly rowKey: string;
  readonly columnIndex: number;
  readonly span: number;
  readonly rowGap: number;
  readonly colGap: number;
  readonly cell: GridLayoutV2['rows'][number]['cells'][number];
  readonly path: GridLayoutPath;
  readonly renderItem: (uid: string) => React.ReactNode;
}

const GridColumn = React.memo(function GridColumn({
  rowKey,
  columnIndex,
  span,
  rowGap,
  colGap,
  cell,
  path,
  renderItem,
}: GridColumnProps) {
  const items = cell.items || [];
  return (
    <Col
      span={span}
      data-grid-column-row-id={rowKey}
      data-grid-column-index={columnIndex}
      data-grid-path={JSON.stringify(path)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: rowGap }}>
        {items.map((uid, itemIdx) => {
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
              data-grid-path={JSON.stringify(path)}
            >
              {renderItem(uid)}
            </div>
          );
        })}
        {cell.rows?.length ? (
          <GridRows rows={cell.rows} renderItem={renderItem} rowGap={rowGap} colGap={colGap} parentPath={path} />
        ) : null}
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
    'item-edge': {
      border: '2px solid var(--colorPrimary)',
      backgroundColor: 'rgba(22, 119, 255, 0.12)',
    },
  };

  return <div style={{ ...baseStyle, ...typeStyles[rect.type] }} />;
}
