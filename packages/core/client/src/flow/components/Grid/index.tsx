/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EMPTY_COLUMN_UID, GridLayoutPath, GridLayoutV2, normalizeGridLayout } from '@nocobase/flow-engine';
import { Col, Row, theme } from 'antd';
import React from 'react';

interface DragOverlayRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly type: 'column' | 'column-edge' | 'row-gap' | 'empty-row' | 'empty-column' | 'item-edge';
}

export interface DragPreviewOverlayState {
  readonly row?: Omit<DragOverlayRect, 'type'>;
  readonly column?: Omit<DragOverlayRect, 'type'>;
}

export interface ResizePreviewOverlayState {
  readonly row: Omit<DragOverlayRect, 'type'>;
  readonly currentCell: Omit<DragOverlayRect, 'type'>;
  readonly affectedCell?: Omit<DragOverlayRect, 'type'>;
  readonly cells?: ReadonlyArray<{
    readonly rect: Omit<DragOverlayRect, 'type'>;
    readonly role: 'current' | 'affected' | 'peer' | 'empty';
    readonly size?: number;
  }>;
  readonly guideLine: Omit<DragOverlayRect, 'type'>;
  readonly direction: 'left' | 'right';
  readonly currentSize?: number;
  readonly affectedSize?: number;
  readonly columnCount?: number;
  readonly rowIndex?: number;
}

interface GridProps {
  readonly rows?: Record<string, string[][]>;
  readonly sizes?: Record<string, number[]>;
  readonly layout?: GridLayoutV2;
  readonly renderItem: (uid: string) => React.ReactNode;
  readonly rowGap?: number;
  readonly colGap?: number;
  readonly dragOverlayRect?: DragOverlayRect | null;
  readonly dragPreviewOverlay?: DragPreviewOverlayState | null;
  readonly resizePreviewOverlay?: ResizePreviewOverlayState | null;
  readonly emptyColumnLabel?: string;
}

export function Grid({
  rows = {},
  sizes = {},
  layout,
  renderItem,
  rowGap = 16,
  colGap = 16,
  dragOverlayRect,
  dragPreviewOverlay,
  resizePreviewOverlay,
  emptyColumnLabel = 'Blank column',
}: GridProps) {
  const normalizedLayout = layout || normalizeGridLayout({ rows, sizes });
  if (!normalizedLayout.rows.length) {
    return (
      <div style={{ position: 'relative', isolation: 'isolate' }} data-grid-root data-grid-empty-container>
        {resizePreviewOverlay && (
          <GridResizePreviewOverlay preview={resizePreviewOverlay} emptyColumnLabel={emptyColumnLabel} />
        )}
        {dragPreviewOverlay && <GridDragPreviewOverlay preview={dragPreviewOverlay} />}
        {dragOverlayRect && <GridDragOverlay rect={dragOverlayRect} />}
      </div>
    );
  }

  return (
    <div
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: rowGap, isolation: 'isolate' }}
      data-grid-root
    >
      {resizePreviewOverlay && (
        <GridResizePreviewOverlay preview={resizePreviewOverlay} emptyColumnLabel={emptyColumnLabel} />
      )}
      {dragPreviewOverlay && <GridDragPreviewOverlay preview={dragPreviewOverlay} />}
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
          <Row
            key={row.id}
            gutter={colGap}
            style={{ position: 'relative', zIndex: 2 }}
            data-grid-row-id={row.id}
            data-grid-path={JSON.stringify(rowPath)}
          >
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

function GridDragPreviewOverlay({ preview }: Readonly<{ preview: DragPreviewOverlayState }>) {
  const { token } = theme.useToken();
  const rowRect = preview.row
    ? {
        top: preview.row.top - 6,
        left: preview.row.left - 6,
        width: preview.row.width + 12,
        height: preview.row.height + 12,
      }
    : undefined;

  return (
    <>
      {rowRect ? (
        <div
          style={{
            ...rowRect,
            position: 'absolute',
            pointerEvents: 'none',
            background: `linear-gradient(180deg, ${token.colorPrimaryBg}cc 0%, ${token.colorPrimaryBg}88 100%)`,
            border: `1px solid ${token.colorPrimaryBorderHover}`,
            borderRadius: 12,
            boxShadow: `0 0 0 2px ${token.colorBgContainer}, 0 10px 28px ${token.colorPrimaryBg}`,
            opacity: 0.88,
            zIndex: 0,
          }}
        />
      ) : null}
      {preview.column ? (
        <div
          style={{
            ...preview.column,
            position: 'absolute',
            pointerEvents: 'none',
            backgroundColor: `${token.colorPrimaryBg}99`,
            border: `1px dashed ${token.colorPrimaryBorderHover}`,
            borderRadius: 10,
            boxSizing: 'border-box',
            zIndex: 1,
          }}
        />
      ) : null}
    </>
  );
}

function GridResizePreviewOverlay({
  preview,
  emptyColumnLabel,
}: Readonly<{ preview: ResizePreviewOverlayState; emptyColumnLabel: string }>) {
  const { token } = theme.useToken();
  const palette = { bg: '#E6F0FF', border: '#2F80ED' };
  const cells = preview.cells?.length
    ? preview.cells
    : [
        { rect: preview.currentCell, role: 'current' as const, size: preview.currentSize },
        ...(preview.affectedCell
          ? [{ rect: preview.affectedCell, role: 'affected' as const, size: preview.affectedSize }]
          : []),
      ];
  const emptyCells = cells.filter((cell) => cell.role === 'empty');
  const shouldShowGuideLine = emptyCells.length > 0 || Boolean(preview.affectedCell);
  const expandedRow = {
    top: preview.row.top - 6,
    left: preview.row.left - 6,
    width: preview.row.width + 12,
    height: preview.row.height + 12,
  };

  return (
    <>
      <div
        style={{
          ...expandedRow,
          position: 'absolute',
          pointerEvents: 'none',
          background: `linear-gradient(180deg, ${palette.bg}cc 0%, ${palette.bg}88 100%)`,
          border: `1px solid ${token.colorPrimaryBorderHover}`,
          borderRadius: 12,
          boxShadow: `0 0 0 2px ${token.colorBgContainer}, 0 10px 28px ${palette.bg}`,
          opacity: 0.88,
          zIndex: 0,
        }}
      />
      {emptyCells.map((cell, index) => (
        <div
          key={`empty-${index}`}
          style={{
            ...cell.rect,
            position: 'absolute',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: palette.border,
            backgroundColor: `${palette.bg}66`,
            border: `1px dashed ${palette.border}`,
            borderRadius: 10,
            boxSizing: 'border-box',
            fontSize: 12,
            lineHeight: '18px',
            zIndex: 1,
          }}
        >
          {emptyColumnLabel}
        </div>
      ))}
      {shouldShowGuideLine ? (
        <>
          <div
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              top: expandedRow.top,
              left: preview.guideLine.left - 0.5,
              width: 1,
              height: expandedRow.height,
              backgroundColor: token.colorPrimaryBorderHover,
              borderRadius: 1,
              opacity: 0.9,
              zIndex: 3,
            }}
          />
          {[expandedRow.top, expandedRow.top + expandedRow.height].map((top) => (
            <div
              key={top}
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                top: top - 2,
                left: preview.guideLine.left - 2,
                width: 4,
                height: 4,
                backgroundColor: token.colorPrimaryBorderHover,
                borderRadius: 4,
                opacity: 0.9,
                zIndex: 3,
              }}
            />
          ))}
        </>
      ) : null}
    </>
  );
}

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
