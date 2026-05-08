/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import {
  AddSubModelButton,
  DragOverlayConfig,
  FlowSettingsButton,
  GridCellV2,
  GridLayoutData,
  GridLayoutV2,
  GridRowV2,
  normalizeGridLayout,
  observable,
  projectLayoutToLegacyRows,
} from '@nocobase/flow-engine';
import React from 'react';
import { CollectionBlockModel, GRID_FLOW_KEY, GRID_STEP, GridModel } from '../../base';
import { getAllDataModels } from '../filter-manager/utils';
import { FilterFormItemModel } from './FilterFormItemModel';

export class FilterFormGridModel extends GridModel {
  private fullLayoutBeforeCollapse?: GridLayoutV2;
  private normalizedItemUidsOverride?: string[];
  private readingFullLayoutForSettingsInteraction = false;
  itemSettingsMenuLevel = 2;
  itemFlowSettings = {
    showBackground: true,
    style: {
      top: -6,
      left: -6,
      right: -6,
      bottom: -6,
    },
  };
  dragOverlayConfig: DragOverlayConfig = {
    // 列内插入
    columnInsert: {
      before: { offsetTop: -6, height: 24 },
      after: { offsetTop: 3, height: 24 },
    },
    // 列边缘
    columnEdge: {
      left: { offsetLeft: -5, width: 24 },
      right: { offsetLeft: 8, width: 24 },
    },
    // 行间隙
    rowGap: {
      above: { offsetTop: -2, height: 24 },
      below: { offsetTop: -12, height: 24 },
    },
  };

  readonly loading = observable.ref(false);

  private getAssociationFilterTargetKey(field: any) {
    const filterTargetKey = field?.targetCollection?.filterTargetKey;

    if (Array.isArray(filterTargetKey)) {
      return filterTargetKey[0] || 'id';
    }

    return filterTargetKey || 'id';
  }

  private normalizeFilterFormLayout(
    source?: Partial<GridLayoutData>,
    options?: {
      useVisibleItemUids?: boolean;
    },
  ): GridLayoutV2 {
    const params = this.getStepParams(GRID_FLOW_KEY, GRID_STEP) || {};
    const useVisibleItemUids = options?.useVisibleItemUids !== false;

    return normalizeGridLayout({
      layout: source?.layout ?? this.props.layout ?? params.layout,
      rows: source?.rows ?? this.props.rows ?? params.rows,
      sizes: source?.sizes ?? this.props.sizes ?? params.sizes,
      rowOrder: source?.rowOrder ?? this.props.rowOrder ?? params.rowOrder,
      // 折叠态只保留当前可见字段，避免归一化时把被裁掉的字段重新补回布局。
      itemUids: useVisibleItemUids ? this.normalizedItemUidsOverride ?? this.getItemUids() : this.getItemUids(),
      gridUid: this.uid,
      logger: console,
    });
  }

  private normalizeStoredFullLayout(): GridLayoutV2 {
    const params = this.getStepParams(GRID_FLOW_KEY, GRID_STEP) || {};

    return normalizeGridLayout({
      layout: this.fullLayoutBeforeCollapse ?? params.layout ?? this.props.layout,
      rows: params.rows ?? this.props.rows,
      sizes: params.sizes ?? this.props.sizes,
      rowOrder: params.rowOrder ?? this.props.rowOrder,
      itemUids: this.getItemUids(),
      gridUid: this.uid,
      logger: console,
    });
  }

  protected override normalizeLayoutFromSource(source?: Partial<GridLayoutData>): GridLayoutV2 {
    // 只有运行时读取当前展示布局时才应用折叠态可见字段覆盖；
    // 带 source 的路径通常用于重算/持久化布局，必须始终基于完整字段集。
    if (!source && this.readingFullLayoutForSettingsInteraction) {
      return this.normalizeStoredFullLayout();
    }

    return this.normalizeFilterFormLayout(source, {
      useVisibleItemUids: !source && !this.readingFullLayoutForSettingsInteraction,
    });
  }

  getGridLayout(): GridLayoutV2 {
    if (this.context.flowSettingsEnabled && this.normalizedItemUidsOverride) {
      return this.normalizeStoredFullLayout();
    }

    return super.getGridLayout();
  }

  saveGridLayout(layout?: GridLayoutData | GridLayoutV2) {
    super.saveGridLayout(layout);

    if (this.context.flowSettingsEnabled && this.normalizedItemUidsOverride) {
      const params = this.getStepParams(GRID_FLOW_KEY, GRID_STEP) || {};
      this.fullLayoutBeforeCollapse = normalizeGridLayout({
        layout: params.layout ?? this.props.layout,
        rows: params.rows ?? this.props.rows,
        sizes: params.sizes ?? this.props.sizes,
        rowOrder: params.rowOrder ?? this.props.rowOrder,
        itemUids: this.getItemUids(),
        gridUid: this.uid,
        logger: console,
      });
    }
  }

