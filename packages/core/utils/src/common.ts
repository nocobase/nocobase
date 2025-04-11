/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

export const isArray = (value: any): value is Array<any> => {
  return Array.isArray(value);
};

export const isEmpty = (value: unknown) => {
  if (isPlainObject(value)) {
    return Object.keys(value).length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return !value;
};

export const isPlainObject = (value) => {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
};

export const hasEmptyValue = (objOrArr: object | any[]) => {
  let result = true;
  for (const key in objOrArr) {
    result = false;
    if (isArray(objOrArr[key]) && objOrArr[key].length === 0) {
      return true;
    }
    if (!objOrArr[key]) {
      return true;
    }
    if (isPlainObject(objOrArr[key]) || isArray(objOrArr[key])) {
      return hasEmptyValue(objOrArr[key]);
    }
  }
  return result;
};

export const nextTick = (fn: () => void) => {
  setTimeout(fn);
};

/**
 * 通用树节点深度优先遍历函数
 * @param {Object|Array} tree - 要遍历的树结构
 * @param {Function} callback - 遍历每个节点时执行的回调函数，返回真值时停止遍历并返回当前节点
 * @param {Object} options - 配置选项
 * @param {string|Function} options.childrenKey - 子节点的属性名，默认为'children'，也可以是一个函数
 * @returns {any|undefined} - 找到的节点或undefined
 */
export function treeFind<T = any>(
  tree: T | T[],
  callback: (node: T) => boolean,
  options: {
    childrenKey?: string | ((node: T) => T[] | undefined);
  } = {},
): T | undefined {
  if (!tree) return undefined;

  const { childrenKey = 'children' } = options;

  // 处理根节点是数组的情况
  const nodes = Array.isArray(tree) ? [...tree] : [tree];

  // 深度优先搜索
  for (const node of nodes) {
    // 对当前节点调用回调函数
    if (callback(node)) {
      return node;
    }

    // 获取子节点
    const children = typeof childrenKey === 'function' ? childrenKey(node) : (node as any)[childrenKey];

    // 递归处理子节点
    if (Array.isArray(children) && children.length > 0) {
      const found = treeFind(children, callback, options);
      if (found !== undefined) {
        return found;
      }
    }
  }

  return undefined;
}
