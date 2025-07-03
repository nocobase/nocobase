/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import _ from 'lodash';
import { ElementPosition } from './getMousePositionOnElement';

type MoveDirection =
  | 'insert-row-above'
  | 'insert-row-below'
  | 'insert-same-column-above'
  | 'insert-same-column-below'
  | 'insert-column-left'
  | 'insert-column-right';

interface GridLayoutData {
  rows: Record<string, string[][]>;
  sizes: Record<string, number[]>;
}

export const findModelUidPosition = (uid: string, rows: Record<string, string[][]>) => {
  // 找到 sourceUid 和 targetUid 的位置
  let result: { rowId: string; columnIndex: number; itemIndex: number } | null = null;

  for (const [rowId, columns] of Object.entries(rows)) {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const column = columns[columnIndex];
      for (let itemIndex = 0; itemIndex < column.length; itemIndex++) {
        if (column[itemIndex] === uid) {
          result = { rowId, columnIndex, itemIndex };
        }
      }
    }
  }

  return result;
};

export const moveBlock = ({
  sourceUid,
  targetUid,
  direction,
  layoutData,
}: {
  sourceUid: string;
  targetUid: string;
  direction: MoveDirection;
  layoutData: GridLayoutData;
}): GridLayoutData => {
  const { rows, sizes } = layoutData;
  const newSizes = _.cloneDeep(sizes);
  let newRows = _.cloneDeep(rows);

  // 找到 sourceUid 和 targetUid 的位置
  let sourcePosition: { rowId: string; columnIndex: number; itemIndex: number } | null = null;
  let targetPosition: { rowId: string; columnIndex: number; itemIndex: number } | null = null;

  for (const [rowId, columns] of Object.entries(newRows)) {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const column = columns[columnIndex];
      for (let itemIndex = 0; itemIndex < column.length; itemIndex++) {
        if (column[itemIndex] === sourceUid) {
          sourcePosition = { rowId, columnIndex, itemIndex };
        }
        if (column[itemIndex] === targetUid) {
          targetPosition = { rowId, columnIndex, itemIndex };
        }
      }
    }
  }

  if (!sourcePosition || !targetPosition) {
    return layoutData; // 如果没有找到 sourceUid 或 targetUid，直接返回原数据
  }

  const removeOldSourceUid = () => {
    // 从原位置移除 sourceUid
    newRows[sourcePosition.rowId][sourcePosition.columnIndex].splice(sourcePosition.itemIndex, 1);

    // 如果列变空了，移除该列
    if (newRows[sourcePosition.rowId][sourcePosition.columnIndex].length === 0) {
      newRows[sourcePosition.rowId]?.splice(sourcePosition.columnIndex, 1);
      newSizes[sourcePosition.rowId]?.splice(sourcePosition.columnIndex, 1);
    }

    // 如果行变空了，移除该行
    if (newRows[sourcePosition.rowId].length === 0) {
      delete newRows[sourcePosition.rowId];
      delete newSizes[sourcePosition.rowId];
    }

    // 移除完之后，重新设置 sourcePosition 和 targetPosition
    for (const [rowId, columns] of Object.entries(newRows)) {
      for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
        const column = columns[columnIndex];
        for (let itemIndex = 0; itemIndex < column.length; itemIndex++) {
          if (column[itemIndex] === sourceUid) {
            sourcePosition = { rowId, columnIndex, itemIndex };
          }
          if (column[itemIndex] === targetUid) {
            targetPosition = { rowId, columnIndex, itemIndex };
          }
        }
      }
    }
  };

  switch (direction) {
    case 'insert-row-above': {
      // 检查 targetUid 上面是否有其他同列的 uid
      if (targetPosition.itemIndex > 0) {
        return layoutData; // 无效操作，直接返回原数据
      }

      removeOldSourceUid();

      // 创建新行 ID
      const newRowId = uid();

      // 插入到目标行前面
      newRows = insertKey({
        obj: newRows,
        newKey: newRowId,
        newValue: [[sourceUid]],
        referenceKey: targetPosition.rowId,
        position: 'before',
      });
      newSizes[newRowId] = [24];
      break;
    }

    case 'insert-row-below': {
      // 检查 targetUid 所在行的后面是否有同名的 sourceUid
      const nextRowKey = getNextKey(newRows, targetPosition.rowId);

      if (nextRowKey === sourcePosition.rowId && newRows[nextRowKey].length === 1) {
        return layoutData; // 无效操作，直接返回原数据
      }

      removeOldSourceUid();

      // 创建新行ID
      const newRowId = uid();

      // 插入到目标行后面
      newRows = insertKey({
        obj: newRows,
        newKey: newRowId,
        newValue: [[sourceUid]],
        referenceKey: targetPosition.rowId,
        position: 'after',
      });
      newSizes[newRowId] = [24];
      break;
    }

    case 'insert-same-column-above': {
      removeOldSourceUid();

      const column = newRows[targetPosition.rowId][targetPosition.columnIndex];
      if (column[targetPosition.itemIndex - 1] === sourceUid) {
        return layoutData; // 无效操作，直接返回原数据
      }
      column.splice(targetPosition.itemIndex, 0, sourceUid);
      break;
    }

    case 'insert-same-column-below': {
      removeOldSourceUid();

      const column = newRows[targetPosition.rowId][targetPosition.columnIndex];
      if (column[targetPosition.itemIndex + 1] === sourceUid) {
        return layoutData; // 无效操作，直接返回原数据
      }
      column.splice(targetPosition.itemIndex + 1, 0, sourceUid);
      break;
    }

    case 'insert-column-left': {
      removeOldSourceUid();

      // 在目标列左侧插入新列
      newRows[targetPosition.rowId].splice(targetPosition.columnIndex, 0, [sourceUid]);

      // 重新计算列宽
      const currentSizes = newSizes[targetPosition.rowId] || [];
      const columnCount = newRows[targetPosition.rowId].length || 0;
      const newColumnWidth = Math.floor(24 / columnCount);
      const remainingWidth = 24 - newColumnWidth;

      // 按原比例分配剩余宽度
      const totalOldWidth = currentSizes.reduce((sum, size) => sum + size, 0);
      const adjustedSizes = currentSizes.map((size) => Math.floor((size / totalOldWidth) * remainingWidth));

      // 插入新列宽度
      adjustedSizes.splice(targetPosition.columnIndex, 0, newColumnWidth);

      // 处理舍入误差
      const totalNewWidth = adjustedSizes.reduce((sum, size) => sum + size, 0);
      if (totalNewWidth < 24) {
        adjustedSizes[adjustedSizes.length - 1] += 24 - totalNewWidth;
      }

      newSizes[targetPosition.rowId] = adjustedSizes;
      break;
    }

    case 'insert-column-right': {
      removeOldSourceUid();

      // 在目标列右侧插入新列
      newRows[targetPosition.rowId].splice(targetPosition.columnIndex + 1, 0, [sourceUid]);

      // 重新计算列宽
      const currentSizes = newSizes[targetPosition.rowId] || [];
      const columnCount = newRows[targetPosition.rowId]?.length || 0;
      const newColumnWidth = Math.floor(24 / columnCount);
      const remainingWidth = 24 - newColumnWidth;

      // 按原比例分配剩余宽度
      const totalOldWidth = currentSizes.reduce((sum, size) => sum + size, 0);
      const adjustedSizes = currentSizes.map((size) => Math.floor((size / totalOldWidth) * remainingWidth));

      // 插入新列宽度
      adjustedSizes.splice(targetPosition.columnIndex + 1, 0, newColumnWidth);

      // 处理舍入误差
      const totalNewWidth = adjustedSizes.reduce((sum, size) => sum + size, 0);
      if (totalNewWidth < 24) {
        adjustedSizes[adjustedSizes.length - 1] += 24 - totalNewWidth;
      }

      newSizes[targetPosition.rowId] = adjustedSizes;
      break;
    }
  }

  return recalculateAllRowSizesWithProportion({ rows: newRows, sizes: newSizes });
};