  handleDragStart(event: Parameters<GridModel['handleDragStart']>[0]) {
    this.readingFullLayoutForSettingsInteraction = Boolean(
      this.context.flowSettingsEnabled && this.normalizedItemUidsOverride,
    );
    try {
      super.handleDragStart(event);
    } finally {
      this.readingFullLayoutForSettingsInteraction = false;
    }
  }

  private collectLayoutItemUids(rows: GridLayoutV2['rows']) {
    const itemUids = new Set<string>();

    const visitRows = (currentRows: GridLayoutV2['rows']) => {
      currentRows.forEach((row) => {
        row.cells.forEach((cell) => {
          cell.items?.forEach((uid) => {
            if (uid && this.flowEngine.getModel(uid)) {
              itemUids.add(uid);
            }
          });

          if (cell.rows?.length) {
            visitRows(cell.rows);
          }
        });
      });
    };

    visitRows(rows);

    return Array.from(itemUids);
  }

  private getCellVisibleRowCount(cell: GridCellV2): number {
    if (cell.rows?.length) {
      return cell.rows.reduce((count, row) => count + this.getRowVisibleRowCount(row), 0);
    }

    return cell.items?.length || 0;
  }

  private getRowVisibleRowCount(row: GridRowV2): number {
    return row.cells.reduce((count, cell) => Math.max(count, this.getCellVisibleRowCount(cell)), 0);
  }

  private limitCellByVisibleCount(cell: GridCellV2, visibleRows: number): GridCellV2 | null {
    if (visibleRows <= 0) {
      return null;
    }

    if (cell.rows?.length) {
      const rows = this.limitLayoutRowsByVisibleCount(cell.rows, visibleRows);
      return rows.length ? { id: cell.id, rows } : null;
    }

    if (cell.items) {
      const items = cell.items.slice(0, visibleRows);
      return items.length ? { id: cell.id, items } : null;
    }

    return null;
  }

  private limitRowByVisibleCount(row: GridRowV2, visibleRows: number): GridRowV2 | null {
    const cellsWithSizes = row.cells
      .map((cell, index) => {
        const limitedCell = this.limitCellByVisibleCount(cell, visibleRows);
        return limitedCell ? { cell: limitedCell, size: row.sizes?.[index] } : null;
      })
      .filter(Boolean) as { cell: GridCellV2; size?: number }[];

    if (!cellsWithSizes.length) {
      return null;
    }

    return {
      id: row.id,
      cells: cellsWithSizes.map((entry) => entry.cell),
      sizes: cellsWithSizes.map((entry) => entry.size ?? 1),
    };
  }

  private limitLayoutRowsByVisibleCount(rows: GridLayoutV2['rows'], visibleRows: number): GridLayoutV2['rows'] {
    const limitedRows: GridLayoutV2['rows'] = [];
    let remainingRows = visibleRows;

    rows.forEach((row) => {
      if (remainingRows <= 0) {
        return;
      }

      const rowHeight = this.getRowVisibleRowCount(row);
      const limitedRow = this.limitRowByVisibleCount(row, Math.min(rowHeight, remainingRows));
      if (limitedRow) {
        limitedRows.push(limitedRow);
        remainingRows -= Math.min(rowHeight, remainingRows);
      }
    });

    return limitedRows;
  }

  /**
   * 获取筛选表单当前“完整布局”。
   * 折叠态会临时裁剪 props.rows，因此这里优先选取行数更多的那份布局，
   * 避免拖拽排序或重新挂载后只拿到被裁剪过的运行时 rows。
   */
  private getFullLayout() {
    const params = this.getStepParams(GRID_FLOW_KEY, GRID_STEP) || {};
    const currentLayout = this.props.layout
      ? this.normalizeFilterFormLayout(undefined, { useVisibleItemUids: false })
      : undefined;
    const savedLayout = params.layout
      ? this.normalizeFilterFormLayout(params, { useVisibleItemUids: false })
      : undefined;
    const currentProjection = currentLayout
      ? projectLayoutToLegacyRows(currentLayout)
      : { rows: this.props.rows || {}, rowOrder: this.props.rowOrder };
    const savedProjection = savedLayout
      ? projectLayoutToLegacyRows(savedLayout)
      : { rows: params.rows || {}, rowOrder: params.rowOrder };
    const rawCurrentRows = currentProjection.rows as Record<string, string[][]>;
    const rawSavedRows = (savedProjection.rows || {}) as Record<string, string[][]>;
    const currentCount = Object.keys(rawCurrentRows).length;
    const savedCount = Object.keys(rawSavedRows).length;
    const getItemCount = (rows: Record<string, string[][]>) =>
      Object.values(rows).reduce(
        (count, cells) => count + cells.reduce((cellCount, cell) => cellCount + cell.length, 0),
        0,
      );
    const currentItemCount = getItemCount(rawCurrentRows);
    const savedItemCount = getItemCount(rawSavedRows);
    const useCurrentLayout =
      currentCount > savedCount || (currentCount === savedCount && currentItemCount >= savedItemCount);
    const sourceRows = this.mergeRowsWithItems(useCurrentLayout ? rawCurrentRows : rawSavedRows);
    const sourceRowOrder = useCurrentLayout
      ? currentProjection.rowOrder || this.props.rowOrder || params.rowOrder
      : savedProjection.rowOrder || params.rowOrder || this.props.rowOrder;

    return {
      ...this.normalizeRowsWithOrder(sourceRows, sourceRowOrder),
      layout: useCurrentLayout ? currentLayout : savedLayout,
    };
  }

