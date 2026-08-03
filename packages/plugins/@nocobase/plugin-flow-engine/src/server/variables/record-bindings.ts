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

export type RecordBindingPlannerMode = 'strict' | 'trusted';

export type RecordContextPolicy = Readonly<{
  allowGenericStrictPrefix?: boolean;
  exactWholeRecordPaths?: readonly (readonly PathSegment[])[];
}>;

export type RecordBindingPolicies = Readonly<Record<string, RecordContextPolicy | undefined>>;

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
  | 'generic-strict-prefix-not-allowed'
  | 'exact-whole-record-not-allowed';

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
  policies?: RecordBindingPolicies;
  usage: RecordBindingUsage;
}>;

type RecordDescriptor = Readonly<{
  contextKey: string;
  contextLocation: readonly PathSegment[];
  params: RecordParams;
  prefix: readonly PathSegment[];
  varName: string;
}>;

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

function sameSegments(left: readonly PathSegment[], right: readonly PathSegment[]) {
  return left.length === right.length && startsWithSegments(left, right);
}

function cloneRecordParams(params: RecordParams): RecordParams {
  return Object.freeze({
    ...params,
    ...(Array.isArray(params.fields) ? { fields: Object.freeze([...params.fields]) as string[] } : {}),
    ...(Array.isArray(params.appends) ? { appends: Object.freeze([...params.appends]) as string[] } : {}),
  });
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
    if (isRecordParams(value)) {
      descriptors.push({
        contextKey,
        contextLocation: Object.freeze([...contextLocation]),
        params: cloneRecordParams(value),
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

function exactPathAllowed(prefix: readonly PathSegment[], policy?: RecordContextPolicy) {
  return policy?.exactWholeRecordPaths?.some((path) => sameSegments(path, prefix)) === true;
}

export function planRecordBindings(options: PlanRecordBindingsOptions): RecordBindingPlan {
  const mode = options.mode ?? 'strict';
  const { contextParams, descriptors } = collectDescriptorsAndContextParams(options.contextParams ?? {});
  const bindings: AuthorizedRecordBinding[] = [];
  const rejections: RecordBindingRejection[] = [];

  for (const descriptor of descriptors) {
    const usedPaths = (options.usage[descriptor.varName] ?? []).map((ref) => ref.runtimeSegments);
    const matchedPaths = usedPaths.filter((path) => startsWithSegments(path, descriptor.prefix));
    if (!matchedPaths.length) continue;

    const reject = (reason: RecordBindingRejectionReason) => {
      rejections.push(
        Object.freeze({
          reason,
          varName: descriptor.varName,
          prefix: descriptor.prefix,
          contextKey: descriptor.contextKey,
          contextLocation: descriptor.contextLocation,
        }),
      );
    };

    if (isProtectedServerContextKey(descriptor.varName)) {
      reject('protected-context-root');
      continue;
    }
    if (descriptor.prefix.some((segment) => typeof segment === 'string' && blockedBindingSegments.has(segment))) {
      reject('protected-context-key');
      continue;
    }

    const exactMatch = matchedPaths.some((path) => path.length === descriptor.prefix.length);
    const policy = options.policies?.[descriptor.varName];
    if (mode === 'strict' && exactMatch && !exactPathAllowed(descriptor.prefix, policy)) {
      reject('exact-whole-record-not-allowed');
      continue;
    }
    if (mode === 'strict' && !exactMatch && policy?.allowGenericStrictPrefix === false) {
      reject('generic-strict-prefix-not-allowed');
      continue;
    }

    const relativePaths = matchedPaths.map((path) => Object.freeze(path.slice(descriptor.prefix.length)));
    bindings.push(
      Object.freeze({
        params: descriptor.params,
        varName: descriptor.varName,
        prefix: descriptor.prefix,
        relativePaths: Object.freeze(relativePaths),
        preferFullRecord: exactMatch,
        contextKey: descriptor.contextKey,
        contextLocation: descriptor.contextLocation,
      }),
    );
  }

  return Object.freeze({
    bindings: Object.freeze(bindings),
    contextParams,
    rejections: Object.freeze(rejections),
  });
}