/**
 * 将鼠标在元素上的位置转换为区块移动方向
 *
 * @param position 鼠标在元素上的位置
 * @returns 对应的移动方向
 */
export const positionToDirection = (position: ElementPosition): MoveDirection => {
  switch (position) {
    case ElementPosition.TOP:
      return 'insert-same-column-above';
    case ElementPosition.BOTTOM:
      return 'insert-same-column-below';
    case ElementPosition.LEFT:
      return 'insert-column-left';
    case ElementPosition.RIGHT:
      return 'insert-column-right';
    case ElementPosition.TOP_EDGE:
      return 'insert-row-above';
    case ElementPosition.BOTTOM_EDGE:
      return 'insert-row-below';
    case ElementPosition.LEFT_EDGE:
      return 'insert-column-left';
    case ElementPosition.RIGHT_EDGE:
      return 'insert-column-right';
    default:
      throw new Error(`Unsupported position: ${position}`);
  }
};

function insertKey({
  obj,
  newKey,
  newValue,
  referenceKey,
  position,
}: {
  obj: Record<string, any>;
  newKey: string;
  newValue: any;
  referenceKey: string;
  position: 'before' | 'after';
}) {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (position === 'before' && key === referenceKey) {
      result[newKey] = newValue;
    }

    result[key] = value;

    if (position === 'after' && key === referenceKey) {
      result[newKey] = newValue;
    }
  }

  return result;
}

