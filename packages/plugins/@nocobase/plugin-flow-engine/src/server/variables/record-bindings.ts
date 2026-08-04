/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  isProtectedServerContextKey,
  SERVER_CONTEXT_INTERNAL_KEYS,
  SERVER_CONTEXT_PROTOTYPE_KEYS,
} from '../template/context-keys';
import type { PathSegment, VariablePathRef } from '../template/variable-expression';
import { isRecordParams, type RecordParams } from './records';
import type { RecordSlotPolicies } from './record-slot-policy';

export type RecordBindingPlannerMode = 'strict' | 'trusted';

export type RecordContextPolicy = Readonly<{
  allowGenericStrictPrefix?: boolean;
  exactWholeRecordPaths?: readonly (readonly PathSegment[])[];
}>;

export type AuthorizedRecordBinding = Readonly<{
  params: RecordParams;
  varName: string;
  prefix: readonly PathSegment[];
  relativePaths: readonly (readonly PathSegment[])[];
  preferFullRecord: boolean;
  contextKey: string;
  contextLocation: readonly PathSegment[];
}>;

export type RecordBindingRejectionReason =
  | 'protected-context-root'
  | 'protected-context-key'
  | 'missing-record-slot-policy'
  | 'record-slot-mismatch';

export type RecordBindingRejection = Readonly<{
  reason: RecordBindingRejectionReason;
  varName: string;
  prefix: readonly PathSegment[];
  contextKey: string;
  contextLocation: readonly PathSegment[];
}>;

export type RecordBindingPlan = Readonly<{
  bindings: readonly AuthorizedRecordBinding[];
  contextParams: Readonly<Record<string, unknown>>;
  rejections: readonly RecordBindingRejection[];
}>;

export type RecordBindingUsage = Readonly<Record<string, readonly VariablePathRef[]>>;

export type PlanRecordBindingsOptions = Readonly<{
  contextParams?: Readonly<Record<string, unknown>>;
  mode?: RecordBindingPlannerMode;
  policies?: RecordSlotPolicies;
  usage: RecordBindingUsage;
}>;

type RecordDescriptor = Readonly<{
  contextKey: string;
  contextLocation: readonly PathSegment[];
  params?: RecordParams;
  prefix: readonly PathSegment[];
  varName: string;
}>;

type ValidRecordDescriptor = RecordDescriptor & Readonly<{ params: RecordParams }>;

const removedRecordParams = Symbol('removed-record-params');
const blockedBindingSegments = new Set<string>([...SERVER_CONTEXT_PROTOTYPE_KEYS, ...SERVER_CONTEXT_INTERNAL_KEYS]);

function normalizeFlatSegment(segment: string): PathSegment {
  return /^\d+$/.test(segment) ? Number(segment) : segment;
}

function splitFlatContextKey(key: string): readonly [string, ...PathSegment[]] {
  const [varName, ...prefix] = key.split('.');
  return [varName, ...prefix.map(normalizeFlatSegment)];
}

function startsWithSegments(path: readonly PathSegment[], prefix: readonly PathSegment[]) {
  return prefix.length <= path.length && prefix.every((segment, index) => path[index] === segment);
}

function cloneRecordParams(params: RecordParams): RecordParams {
  return Object.freeze({
    ...params,
    ...(Array.isArray(params.fields) ? { fields: Object.freeze([...params.fields]) as string[] } : {}),
    ...(Array.isArray(params.appends) ? { appends: Object.freeze([...params.appends]) as string[] } : {}),
  });
}

function isRecordDescriptor(value: unknown) {
  return (
    !!value &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, 'collection') &&
    Object.prototype.hasOwnProperty.call(value, 'filterByTk')
  );
}

function getRecordParams(value: unknown): RecordParams | undefined {
  if (!isRecordParams(value) || !value.collection) return undefined;
  if (typeof value.dataSourceKey !== 'undefined' && typeof value.dataSourceKey !== 'string') return undefined;
  if (typeof value.associationName !== 'undefined' && typeof value.associationName !== 'string') return undefined;
  if (
    typeof value.fields !== 'undefined' &&
    (!Array.isArray(value.fields) || !value.fields.every((field) => typeof field === 'string'))
  ) {
    return undefined;
  }
  if (
    typeof value.appends !== 'undefined' &&
    (!Array.isArray(value.appends) || !value.appends.every((append) => typeof append === 'string'))
  ) {
    return undefined;
  }
  return cloneRecordParams(value);
}

function collectDescriptorsAndContextParams(contextParams: Readonly<Record<string, unknown>>) {
  const descriptors: RecordDescriptor[] = [];

  const visit = (
    value: unknown,
    varName: string,
    prefix: readonly PathSegment[],
    contextKey: string,
    contextLocation: readonly PathSegment[],
  ): unknown | typeof removedRecordParams => {
    if (isRecordDescriptor(value)) {
      descriptors.push({
        contextKey,
        contextLocation: Object.freeze([...contextLocation]),
        params: getRecordParams(value),
        prefix: Object.freeze([...prefix]),
        varName,
      });
      return removedRecordParams;
    }
    if (Array.isArray(value)) {
      return Object.freeze(
        value.map((child, index) => {
          const next = visit(child, varName, [...prefix, index], contextKey, [...contextLocation, index]);
          return next === removedRecordParams ? undefined : next;
        }),
      );
    }
    if (!value || typeof value !== 'object') return value;

    const entries: [string, unknown][] = [];
    for (const [key, child] of Object.entries(value)) {
      const next = visit(child, varName, [...prefix, key], contextKey, [...contextLocation, key]);
      if (next !== removedRecordParams) entries.push([key, next]);
    }
    return Object.freeze(Object.fromEntries(entries));
  };

  const cleaned: [string, unknown][] = [];
  for (const [contextKey, value] of Object.entries(contextParams)) {
    const [varName, ...prefix] = splitFlatContextKey(contextKey);
    const next = visit(value, varName, prefix, contextKey, [contextKey]);
    if (next !== removedRecordParams) cleaned.push([contextKey, next]);
  }

  return { contextParams: Object.freeze(Object.fromEntries(cleaned)), descriptors };
}

