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
});
