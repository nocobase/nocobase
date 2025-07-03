/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { DragMoveEvent } from '@dnd-kit/core';
import { uid } from '@formily/shared';
import {
  AddBlockButton,
  DndProvider,
  DragHandler,
  Droppable,
  EMPTY_COLUMN_UID,
  findModelUidPosition,
  FlowModel,
  FlowModelRenderer,
  FlowSettingsButton,
  getMousePositionOnElement,
  moveBlock,
  positionToDirection,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import { Grid } from '../../components/Grid';
import JsonEditor from '../../components/JsonEditor';
import { SkeletonFallback } from '../../components/SkeletonFallback';
import { BlockModel } from './BlockModel';

type GridModelStructure = {
  subModels: {
    items: BlockModel[];
  };
};

export class GridModel extends FlowModel<GridModelStructure> {
  subModelBaseClass = 'BlockModel';
  gridContainerRef = React.createRef<HTMLDivElement>();
  prevMoveDistance = 0;

  onInit(options: any): void {
    this.emitter.on('onSubModelAdded', (model: FlowModel) => {
      this.resetRows(true);

      // 在 sizes 中新加一行
      // 1. 获取当前 modelUid 所在的位置
      const position = findModelUidPosition(model.uid, this.props.rows || {});
      // 2. 根据位置，在 sizes 中添加一行
      if (position) {
        const newSizes = _.cloneDeep(this.props.sizes || {});
        newSizes[position.rowId] = [24]; // 默认新行宽度为 24
        this.setStepParams('defaultFlow', 'grid', {
          rows: this.props.rows || {},
          sizes: newSizes,
        });

        this.setProps('sizes', newSizes);
      }
    });
    this.emitter.on('onSubModelRemoved', (model: FlowModel) => {
      const modelUid = model.uid;

      // 1. 获取当前 modelUid 所在的位置
      const position = findModelUidPosition(modelUid, this.props.rows || {});

      // 2. 重置 rows
      this.resetRows(true);

      // 3. 根据位置清空 sizes 中对应的值
      if (position) {
        const rows = this.props.rows || {};
        const newSizes = _.cloneDeep(this.props.sizes || {});

        // 如果列变空了，移除该列
        if (rows[position.rowId]?.[position.columnIndex] === undefined) {
          newSizes[position.rowId]?.splice(position.columnIndex, 1);
        }

        // 如果行变空了，移除该行
        if (rows[position.rowId] === undefined) {
          delete newSizes[position.rowId];
        }

        this.setStepParams('defaultFlow', 'grid', {
          rows,
          sizes: newSizes,
        });

        this.setProps('sizes', newSizes);
      }
    });
    this.emitter.on('onSubModelMoved', () => {
      this.resetRows(true);
    });

    this.emitter.on('onResizeLeft', ({ resizeDistance, model }) => {
      const position = findModelUidPosition(model.uid, this.props.rows || {});
      const gridContainerWidth = this.gridContainerRef.current?.clientWidth || 0;
      const { newRows, newSizes, moveDistance } = recalculateGridSizes({
        position,
        direction: 'left',
        resizeDistance,
        prevMoveDistance: this.prevMoveDistance,
        oldRows: this.props.rows || {},
        oldSizes: this.props.sizes || {},
        gutter: this.ctx.globals.themeToken.marginBlock,
        gridContainerWidth,
      });
      this.prevMoveDistance = moveDistance;
      this.setProps('rows', newRows);
      this.setProps('sizes', newSizes);
    });
    this.emitter.on('onResizeRight', ({ resizeDistance, model }) => {
      const position = findModelUidPosition(model.uid, this.props.rows || {});
      const gridContainerWidth = this.gridContainerRef.current?.clientWidth || 0;
      const { newRows, newSizes, moveDistance } = recalculateGridSizes({
        position,
        direction: 'right',
        resizeDistance,
        prevMoveDistance: this.prevMoveDistance,
        oldRows: this.props.rows || {},
        oldSizes: this.props.sizes || {},
        gutter: this.ctx.globals.themeToken.marginBlock,
        gridContainerWidth,
      });
      this.prevMoveDistance = moveDistance;
      this.setProps('rows', newRows);
      this.setProps('sizes', newSizes);
    });
    this.emitter.on('onResizeBottom', ({ resizeDistance, model }) => {});
    this.emitter.on('onResizeEnd', () => {
      this.prevMoveDistance = 0;
      this.saveGridLayout();
    });
  }

  saveGridLayout() {
    this.setStepParams('defaultFlow', 'grid', {
      rows: this.props.rows || {},
      sizes: this.props.sizes || {},
    });
    this.save();
  }

  mergeRowsWithItems(rows: Record<string, string[][]>) {
    const items = this.subModels.items || [];
    console.log('mergeRowsWithItems', rows, items);
    if (!items || items.length === 0) {
      return {}; // 如果没有 items，直接返回原始 rows
    }
    // 1. 收集所有 items 里的 uid
    const allUids = new Set(items.map((item) => item.uid));
    allUids.add(EMPTY_COLUMN_UID); // 确保空白列的 UID 也被包含

    // 2. 收集 rows 里已用到的 uid
    const usedUids = new Set<string>();
    const newRows: Record<string, string[][]> = {};

    // 3. 过滤 rows 里不存在于 items 的 uid
    for (const [rowKey, cells] of Object.entries(rows)) {
      const filteredCells = cells
        .map((cell) => _.castArray(cell).filter((uid) => allUids.has(uid)))
        .filter((cell) => cell.length > 0);
      if (filteredCells.length > 0) {
        newRows[rowKey] = filteredCells;
        filteredCells.forEach((cell) => cell.forEach((uid) => usedUids.add(uid)));
      }
    }

    // 4. 只把不在 rows 里的 item.uid 作为新行加到 rows 后面
    const allRowUids = new Set<string>();
    Object.values(newRows).forEach((cells) => cells.forEach((cell) => cell.forEach((uid) => allRowUids.add(uid))));
    for (const item of items) {
      if (!allRowUids.has(item.uid)) {
        newRows[uid()] = [[item.uid]];
      }
    }

    return newRows;
  }

  resetRows(syncProps = false) {
    const params = this.getStepParams('defaultFlow', 'grid') || {};
    const mergedRows = this.mergeRowsWithItems(params.rows || {});
    this.setStepParams('defaultFlow', 'grid', {
      rows: mergedRows,
      sizes: params.sizes || {},
    });

    if (syncProps) {
      this.setProps('rows', mergedRows);
    }
  }

  handleDragMove(event: DragMoveEvent) {
    const active = event.active;
    const over = event.over;

    if (active?.id === over?.id) {
      return;
    }

    const position = getMousePositionOnElement({
      initialMousePos: {
        // @ts-ignore
        x: event.activatorEvent.x ?? 0,
        // @ts-ignore
        y: event.activatorEvent.y ?? 0,
      },
      mouseOffset: {
        x: event.delta.x,
        y: event.delta.y,
      },
      elementBounds: {
        x: over?.rect.left ?? 0,
        y: over?.rect.top ?? 0,
        width: over?.rect.width ?? 0,
        height: over?.rect.height ?? 0,
      },
    });

    const layoutData = {
      rows: this.props.rows || {},
      sizes: this.props.sizes || {},
    };

    const result = moveBlock({
      sourceUid: active?.id as string,
      targetUid: over?.id as string,
      direction: positionToDirection(position),
      layoutData,
    });

    if (JSON.stringify(layoutData) !== JSON.stringify(result)) {
      this.setProps('rows', result.rows);
      this.setProps('sizes', result.sizes);
    }
  }

  handleDragEnd(event: any) {
    this.saveGridLayout();
  }

  render() {
    const t = this.translate;
    return (
      <div style={{ padding: this.ctx.globals.themeToken.marginBlock }}>
        <Space
          ref={this.gridContainerRef}
          direction={'vertical'}
          style={{ width: '100%' }}
          size={this.ctx.globals.themeToken.marginBlock}
        >
          {this.subModels.items?.length > 0 && (
            <DndProvider onDragMove={this.handleDragMove.bind(this)} onDragEnd={this.handleDragEnd.bind(this)}>
              <Grid
                rows={this.props.rows || {}}
                sizes={this.props.sizes || {}}
                renderItem={(uid) => {
                  const item = this.flowEngine.getModel(uid);
                  return (
                    <Droppable model={item}>
                      <FlowModelRenderer
                        model={item}
                        key={item.uid}
                        fallback={<SkeletonFallback />}
                        showFlowSettings={{ showBackground: false, showDragHandle: true }}
                        showErrorFallback
                        showTitle
                        extraToolbarItems={[
                          {
                            key: 'drag-handler',
                            component: DragHandler,
                            sort: 1,
                          },
                        ]}
                      />
                    </Droppable>
                  );
                }}
              />
            </DndProvider>
          )}
          <Space>
            <AddBlockButton model={this} subModelKey="items" subModelBaseClass={this.subModelBaseClass}>
              <FlowSettingsButton icon={<PlusOutlined />}>{t('Add block')}</FlowSettingsButton>
            </AddBlockButton>
            <FlowSettingsButton
              onClick={() => {
                this.openStepSettingsDialog('defaultFlow', 'grid');
              }}
            >
              {t('Configure rows')}
            </FlowSettingsButton>
          </Space>
        </Space>
      </div>
    );
  }
}

GridModel.registerFlow({
  key: 'defaultFlow',
  auto: true,
  steps: {
    step1: {
      handler(ctx) {
        ctx.model.resetRows();
      },
    },
    grid: {
      uiSchema: {
        rows: {
          title: tval('Rows'),
          'x-decorator': 'FormItem',
          'x-component': JsonEditor,
          'x-component-props': {
            autoSize: { minRows: 10, maxRows: 20 },
            description: tval('Configure the rows and columns of the grid.'),
          },
        },
        sizes: {
          title: tval('Sizes'),
          'x-decorator': 'FormItem',
          'x-component': JsonEditor,
          'x-component-props': {
            rows: 5,
          },
          description: tval(
            'Configure the sizes of each row. The value is an array of numbers representing the width of each column in the row.',
          ),
        },
      },
      async handler(ctx, params) {
        const mergedRows = ctx.model.mergeRowsWithItems(params.rows || {});
        ctx.model.setProps('rows', mergedRows);
        ctx.model.setProps('sizes', params.sizes || {});
      },
    },
  },
});

export class BlockGridModel extends GridModel {
  subModelBaseClass = 'BlockModel';
}

function recalculateGridSizes({
  position,
  direction,
  resizeDistance,
  prevMoveDistance,
  oldSizes,
  oldRows,
  gridContainerWidth,
  gutter = 16,
  columnCount = 24,
}: {
  position: {
    rowId: string;
    columnIndex: number;
    itemIndex: number;
  };
  direction: 'left' | 'right' | 'bottom' | 'corner';
  resizeDistance: number;
  prevMoveDistance: number;
  oldSizes: Record<string, number[]>;
  oldRows: Record<string, string[][]>;
  gridContainerWidth: number;
  // 栅格间隔
  gutter?: number;
  // 栅格列数
  // 默认是 24 列
  columnCount?: number;
}) {
  const newRows = _.cloneDeep(oldRows);
  const newSizes = _.cloneDeep(oldSizes);
  const currentRowSizes = newSizes[position.rowId] || [];
  const totalGutter = gutter * (currentRowSizes.length - 1);

  // 当前移动的距离占总宽度的多少份
  const currentMoveDistance = Math.floor((resizeDistance / (gridContainerWidth - totalGutter)) * columnCount);

  if (currentMoveDistance === prevMoveDistance) {
    return { newRows, newSizes, moveDistance: currentMoveDistance };
  }

  if (newSizes[position.rowId] === undefined) {
    newSizes[position.rowId] = [columnCount];
  }

  newSizes[position.rowId][position.columnIndex] += currentMoveDistance - prevMoveDistance;

  if (direction === 'left' && position.columnIndex > 0) {
    // 如果是左侧拖动，左侧的列宽度需要相应的减少或增加
    newSizes[position.rowId][position.columnIndex - 1] -= currentMoveDistance - prevMoveDistance;

    // 如果左侧列的宽度为 0，且是一个空白列，则需要删除该列
    if (newSizes[position.rowId][position.columnIndex - 1] === 0) {
      removeEmptyColumnFromRow({
        rows: newRows,
        sizes: newSizes,
        position,
        direction: 'left',
      });
    }
  }

  // 如果最左侧的列宽度小于其初始的宽度，则需要添加一个空白列，用于显示空白
  if (direction === 'left' && position.columnIndex === 0) {
    const otherColumnSize = newSizes[position.rowId].slice(1).reduce((a, b) => a + b, 0);
    const currentColumnSize = newSizes[position.rowId][0];

    if (currentColumnSize < columnCount - otherColumnSize) {
      addEmptyColumnToRow({
        rows: newRows,
        sizes: newSizes,
        position,
        direction: 'left',
      });
    }
  }

  if (direction === 'right' && position.columnIndex < newSizes[position.rowId].length - 1) {
    // 如果是右侧拖动，右侧的列宽度需要相应的减少或增加
    newSizes[position.rowId][position.columnIndex + 1] -= currentMoveDistance - prevMoveDistance;

    // 如果右侧列的宽度为 0，且是一个空白列，则需要删除该列
    if (newSizes[position.rowId][position.columnIndex + 1] === 0) {
      removeEmptyColumnFromRow({
        rows: newRows,
        sizes: newSizes,
        position,
        direction: 'right',
      });
    }
  }

  // 如果最右侧的列宽度小于其初始的宽度，则需要添加一个空白列，用于显示空白
  if (direction === 'right' && position.columnIndex === newSizes[position.rowId].length - 1) {
    const otherColumnSize = newSizes[position.rowId].slice(0, -1).reduce((a, b) => a + b, 0);
    const currentColumnSize = newSizes[position.rowId][position.columnIndex];

    if (currentColumnSize < columnCount - otherColumnSize) {
      addEmptyColumnToRow({
        rows: newRows,
        sizes: newSizes,
        position,
        direction: 'right',
      });
    }
  }

  return { newRows, newSizes, moveDistance: currentMoveDistance };
}

// 新增一个空白列
function addEmptyColumnToRow({
  rows,
  sizes,
  position,
  direction,
}: {
  rows: Record<string, string[][]>;
  sizes: Record<string, number[]>;
  position: {
    rowId: string;
    columnIndex: number;
  };
  direction: 'left' | 'right';
}) {
  const currentRow = rows[position.rowId] || [];
  const currentRowSizes = sizes[position.rowId] || [];

  if (direction === 'left') {
    const leftColumn = currentRow[position.columnIndex - 1];
    if (leftColumn && leftColumn.includes(EMPTY_COLUMN_UID)) {
      // 如果左侧已经有空白列，则不再添加
      return;
    }
    currentRow.splice(position.columnIndex, 0, [EMPTY_COLUMN_UID]);
    currentRowSizes.splice(position.columnIndex, 0, 1);
  }

  if (direction === 'right') {
    const rightColumn = currentRow[position.columnIndex + 1];
    if (rightColumn && rightColumn.includes(EMPTY_COLUMN_UID)) {
      // 如果右侧已经有空白列，则不再添加
      return;
    }
    currentRow.splice(position.columnIndex + 1, 0, [EMPTY_COLUMN_UID]);
    currentRowSizes.splice(position.columnIndex + 1, 0, 1);
  }
}

// 删除一个空白列
function removeEmptyColumnFromRow({
  rows,
  sizes,
  position,
  direction,
}: {
  rows: Record<string, string[][]>;
  sizes: Record<string, number[]>;
  position: {
    rowId: string;
    columnIndex: number;
  };
  direction: 'left' | 'right';
}) {
  const currentRow = rows[position.rowId] || [];
  const currentRowSizes = sizes[position.rowId] || [];

  if (direction === 'left') {
    const leftColumn = currentRow[position.columnIndex - 1];
    if (!leftColumn || !leftColumn.includes(EMPTY_COLUMN_UID)) {
      // 如果左侧没有空白列，则不进行删除
      return;
    }
    currentRow.splice(position.columnIndex - 1, 1);
    currentRowSizes.splice(position.columnIndex - 1, 1);
  }

  if (direction === 'right') {
    const rightColumn = currentRow[position.columnIndex + 1];
    if (!rightColumn || !rightColumn.includes(EMPTY_COLUMN_UID)) {
      // 如果右侧没有空白列，则不进行删除
      return;
    }
    currentRow.splice(position.columnIndex + 1, 1);
    currentRowSizes.splice(position.columnIndex + 1, 1);
  }
}
