/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  withAncestorIds,
  withoutEmptyAncestorIds,
  type LayoutRoutePermissionNode,
} from '../permissions/layoutAwareDesktopRoutesPermissions';

describe('route permission ancestor helpers', () => {
  const link: LayoutRoutePermissionNode = { id: 12, parentId: 11 };
  const innerGroup: LayoutRoutePermissionNode = { id: 11, parentId: 10, children: [link] };
  const outerGroup: LayoutRoutePermissionNode = { id: 10, children: [innerGroup] };
  const tab: LayoutRoutePermissionNode = { id: 21, parentId: 20 };
  const legacyPage: LayoutRoutePermissionNode = { id: 20, readOnly: true, children: [tab] };
  const nodeById = new Map<number, LayoutRoutePermissionNode>([
    [10, outerGroup],
    [11, innerGroup],
    [12, link],
    [20, legacyPage],
    [21, tab],
  ]);

  it('adds every editable ancestor up to the root', () => {
    expect(withAncestorIds([12], link, nodeById)).toEqual([12, 11, 10]);
  });

  it('stops at a read-only ancestor', () => {
    expect(withAncestorIds([21], tab, nodeById)).toEqual([21]);
  });

  it('removes ancestors that have no selected child left', () => {
    expect(withoutEmptyAncestorIds([11, 10], link, nodeById)).toEqual([]);
  });

  it('keeps an ancestor that still has a selected child', () => {
    const sibling: LayoutRoutePermissionNode = { id: 13, parentId: 10 };
    const siblingGroup = { ...outerGroup, children: [innerGroup, sibling] };
    const withSibling = new Map(nodeById);
    withSibling.set(13, sibling);
    withSibling.set(10, siblingGroup);
    expect(withoutEmptyAncestorIds([11, 10, 13], link, withSibling)).toEqual([10, 13]);
  });

  it('never removes a read-only ancestor', () => {
    expect(withoutEmptyAncestorIds([21, 20], tab, nodeById)).toEqual([21, 20]);
  });

  it('treats a route without any layout as outside the current layout', () => {
    const child: LayoutRoutePermissionNode = { id: 12, parentId: 11 };
    const unassigned: LayoutRoutePermissionNode = { id: 11, parentId: 10, layoutUids: [] };
    const nodeById = new Map<number, LayoutRoutePermissionNode>([
      [10, { id: 10, children: [unassigned] }],
      [11, unassigned],
      [12, child],
    ]);
    const isRouteInLayout = (node: LayoutRoutePermissionNode) => (node.layoutUids ?? []).includes('admin-layout-model');

    expect(withAncestorIds([12], child, nodeById, isRouteInLayout)).toEqual([12]);
  });

  it('stops at an ancestor restored by the tree query that belongs to another layout', () => {
    const link: LayoutRoutePermissionNode = { id: 12, parentId: 11, layoutUids: ['admin-layout-model'] };
    const foreignGroup: LayoutRoutePermissionNode = {
      id: 11,
      parentId: 10,
      layoutUids: ['mobile-layout-model'],
      children: [link],
    };
    const nodeById = new Map<number, LayoutRoutePermissionNode>([
      [10, { id: 10, children: [foreignGroup] }],
      [11, foreignGroup],
      [12, link],
    ]);
    const isRouteInLayout = (node: LayoutRoutePermissionNode) =>
      node.layoutUids?.includes('admin-layout-model') ?? true;

    expect(withAncestorIds([12], link, nodeById, isRouteInLayout)).toEqual([12]);
  });

  it('keeps an ancestor while a filtered-out branch still has a selected descendant', () => {
    const leaf: LayoutRoutePermissionNode = { id: 14, parentId: 12, layoutUids: ['admin-layout-model'] };
    const branch: LayoutRoutePermissionNode = {
      id: 12,
      parentId: 10,
      layoutUids: ['admin-layout-model'],
      children: [leaf],
    };
    const foreignGroup: LayoutRoutePermissionNode = {
      id: 11,
      parentId: 10,
      layoutUids: ['mobile-layout-model'],
    };
    const grantedRoute: LayoutRoutePermissionNode = {
      id: 13,
      parentId: 11,
      layoutUids: ['mobile-layout-model'],
    };
    foreignGroup.children = [grantedRoute];
    const root: LayoutRoutePermissionNode = {
      id: 10,
      layoutUids: ['admin-layout-model'],
      children: [foreignGroup, branch],
    };
    const nodeById = new Map<number, LayoutRoutePermissionNode>([
      [10, root],
      [11, foreignGroup],
      [12, branch],
      [13, grantedRoute],
      [14, leaf],
    ]);

    // The foreign branch is not selectable here, but its granted route must keep the shared ancestor alive
    expect(withoutEmptyAncestorIds([10, 13], leaf, nodeById)).toEqual([10, 13]);
  });

  it('keeps a shared ancestor that another layout may still need', () => {
    const link: LayoutRoutePermissionNode = { id: 12, parentId: 11, layoutUids: ['admin-layout-model'] };
    const innerGroup: LayoutRoutePermissionNode = {
      id: 11,
      parentId: 10,
      layoutUids: ['admin-layout-model'],
      children: [link],
    };
    const sharedRoot: LayoutRoutePermissionNode = {
      id: 10,
      layoutUids: ['admin-layout-model', 'mobile-layout-model'],
      children: [innerGroup],
    };
    const nodeById = new Map<number, LayoutRoutePermissionNode>([
      [10, sharedRoot],
      [11, innerGroup],
      [12, link],
    ]);
    const canRevoke = (node: LayoutRoutePermissionNode) => (node.layoutUids?.length ?? 0) <= 1;

    expect(withoutEmptyAncestorIds([10, 11], link, nodeById, canRevoke)).toEqual([10]);
  });
});
