/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ViewItem } from './resolveViewParamsToViewList';

export const getKey = (viewItem: ViewItem) => `${viewItem.params.viewUid}_${viewItem.index}`;

/**
 * 对比新旧视图列表，获取需要关闭和打开的视图
 *
 * @param prevViewList - 之前的视图列表
 * @param currentViewList - 当前的视图列表
 * @returns 包含需要关闭和打开的视图列表
 */
export function getViewDiffAndUpdateHidden(prevViewList: ViewItem[], currentViewList: ViewItem[]) {
  // 将视图列表转换为以 viewUid 为键的 Map，便于查找
  const prevViewMap = new Map<string, ViewItem>();
  const currentViewMap = new Map<string, ViewItem>();

  prevViewList.forEach((viewItem) => {
    const key = getKey(viewItem);
    prevViewMap.set(key, viewItem);
  });

  currentViewList.forEach((viewItem) => {
    currentViewMap.set(getKey(viewItem), viewItem);
  });

  // 找出需要关闭的视图：存在于旧列表但不在新列表中
  const viewsToClose: ViewItem[] = [];
  prevViewMap.forEach((preViewItem, key) => {
    if (!currentViewMap.has(key)) {
      viewsToClose.push(preViewItem);
    } else {
      // 修复子页面切换时，hidden 状态失去响应性的问题
      currentViewMap.get(key).hidden = preViewItem.hidden;
    }
  });

  // 找出需要打开的视图：存在于新列表但不在旧列表中
  const viewsToOpen: ViewItem[] = [];
  currentViewMap.forEach((viewItem, key) => {
    if (!prevViewMap.has(key)) {
      viewsToOpen.push(viewItem);
    }
  });

  return {
    viewsToClose,
    viewsToOpen,
  };
}