function getDescriptorKey(varName: string, prefix: readonly PathSegment[]) {
  return JSON.stringify([varName, ...prefix]);
}

function groupDescriptors(descriptors: readonly RecordDescriptor[]) {
  const groups = new Map<string, RecordDescriptor[]>();
  for (const descriptor of descriptors) {
    const key = getDescriptorKey(descriptor.varName, descriptor.prefix);
    const group = groups.get(key) || [];
    group.push(descriptor);
    groups.set(key, group);
  }
  return groups;
}

function createRejection(descriptor: RecordDescriptor, reason: RecordBindingRejectionReason) {
  return Object.freeze({
    reason,
    varName: descriptor.varName,
    prefix: descriptor.prefix,
    contextKey: descriptor.contextKey,
    contextLocation: descriptor.contextLocation,
  });
}

function hasBlockedSegment(path: readonly PathSegment[]) {
  return path.some((segment) => typeof segment === 'string' && blockedBindingSegments.has(segment));
}

function hasValidParams(descriptor: RecordDescriptor): descriptor is ValidRecordDescriptor {
  return !!descriptor.params;
}

function createBinding(descriptor: ValidRecordDescriptor, paths: readonly VariablePathRef[]): AuthorizedRecordBinding {
  const relativePaths = paths.map((path) => Object.freeze(path.runtimeSegments.slice(descriptor.prefix.length)));
  return Object.freeze({
    params: descriptor.params,
    varName: descriptor.varName,
    prefix: descriptor.prefix,
    relativePaths: Object.freeze(relativePaths),
    preferFullRecord: relativePaths.some((path) => path.length === 0),
    contextKey: descriptor.contextKey,
    contextLocation: descriptor.contextLocation,
  });
}

function planStrictBindings(
  options: PlanRecordBindingsOptions,
  descriptorGroups: ReadonlyMap<string, readonly RecordDescriptor[]>,
) {
  const groups = new Map<string, { descriptorKey: string; paths: VariablePathRef[] }>();
  for (const refs of Object.values(options.usage)) {
    for (const ref of refs) {
      const slot = options.policies?.get(ref.canonicalKey)?.slot;
      if (!slot) continue;
      const descriptorKey = getDescriptorKey(ref.varName, slot);
      const group = groups.get(descriptorKey) || { descriptorKey, paths: [] };
      group.paths.push(ref);
      groups.set(descriptorKey, group);
    }
  }

  const bindings: AuthorizedRecordBinding[] = [];
  const rejections: RecordBindingRejection[] = [];
  for (const group of groups.values()) {
    const candidates = descriptorGroups.get(group.descriptorKey) || [];
    if (candidates.length !== 1 || !hasValidParams(candidates[0])) continue;
    const descriptor = candidates[0];
    if (isProtectedServerContextKey(descriptor.varName)) {
      rejections.push(createRejection(descriptor, 'protected-context-root'));
      continue;
    }
    if (hasBlockedSegment(descriptor.prefix) || group.paths.some((path) => hasBlockedSegment(path.runtimeSegments))) {
      rejections.push(createRejection(descriptor, 'protected-context-key'));
      continue;
    }
    bindings.push(createBinding(descriptor, group.paths));
  }
  return { bindings, rejections };
}

function planTrustedBindings(
  usage: RecordBindingUsage,
  descriptorGroups: ReadonlyMap<string, readonly RecordDescriptor[]>,
) {
  const bindings: AuthorizedRecordBinding[] = [];
  const rejections: RecordBindingRejection[] = [];
  for (const candidates of descriptorGroups.values()) {
    if (candidates.length !== 1 || !hasValidParams(candidates[0])) continue;
    const descriptor = candidates[0];
    const paths = (usage[descriptor.varName] || []).filter((path) =>
      startsWithSegments(path.runtimeSegments, descriptor.prefix),
    );
    if (!paths.length) continue;
    if (isProtectedServerContextKey(descriptor.varName)) {
      rejections.push(createRejection(descriptor, 'protected-context-root'));
      continue;
    }
    if (hasBlockedSegment(descriptor.prefix) || paths.some((path) => hasBlockedSegment(path.runtimeSegments))) {
      rejections.push(createRejection(descriptor, 'protected-context-key'));
      continue;
    }
    bindings.push(createBinding(descriptor, paths));
  }
  return { bindings, rejections };
}

export function planRecordBindings(options: PlanRecordBindingsOptions): RecordBindingPlan {
  const mode = options.mode ?? 'strict';
  const { contextParams, descriptors } = collectDescriptorsAndContextParams(options.contextParams ?? {});
  const descriptorGroups = groupDescriptors(descriptors);
  const { bindings, rejections } =
    mode === 'trusted'
      ? planTrustedBindings(options.usage, descriptorGroups)
      : planStrictBindings(options, descriptorGroups);

  return Object.freeze({
    bindings: Object.freeze(bindings),
    contextParams,
    rejections: Object.freeze(rejections),
  });
}
