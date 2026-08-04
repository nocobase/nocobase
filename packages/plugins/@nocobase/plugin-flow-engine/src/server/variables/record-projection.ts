/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PathSegment } from '../template/variable-expression';

type ProjectionNode = {
  whole: boolean;
  children: Map<PathSegment, ProjectionNode>;
};

const blockedKeys = new Set(['__proto__', 'prototype', 'constructor']);
const omitted = Symbol('omitted record projection value');

function createNode(): ProjectionNode {
  return { whole: false, children: new Map() };
}

function isValidSegment(segment: PathSegment) {
  return typeof segment === 'string'
    ? !blockedKeys.has(segment)
    : Number.isInteger(segment) && segment >= 0 && segment < 2 ** 32 - 1;
}

function addPath(root: ProjectionNode, path: readonly PathSegment[]) {
  if (!path.every(isValidSegment)) return;
  let node = root;
  for (const segment of path) {
    if (node.whole) return;
    let child = node.children.get(segment);
    if (!child) {
      child = createNode();
      node.children.set(segment, child);
    }
    node = child;
  }
  node.whole = true;
  node.children.clear();
}

function mergeNodes(left: ProjectionNode, right: ProjectionNode): ProjectionNode {
  if (left.whole || right.whole) return { whole: true, children: new Map() };
  const merged = createNode();
  for (const [segment, child] of left.children) merged.children.set(segment, child);
  for (const [segment, child] of right.children) {
    const existing = merged.children.get(segment);
    merged.children.set(segment, existing ? mergeNodes(existing, child) : child);
  }
  return merged;
}

function getOwnDataProperty(source: object, key: string) {
  const descriptor = Object.getOwnPropertyDescriptor(source, key);
  if (!descriptor?.enumerable || !('value' in descriptor) || typeof descriptor.value === 'function') return;
  return descriptor;
}

function defineDataProperty(target: object, key: string, value: unknown) {
  Object.defineProperty(target, key, { configurable: true, enumerable: true, value, writable: true });
}

function copyWhole(value: unknown, seen: WeakMap<object, unknown>): unknown | typeof omitted {
  if (typeof value === 'function') return omitted;
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Buffer.isBuffer(value)) return Buffer.prototype.toJSON.call(value);

  const cached = seen.get(value);
  if (cached) return cached;
  const result: Record<string, unknown> | unknown[] = Array.isArray(value)
    ? new Array(value.length)
    : Object.create(null);
  seen.set(value, result);
  for (const key of Object.keys(value)) {
    if (blockedKeys.has(key)) continue;
    const descriptor = getOwnDataProperty(value, key);
    if (!descriptor) continue;
    const child = copyWhole(descriptor.value, seen);
    if (child !== omitted) defineDataProperty(result, key, child);
  }
  return result;
}

function projectArray(source: unknown[], node: ProjectionNode): unknown[] {
  const elementNode = createNode();
  const exactNodes = new Map<number, ProjectionNode>();
  for (const [segment, child] of node.children) {
    if (typeof segment === 'string') elementNode.children.set(segment, child);
    else exactNodes.set(segment, child);
  }

  const projectAllElements = elementNode.children.size > 0;
  const result: unknown[] = projectAllElements ? new Array(source.length) : [];
  const indices = new Set<number>(exactNodes.keys());
  if (projectAllElements) {
    for (const key of Object.keys(source)) {
      const index = Number(key);
      if (String(index) === key && isValidSegment(index)) indices.add(index);
    }
  }

  for (const index of indices) {
    const descriptor = getOwnDataProperty(source, String(index));
    if (!descriptor) continue;
    const exactNode = exactNodes.get(index);
    const childNode = exactNode && projectAllElements ? mergeNodes(elementNode, exactNode) : exactNode || elementNode;
    const child = projectValue(descriptor.value, childNode);
    if (child !== omitted) defineDataProperty(result, String(index), child);
  }
  return result;
}

function projectValue(value: unknown, node: ProjectionNode): unknown | typeof omitted {
  if (node.whole) return copyWhole(value, new WeakMap());
  if (Array.isArray(value)) return projectArray(value, node);
  if (!value || typeof value !== 'object') return omitted;

  const result: Record<string, unknown> = Object.create(null);
  for (const [segment, childNode] of node.children) {
    if (typeof segment !== 'string') continue;
    const descriptor = getOwnDataProperty(value, segment);
    if (!descriptor) continue;
    const child = projectValue(descriptor.value, childNode);
    if (child !== omitted) defineDataProperty(result, segment, child);
  }
  return result;
}

export function projectRecord(raw: unknown, exposedPaths: readonly (readonly PathSegment[])[]): unknown {
  const root = createNode();
  for (const path of exposedPaths) addPath(root, path);
  const result = projectValue(raw, root);
  return result === omitted ? undefined : result;
}
