/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 定义位置枚举
export enum ElementPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  TOP_EDGE = 'top-edge',
  BOTTOM_EDGE = 'bottom-edge',
  LEFT_EDGE = 'left-edge',
  RIGHT_EDGE = 'right-edge',
}

interface MousePosition {
  x: number;
  y: number;
}

interface ElementBounds {
  x: number; // 左上角x坐标
  y: number; // 左上角y坐标
  width: number; // 元素宽度
  height: number; // 元素高度
}

interface GetMousePositionOptions {
  initialMousePos: MousePosition;
  mouseOffset: MousePosition;
  elementBounds: ElementBounds;
  edgeThreshold?: number; // 边缘区域厚度，默认为5px
  topBottomHeightRatio?: number; // 上下区域高度占比，默认为0.25（四分之一）
}

/**
 * 计算鼠标指针在元素上的位置
 *
 * 区域划分逻辑：
 * 1. 上区域：宽度=元素宽度，高度=元素高度*topBottomHeightRatio，位于元素顶部
 * 2. 下区域：宽度=元素宽度，高度=元素高度*topBottomHeightRatio，位于元素底部
 * 3. 左区域：剩余中间部分的左侧
 * 4. 右区域：剩余中间部分的右侧
 * 5. 边缘区域：在各个区域的边缘处，厚度为edgeThreshold
 *
 * @param options 配置选项
 * @returns 鼠标在元素上的位置
 */
export const getMousePositionOnElement = ({
  initialMousePos,
  mouseOffset,
  elementBounds,
  edgeThreshold = 5,
  topBottomHeightRatio = 0.25,
}: GetMousePositionOptions): ElementPosition => {
  // 计算当前鼠标的实际坐标
  const currentMouseX = initialMousePos.x + mouseOffset.x;
  const currentMouseY = initialMousePos.y + mouseOffset.y;

  // 计算鼠标相对于元素的坐标
  const relativeX = currentMouseX - elementBounds.x;
  const relativeY = currentMouseY - elementBounds.y;

  // 如果鼠标不在元素范围内，返回最接近的方向
  if (relativeX < 0 || relativeX > elementBounds.width || relativeY < 0 || relativeY > elementBounds.height) {
    if (relativeY < 0) return ElementPosition.TOP;
    if (relativeY > elementBounds.height) return ElementPosition.BOTTOM;
    if (relativeX < 0) return ElementPosition.LEFT;
    return ElementPosition.RIGHT;
  }

  // 计算区域边界
  const topBottomHeight = elementBounds.height * topBottomHeightRatio;
  const middleAreaTop = topBottomHeight;
  const middleAreaBottom = elementBounds.height - topBottomHeight;
  const middleAreaHeight = middleAreaBottom - middleAreaTop;

  // 判断在哪个主要区域
  if (relativeY <= topBottomHeight) {
    // 上区域
    if (relativeY <= edgeThreshold) {
      return ElementPosition.TOP_EDGE;
    }
    return ElementPosition.TOP;
  } else if (relativeY >= middleAreaBottom) {
    // 下区域
    if (relativeY >= elementBounds.height - edgeThreshold) {
      return ElementPosition.BOTTOM_EDGE;
    }
    return ElementPosition.BOTTOM;
  } else {
    // 中间区域（左右区域）
    const middleAreaCenterX = elementBounds.width / 2;

    if (relativeX <= middleAreaCenterX) {
      // 左区域
      if (relativeX <= edgeThreshold) {
        return ElementPosition.LEFT_EDGE;
      }
      return ElementPosition.LEFT;
    } else {
      // 右区域
      if (relativeX >= elementBounds.width - edgeThreshold) {
        return ElementPosition.RIGHT_EDGE;
      }
      return ElementPosition.RIGHT;
    }
  }
};
