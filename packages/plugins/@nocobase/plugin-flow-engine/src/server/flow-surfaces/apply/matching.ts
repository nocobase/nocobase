/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { FlowSurfaceBadRequestError } from '../errors';
import type { FlowSurfaceApplySpec, FlowSurfaceNodeSpec } from '../types';

export function normalizeChildren(input: any): FlowSurfaceNodeSpec[] {
  if (!input) {
    return [];
  }
  return _.castArray(input as any).filter(Boolean) as FlowSurfaceNodeSpec[];
}

export function hasExplicitSubModelKey(
  node: Pick<FlowSurfaceNodeSpec, 'subModels'> | FlowSurfaceApplySpec,
  key: string,
) {
  return !!node?.subModels && Object.prototype.hasOwnProperty.call(node.subModels, key);
}

export function matchesObjectChild(currentChild: any, desiredChild: FlowSurfaceNodeSpec) {
  return currentChild.uid === desiredChild.uid || (!desiredChild.uid && currentChild.use === desiredChild.use);
}

export function planArrayChildMatches(
  currentChildren: FlowSurfaceNodeSpec[],
  desiredChildren: FlowSurfaceNodeSpec[],
  parentUse: string,
  subKey: string,
) {
  const matchesByDesiredIndex = new Map<number, FlowSurfaceNodeSpec>();
  const matchedCurrentUids = new Set<string>();
  const remainingDesiredByUse = new Map<string, number[]>();

  for (const [desiredIndex, desiredChild] of desiredChildren.entries()) {
    const matchedCurrent = findExactArrayChildMatch(currentChildren, desiredChild, matchedCurrentUids);
    if (matchedCurrent) {
      matchesByDesiredIndex.set(desiredIndex, matchedCurrent);
      if (matchedCurrent.uid) {
        matchedCurrentUids.add(matchedCurrent.uid);
      }
      continue;
    }

    if (desiredChild?.use && !desiredChild.uid) {
      const desiredIndexes = remainingDesiredByUse.get(desiredChild.use) || [];
      desiredIndexes.push(desiredIndex);
      remainingDesiredByUse.set(desiredChild.use, desiredIndexes);
    }
  }

  const remainingCurrentByUse = new Map<string, FlowSurfaceNodeSpec[]>();
  for (const currentChild of currentChildren) {
    if (!currentChild?.use || matchedCurrentUids.has(currentChild.uid || '')) {
      continue;
    }
    const currentGroup = remainingCurrentByUse.get(currentChild.use) || [];
    currentGroup.push(currentChild);
    remainingCurrentByUse.set(currentChild.use, currentGroup);
  }

  const uses = new Set<string>([...remainingCurrentByUse.keys(), ...remainingDesiredByUse.keys()]);
  for (const use of uses) {
    const currentGroup = remainingCurrentByUse.get(use) || [];
    const desiredIndexes = remainingDesiredByUse.get(use) || [];
    const shouldReuseByOrder = currentGroup.length > 1 || desiredIndexes.length > 1;
    if (
      currentGroup.length > 0 &&
      desiredIndexes.length > 0 &&
      currentGroup.length !== desiredIndexes.length &&
      shouldReuseByOrder
    ) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces apply cannot safely match duplicate '${use}' nodes under '${parentUse}.${subKey}' without explicit uid or signature`,
      );
    }

    if (!shouldReuseByOrder) {
      continue;
    }

    const reuseCount = Math.min(currentGroup.length, desiredIndexes.length);
    for (let index = 0; index < reuseCount; index += 1) {
      const currentChild = currentGroup[index];
      const desiredIndex = desiredIndexes[index];
      matchesByDesiredIndex.set(desiredIndex, currentChild);
      if (currentChild?.uid) {
        matchedCurrentUids.add(currentChild.uid);
      }
    }
  }

  return {
    matchesByDesiredIndex,
    matchedCurrentUids,
  };
}

function findExactArrayChildMatch(
  currentChildren: FlowSurfaceNodeSpec[],
  desiredChild: FlowSurfaceNodeSpec,
  matchedCurrent: Set<string>,
) {
  if (desiredChild.uid) {
    return currentChildren.find((item) => item?.uid === desiredChild.uid);
  }

  const desiredStrongSignature = getStrongNodeSignature(desiredChild);
  if (desiredStrongSignature) {
    return currentChildren.find(
      (item) => !matchedCurrent.has(item.uid || '') && getStrongNodeSignature(item) === desiredStrongSignature,
    );
  }

  const desiredWeakSignature = getWeakNodeSignature(desiredChild);
  if (desiredWeakSignature) {
    return currentChildren.find(
      (item) => !matchedCurrent.has(item.uid || '') && getWeakNodeSignature(item) === desiredWeakSignature,
    );
  }

  return undefined;
}

function getStrongNodeSignature(node: any) {
  if (!node?.use) {
    return null;
  }

  const resourceInit = _.get(node, ['stepParams', 'resourceSettings', 'init']);
  if (
    resourceInit?.dataSourceKey ||
    resourceInit?.collectionName ||
    resourceInit?.associationName ||
    resourceInit?.associationPathName ||
    !_.isUndefined(resourceInit?.sourceId)
  ) {
    return [
      'resource',
      node.use,
      resourceInit.dataSourceKey || '',
      resourceInit.collectionName || '',
      resourceInit.associationName || '',
      resourceInit.associationPathName || '',
      _.isUndefined(resourceInit.sourceId) ? '' : String(resourceInit.sourceId),
    ].join(':');
  }

  const fieldInit =
    _.get(node, ['stepParams', 'fieldSettings', 'init']) ||
    _.get(node, ['subModels', 'field', 'stepParams', 'fieldSettings', 'init']);
  if (fieldInit?.fieldPath) {
    return [
      'field',
      node.use,
      fieldInit.dataSourceKey || '',
      fieldInit.collectionName || '',
      fieldInit.associationPathName || '',
      fieldInit.fieldPath,
    ].join(':');
  }

  if (node.use === 'TableActionsColumnModel') {
    return 'slot:table-actions-column';
  }

  return null;
}

function getWeakNodeSignature(node: any) {
  if (!node?.use) {
    return null;
  }

  const title =
    _.get(node, ['stepParams', 'pageTabSettings', 'tab', 'title']) ||
    _.get(node, ['stepParams', 'buttonSettings', 'general', 'title']) ||
    _.get(node, ['props', 'title']);

  if (typeof title === 'string' && title.trim()) {
    return ['title', node.use, title.trim()].join(':');
  }

  return null;
}
