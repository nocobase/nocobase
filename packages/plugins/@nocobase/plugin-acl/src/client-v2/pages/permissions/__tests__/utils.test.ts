/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getPermissionChanges, type RoutePermissionNode, withAncestorIds, withoutEmptyAncestorIds } from '../utils';

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

  it('keeps an ancestor while a filtered-out branch still has a selected descendant', () => {
    const leaf: RoutePermissionNode = { id: 14, parentId: 12 };
    const branch: RoutePermissionNode = { id: 12, parentId: 10, children: [leaf] };
    const hiddenGroup: RoutePermissionNode = { id: 11, parentId: 10, hidden: true };
    const grantedRoute: RoutePermissionNode = { id: 13, parentId: 11 };
    hiddenGroup.children = [grantedRoute];
    const root: RoutePermissionNode = { id: 10, children: [hiddenGroup, branch] };
    const nodeById = new Map<number, RoutePermissionNode>([
      [10, root],
      [11, hiddenGroup],
      [12, branch],
      [13, grantedRoute],
      [14, leaf],
    ]);
    const isRouteVisible = (node: RoutePermissionNode) => node.hidden !== true;

    // Leaf is unchecked, branch becomes empty, but route 13 is still granted behind the hidden group
    expect(withoutEmptyAncestorIds([10, 13], leaf, nodeById, isRouteVisible)).toEqual([10, 13]);
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

describe('getPermissionChanges', () => {
  it('adds and removes only ids inside the scope', () => {
    expect(getPermissionChanges([1, 9], [2], [1, 2])).toEqual({ add: [2], remove: [1] });
  });

  it('never removes a grant that is outside the scope', () => {
    // 9 is a hidden ancestor that the role already has; selecting all visible routes must keep it
    expect(getPermissionChanges([1, 9], [1, 2], [1, 2])).toEqual({ add: [2], remove: [] });
  });
});