  toggleFormFieldsCollapse(collapse: boolean, visibleRows: number) {
    const { rows: fullRows, rowOrder, layout } = this.getFullLayout();

    if (!collapse) {
      this.normalizedItemUidsOverride = undefined;
      const restoredLayout = this.fullLayoutBeforeCollapse || layout;
      if (restoredLayout) {
        this.syncLayoutProps(restoredLayout);
      } else {
        this.setProps('rows', fullRows);
        this.setProps('rowOrder', rowOrder);
      }
      this.fullLayoutBeforeCollapse = undefined;
      return;
    }

    if (!this.fullLayoutBeforeCollapse) {
      this.fullLayoutBeforeCollapse =
        layout ||
        normalizeGridLayout({
          rows: fullRows,
          rowOrder,
          itemUids: this.getItemUids(),
        });
    }

    const fullLayout =
      layout ||
      normalizeGridLayout({
        rows: fullRows,
        rowOrder,
        itemUids: this.getItemUids(),
      });
    const limitedLayout = normalizeGridLayout({
      layout: {
        version: 2,
        rows: this.limitLayoutRowsByVisibleCount(fullLayout.rows, visibleRows),
      },
    });

    this.normalizedItemUidsOverride = this.collectLayoutItemUids(limitedLayout.rows);
    this.syncLayoutProps(limitedLayout);
    this.setProps('rowOrder', rowOrder);
  }

  async onModelCreated(subModel: FilterFormItemModel) {
    if (!(subModel instanceof FilterFormItemModel)) {
      return;
    }

    const { fieldPath } = subModel.getFieldSettingsInitParams();
    const allDataModels = getAllDataModels(subModel.context.blockGridModel);

    // 1. 找到字段对应的区块 Model
    const matchingModels = allDataModels.filter((model: CollectionBlockModel) => {
      if (!model.resource?.supportsFilter) {
        return false;
      }

      return model.uid === subModel.defaultTargetUid;
    });

    // 2. 将找到的 Model 的 uid 添加到 subModel 的 targets 中，包括 fieldPath
    if (matchingModels.length > 0) {
      const targets = matchingModels.map((model: CollectionBlockModel) => {
        // model.collection 是普通区块，model.context.collection 是图表区块
        const collection = model.collection || model.context.collection;

        if (collection) {
          let field;
          if (fieldPath?.includes('.')) {
            const fullPath = `${collection.dataSourceKey}.${collection.name}.${fieldPath}`;
            field = model.context.dataSourceManager?.getCollectionField?.(fullPath);
          }
          if (!field) {
            field = collection.getField?.(fieldPath);
          }

          // 如果是关系字段，需要把 targetKey 拼上，不然筛选时会报错
          if (field?.target) {
            return {
              targetId: model.uid,
              filterPaths: [`${fieldPath}.${this.getAssociationFilterTargetKey(field)}`],
            };
          }
        }

        return {
          targetId: model.uid,
          filterPaths: [fieldPath],
        };
      });

      // 存到数据库中
      await this.context.filterManager.saveConnectFieldsConfig(subModel.uid, {
        targets,
      });
    }
  }

  renderAddSubModelButton() {
    if (this.loading.value) {
      return null;
    }

    // 向筛选表单区块添加字段 model
    return (
      <AddSubModelButton
        key={this.context.blockGridModel?.subModels?.items?.length}
        subModelKey="items"
        model={this}
        afterSubModelInit={this.onModelCreated.bind(this)}
        keepDropdownOpen
        subModelBaseClasses={['FilterFormItemModel', 'FilterFormCustomItemModel']}
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }
}

FilterFormGridModel.registerFlow({
  key: 'filterFormGridSettings',
  steps: {
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', 0);
        ctx.model.setProps('colGap', 16);
      },
    },
  },
});
