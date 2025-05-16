/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';

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
 * Generic tree node depth-first traversal function
 * @param {Object|Array} tree - The tree structure to traverse
 * @param {Function} callback - The callback function executed for each node, stops traversing and returns the current node when a truthy value is returned
 * @param {Object} options - Configuration options
 * @param {string|Function} options.childrenKey - The property name of child nodes, defaults to 'children', can also be a function
 * @returns {any|undefined} - The found node or undefined
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

  // Handle case where the root node is an array
  const nodes = Array.isArray(tree) ? [...tree] : [tree];

  // Depth-first search
  for (const node of nodes) {
    // Call callback function on the current node
    if (callback(node)) {
      return node;
    }

    // Get child nodes
    const children = typeof childrenKey === 'function' ? childrenKey(node) : (node as any)[childrenKey];

    // Recursively process child nodes
    if (Array.isArray(children) && children.length > 0) {
      const found = treeFind(children, callback, options);
      if (found !== undefined) {
        return found;
      }
    }
  }

  return undefined;
}

/**
 * Sort a tree structure
 * @param {Array} tree - Tree structure array
 * @param {string|Function} sortBy - Sort field or sort function
 * @param {string} childrenKey - The key name of child nodes, defaults to 'children'
 * @param {boolean} isAsc - Whether to sort in ascending order, defaults to true
 * @returns {Array} - The sorted tree structure
 */
export function sortTree(tree: any[], sortBy: string | Function, childrenKey = 'children', isAsc = true) {
  if (!tree || !Array.isArray(tree) || tree.length === 0) {
    return tree;
  }

  // Sort nodes at the current level
  const sortedTree = _.orderBy(tree, sortBy, isAsc ? 'asc' : 'desc');

  // Recursively sort child nodes
  return sortedTree.map((node) => {
    if (node[childrenKey] && node[childrenKey].length > 0) {
      return {
        ...node,
        [childrenKey]: sortTree(node[childrenKey], sortBy, childrenKey, isAsc),
      };
    }
    return node;
  });
}
