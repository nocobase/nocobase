/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { type RoutePermissionNode, withAncestorIds, withoutEmptyAncestorIds } from '../utils';

function createRouteTree() {
  const tab: RoutePermissionNode = { id: 13, parentId: 12 };
  const page: RoutePermissionNode = { id: 12, parentId: 11, children: [tab] };
  const sibling: RoutePermissionNode = { id: 14, parentId: 11 };
  const group: RoutePermissionNode = { id: 11, parentId: 10, children: [page, sibling] };
  const root: RoutePermissionNode = { id: 10, children: [group] };
  const nodeById = new Map<number, RoutePermissionNode>([
    [10, root],
    [11, group],
    [12, page],
    [13, tab],
    [14, sibling],
  ]);
  return { root, group, page, tab, sibling, nodeById };
}

describe('withAncestorIds', () => {
  it('adds every ancestor from a deeply nested node up to the root', () => {
    const { tab, nodeById } = createRouteTree();
    expect(withAncestorIds([13], tab, nodeById)).toEqual([13, 12, 11, 10]);
  });

  it('does not duplicate ancestors that are already selected', () => {
    const { tab, nodeById } = createRouteTree();
    expect(withAncestorIds([13, 12, 11], tab, nodeById)).toEqual([13, 12, 11, 10]);
  });

  it('returns the ids unchanged for a root node', () => {
    const { root, nodeById } = createRouteTree();
    expect(withAncestorIds([10], root, nodeById)).toEqual([10]);
  });

  it('ignores a parent that is not part of the visible route tree', () => {
    const nodeById = new Map<number, RoutePermissionNode>();
    expect(withAncestorIds([99], { id: 99, parentId: 404 }, nodeById)).toEqual([99]);
  });

  it('does not cascade into an ancestor restored by the tree query that the filter hides', () => {
    const tab: RoutePermissionNode = { id: 13, parentId: 12 };
    const page: RoutePermissionNode = { id: 12, parentId: 11, children: [tab] };
    const group: RoutePermissionNode = { id: 11, parentId: 9, children: [page] };
    const hiddenRoot: RoutePermissionNode = { id: 9, hidden: true, children: [group] };
    const nodeById = new Map<number, RoutePermissionNode>([
      [9, hiddenRoot],
      [11, group],
      [12, page],
      [13, tab],
    ]);
    const isRouteVisible = (node: RoutePermissionNode) => node.hidden !== true;

    expect(withAncestorIds([13], tab, nodeById, isRouteVisible)).toEqual([13, 12, 11]);
  });
});

describe('withoutEmptyAncestorIds', () => {
  it('removes every ancestor that no longer has a selected child', () => {
    const { tab, nodeById } = createRouteTree();
    expect(withoutEmptyAncestorIds([12, 11, 10], tab, nodeById)).toEqual([]);
  });

  it('stops at the first ancestor that still has a selected child', () => {
    const { tab, nodeById } = createRouteTree();
    expect(withoutEmptyAncestorIds([12, 11, 10, 14], tab, nodeById)).toEqual([11, 10, 14]);
  });

  it('stops before a hidden ancestor instead of revoking it', () => {
    const tab: RoutePermissionNode = { id: 13, parentId: 12 };
    const page: RoutePermissionNode = { id: 12, parentId: 11, children: [tab] };
    const group: RoutePermissionNode = { id: 11, parentId: 9, children: [page] };
    const hiddenRoot: RoutePermissionNode = { id: 9, hidden: true, children: [group] };
    const nodeById = new Map<number, RoutePermissionNode>([
      [9, hiddenRoot],
      [11, group],
      [12, page],
      [13, tab],
    ]);
    const isRouteVisible = (node: RoutePermissionNode) => node.hidden !== true;

    expect(withoutEmptyAncestorIds([12, 11], tab, nodeById, isRouteVisible)).toEqual([]);
  });
});
