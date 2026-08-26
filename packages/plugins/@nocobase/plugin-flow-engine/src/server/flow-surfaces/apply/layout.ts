/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { isGridUse } from '../placement';
import type { FlowSurfaceMutateOp, FlowSurfaceNodeSpec, FlowSurfaceWriteTarget } from '../types';

type CompiledNodeRefLike = {
  uidRef: any;
};

type SyncChildrenResultLike = {
  childClientKeyRefs: Record<string, any>;
  finalItemRefs: CompiledNodeRefLike[];
  itemsChanged: boolean;
  itemsSpecified: boolean;
};

function extractLayout(props?: Record<string, any>) {
  if (!props || (!('rows' in props) && !('sizes' in props) && !('rowOrder' in props))) {
    return null;
  }
  return {
    rows: props.rows || {},
    sizes: props.sizes || {},
    rowOrder: props.rowOrder || Object.keys(props.rows || {}),
  };
}

export function omitLayoutProps(props?: Record<string, any>) {
  if (!props) {
    return props;
  }
  const next = _.omit(props, ['rows', 'sizes', 'rowOrder']);
  return Object.keys(next).length ? next : undefined;
}

function resolveLayoutRefs(layout: ReturnType<typeof extractLayout>, childClientKeyRefs: Record<string, any>) {
  if (!layout) {
    return layout;
  }
  return {
    rows: Object.fromEntries(
      Object.entries(layout.rows || {}).map(([rowId, cells]) => [
        rowId,
        _.castArray(cells).map((cell) =>
          _.castArray(cell).map((itemUid) => childClientKeyRefs[itemUid as string] ?? itemUid),
        ),
      ]),
    ),
    sizes: layout.sizes || {},
    rowOrder: layout.rowOrder || [],
  };
}

function hasRefValue(value: any): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasRefValue(item));
  }
  if (_.isPlainObject(value)) {
    if (typeof value.ref === 'string') {
      return true;
    }
    return Object.values(value).some((item) => hasRefValue(item));
  }
  return false;
}

export function buildAutoLayout(itemRefs: any[]) {
  if (!itemRefs.length) {
    return {
      rows: {},
      sizes: {},
      rowOrder: [],
    };
  }
  return {
    rows: Object.fromEntries(itemRefs.map((itemRef, index) => [`autoRow${index + 1}`, [[itemRef]]])),
    sizes: Object.fromEntries(itemRefs.map((_, index) => [`autoRow${index + 1}`, [24]])),
    rowOrder: itemRefs.map((_, index) => `autoRow${index + 1}`),
  };
}

function didItemRefsChange(currentChildren: FlowSurfaceNodeSpec[], desiredRefs: CompiledNodeRefLike[]) {
  if (currentChildren.length !== desiredRefs.length) {
    return true;
  }
  return desiredRefs.some(
    (item, index) => typeof item.uidRef !== 'string' || currentChildren[index]?.uid !== item.uidRef,
  );
}

export function emitLayoutOp(
  ops: FlowSurfaceMutateOp[],
  target: FlowSurfaceWriteTarget,
  currentNode: any,
  desiredNode: Pick<FlowSurfaceNodeSpec, 'props' | 'use'>,
  childSync: SyncChildrenResultLike,
) {
  const explicitLayout = resolveLayoutRefs(extractLayout(desiredNode.props), childSync.childClientKeyRefs);
  const desiredLayout =
    explicitLayout ||
    (isGridUse(currentNode?.use || desiredNode.use) && childSync.itemsSpecified
      ? buildAutoLayout(childSync.finalItemRefs.map((item) => item.uidRef))
      : null);
  if (!desiredLayout) {
    return;
  }
  if (!hasRefValue(desiredLayout) && _.isEqual(desiredLayout, extractLayout(currentNode?.props))) {
    return;
  }
  ops.push({
    type: 'setLayout',
    target,
    values: desiredLayout,
  });
}

export function emitMoveOps(ops: FlowSurfaceMutateOp[], desiredRefs: CompiledNodeRefLike[]) {
  for (let index = desiredRefs.length - 2; index >= 0; index -= 1) {
    ops.push({
      type: 'moveNode',
      values: {
        sourceUid: desiredRefs[index].uidRef,
        targetUid: desiredRefs[index + 1].uidRef,
        position: 'before',
      },
    });
  }
}

function emitOrderedTabMoves(
  ops: FlowSurfaceMutateOp[],
  desiredRefs: CompiledNodeRefLike[],
  type: 'moveTab' | 'movePopupTab',
) {
  for (let index = desiredRefs.length - 2; index >= 0; index -= 1) {
    ops.push({
      type,
      values: {
        sourceUid: desiredRefs[index].uidRef,
        targetUid: desiredRefs[index + 1].uidRef,
        position: 'before',
      },
    });
  }
}

export function emitMoveTabOps(ops: FlowSurfaceMutateOp[], desiredRefs: CompiledNodeRefLike[]) {
  emitOrderedTabMoves(ops, desiredRefs, 'moveTab');
}

export function emitMovePopupTabOps(ops: FlowSurfaceMutateOp[], desiredRefs: CompiledNodeRefLike[]) {
  emitOrderedTabMoves(ops, desiredRefs, 'movePopupTab');
}

export { didItemRefsChange };
