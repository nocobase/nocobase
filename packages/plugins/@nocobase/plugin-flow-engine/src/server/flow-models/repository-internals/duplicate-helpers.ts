/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';

export function dedupeNodesForDuplicate(nodes: any[], rootUid: string) {
  if (!Array.isArray(nodes) || nodes.length <= 1) {
    return nodes;
  }

  const rowsByUid = lodash.groupBy(nodes, 'uid');
  const uniqueUids = Object.keys(rowsByUid);
  if (uniqueUids.length === nodes.length) {
    return nodes;
  }

  const uidsInSubtree = new Set(uniqueUids);
  const rootDepthByUid = new Map<string, number>();
  for (const uid of uniqueUids) {
    const rows = rowsByUid[uid] || [];
    const depths = rows.map((row) => Number(row?.depth ?? 0));
    rootDepthByUid.set(uid, depths.length ? Math.min(...depths) : 0);
  }

  const pickRowForUid = (uid: string, rows: any[]) => {
    if (!rows?.length) return null;
    if (rows.length === 1) return rows[0];
    if (uid === rootUid) return rows[0];

    let bestRow = rows[0];
    let bestParentRootDepth = -1;

    for (const row of rows) {
      const parentUid = row?.parent;
      if (!parentUid || !uidsInSubtree.has(parentUid)) {
        continue;
      }

      const parentRootDepth = rootDepthByUid.get(parentUid) ?? -1;
      if (parentRootDepth > bestParentRootDepth) {
        bestParentRootDepth = parentRootDepth;
        bestRow = row;
      }
    }

    return bestRow;
  };

  const uidsInQueryOrder: string[] = [];
  const seenUidsInQueryOrder = new Set<string>();
  for (const row of nodes) {
    const uid = row?.uid;
    if (!uid || seenUidsInQueryOrder.has(uid)) continue;
    seenUidsInQueryOrder.add(uid);
    uidsInQueryOrder.push(uid);
  }

  return uidsInQueryOrder.map((uid) => pickRowForUid(uid, rowsByUid[uid])).filter(Boolean);
}

export function replaceStepParamsModelUids(options: any, uidMap: Record<string, string>) {
  const opts = options && typeof options === 'object' ? options : {};
  const replaceUidString = (value: any) => (typeof value === 'string' && uidMap[value] ? uidMap[value] : value);

  const replaceInPlace = (value: any): any => {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        value[i] = replaceInPlace(value[i]);
      }
      return value;
    }
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        value[key] = replaceInPlace(value[key]);
      }
      return value;
    }
    return replaceUidString(value);
  };

  if (opts.stepParams) {
    opts.stepParams = replaceInPlace(opts.stepParams);
  }

  return opts;
}

export function stripDuplicateReplayMarker(options: any) {
  return lodash.omit(options, ['__mutateDuplicate']);
}