function getNextKey(obj: Record<string, any>, currentKey: string): string | null {
  const keys = Object.keys(obj);
  const index = keys.indexOf(currentKey);
  return index >= 0 && index < keys.length - 1 ? keys[index + 1] : null;
}

/**
 * 重新计算所有行的列宽，保持原有比例的同时确保总宽度为24
 * @param layoutData 当前的布局数据
 * @returns 更新后的布局数据
 */
function recalculateAllRowSizesWithProportion(layoutData: GridLayoutData): GridLayoutData {
  const { rows, sizes } = layoutData;
  const newSizes = _.cloneDeep(sizes);

  for (const [rowId, columns] of Object.entries(rows)) {
    const columnCount = columns.length;
    const currentSizes = sizes[rowId] || [];

    if (columnCount === 0) {
      continue;
    }

    // 如果当前没有尺寸信息或尺寸数量不匹配，使用均等分配
    if (currentSizes.length !== columnCount || currentSizes.every((size) => size === 0)) {
      const baseWidth = Math.floor(24 / columnCount);
      const remainder = 24 % columnCount;
      const newRowSizes = new Array(columnCount).fill(baseWidth);

      for (let i = 0; i < remainder; i++) {
        newRowSizes[i] += 1;
      }

      newSizes[rowId] = newRowSizes;
      continue;
    }

    // 计算当前总宽度
    const currentTotal = currentSizes.reduce((sum, size) => sum + size, 0);

    if (currentTotal === 0) {
      // 如果当前总宽度为0，使用均等分配
      const baseWidth = Math.floor(24 / columnCount);
      const remainder = 24 % columnCount;
      const newRowSizes = new Array(columnCount).fill(baseWidth);

      for (let i = 0; i < remainder; i++) {
        newRowSizes[i] += 1;
      }

      newSizes[rowId] = newRowSizes;
    } else {
      // 按比例重新分配
      const newRowSizes = currentSizes.map((size) => Math.floor((size / currentTotal) * 24));

      // 处理舍入误差
      const actualTotal = newRowSizes.reduce((sum, size) => sum + size, 0);
      const diff = 24 - actualTotal;

      // 将差值分配给最后几列
      for (let i = newRowSizes.length - 1; i >= 0 && diff > 0; i--) {
        const add = Math.min(diff, 1);
        newRowSizes[i] += add;
      }

      newSizes[rowId] = newRowSizes;
    }
  }

  return {
    rows,
    sizes: newSizes,
  };
}
