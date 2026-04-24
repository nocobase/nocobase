/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { AddSubModelButton, DragOverlayConfig, FlowSettingsButton, observable } from '@nocobase/flow-engine';
import React from 'react';
import { CollectionBlockModel, GRID_FLOW_KEY, GRID_STEP, GridModel } from '../../base';
import { getAllDataModels } from '../filter-manager/utils';
import { FilterFormItemModel } from './FilterFormItemModel';

export class FilterFormGridModel extends GridModel {
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
      before: { offsetTop: -12, height: 24 },
      after: { offsetTop: 7, height: 24 },
    },
    // 列边缘
    columnEdge: {
      left: { offsetLeft: -5, width: 24 },
      right: { offsetLeft: 8, width: 24 },
    },
    // 行间隙
    rowGap: {
      above: { offsetTop: 0, height: 24 },
      below: { offsetTop: -14, height: 24 },
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

  /**
   * 获取筛选表单当前“完整布局”。
   * 折叠态会临时裁剪 props.rows，因此这里优先选取行数更多的那份布局，
   * 避免拖拽排序或重新挂载后只拿到被裁剪过的运行时 rows。
   */
  private getFullLayout() {
    const params = this.getStepParams(GRID_FLOW_KEY, GRID_STEP) || {};
    const rawCurrentRows = (this.props.rows || {}) as Record<string, string[][]>;
    const rawSavedRows = (params.rows || {}) as Record<string, string[][]>;
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
      ? this.props.rowOrder || params.rowOrder
      : params.rowOrder || this.props.rowOrder;

    return this.normalizeRowsWithOrder(sourceRows, sourceRowOrder);
  }

  /**
   * 按“可视字段行数”裁剪布局，而不是只按 grid row 数裁剪。
   * 这样即使拖拽后多个字段被排进同一个 cell，也仍然可以正确折叠。
   */
  private limitRowsByVisibleCount(
    rows: Record<string, string[][]>,
    rowOrder: string[],
    visibleRows: number,
  ): Record<string, string[][]> {
    const limitedRows: Record<string, string[][]> = {};
    let remainingRows = visibleRows;

    rowOrder.forEach((rowKey) => {
      if (remainingRows <= 0 || !rows[rowKey]) {
        return;
      }

      const cells = rows[rowKey];
      const rowHeight = cells.reduce((max, cell) => Math.max(max, cell.length), 0);
      const visibleCount = Math.min(rowHeight, remainingRows);
      const nextCells = cells.map((cell) => cell.slice(0, visibleCount));

      if (nextCells.some((cell) => cell.length > 0)) {
        limitedRows[rowKey] = nextCells;
        remainingRows -= visibleCount;
      }
    });

    return limitedRows;
  }

  toggleFormFieldsCollapse(collapse: boolean, visibleRows: number) {
    const { rows: fullRows, rowOrder } = this.getFullLayout();

    if (!collapse) {
      this.setProps('rows', fullRows);
      this.setProps('rowOrder', rowOrder);
      return;
    }

    const limitedRows = this.limitRowsByVisibleCount(fullRows, rowOrder, visibleRows);

    this.setProps('rows', limitedRows);
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
