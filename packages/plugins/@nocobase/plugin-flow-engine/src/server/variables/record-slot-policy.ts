/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import type { AnalyzedTemplate } from '../template/variable-expression';
import {
  getRecordSlotResolverRegistry,
  type RecordSlotResolved,
  type RecordSlotResolverInput,
  type RecordSlotResolverRegistration,
} from './record-slot-resolvers';

export type RecordSlotPolicy = RecordSlotResolved;
export type RecordSlotPolicies = ReadonlyMap<string, RecordSlotPolicy>;

export type FlowModelVariableContract = Readonly<{
  allowedPaths: ReadonlySet<string>;
  recordSlots: RecordSlotPolicies;
}>;

export type CompileRecordSlotPoliciesOptions = Omit<RecordSlotResolverInput, 'path'> & Readonly<{ app: Application }>;

type FlowModelOptions = Readonly<{
  stepParams?: unknown;
}>;

type ResourceTarget = Readonly<{
  associationName?: string;
  collection: string;
  dataSourceKey: string;
}>;

type FixedResourceTarget = Readonly<{
  collection: string;
  dataSourceKey: string;
  kind: 'fixed';
}>;

function resolved(slot: readonly (string | number)[]) {
  return { status: 'resolved' as const, slot };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getModelOptions(value: unknown): FlowModelOptions | undefined {
  if (!isObject(value)) return undefined;
  return (isObject(value.options) ? value.options : value) as FlowModelOptions;
}

function getStepInit(options: FlowModelOptions, flowKey: string) {
  if (!isObject(options.stepParams)) return undefined;
  const step = options.stepParams[flowKey];
  return isObject(step) && isObject(step.init) ? step.init : undefined;
}

function getResourceTarget(options: FlowModelOptions): ResourceTarget | undefined {
  const init = getStepInit(options, 'resourceSettings');
  const collection = typeof init?.collectionName === 'string' ? init.collectionName.trim() : '';
  const dataSourceKey = typeof init?.dataSourceKey === 'string' ? init.dataSourceKey.trim() : 'main';
  const associationName = typeof init?.associationName === 'string' ? init.associationName.trim() : undefined;
  if (!collection || !dataSourceKey || (typeof init?.associationName === 'string' && !associationName))
    return undefined;
  return { collection, dataSourceKey, ...(associationName ? { associationName } : {}) };
}

async function getLineage(input: RecordSlotResolverInput) {
  const ancestors = input.loadAncestors ? await input.loadAncestors() : [];
  return [input.currentNode, ...ancestors].filter((node): node is unknown => !!node);
}

function toFixedTarget(input: RecordSlotResolverInput, target: ResourceTarget): FixedResourceTarget | undefined {
  if (target.associationName) {
    const segments = target.associationName.split('.').filter(Boolean);
    const collection = segments.length > 1 ? segments.shift() : target.collection;
    const fieldPath = segments.join('.') || target.associationName;
    return resolveAssociationTarget(input, { collection, dataSourceKey: target.dataSourceKey }, fieldPath);
  }
  if (!input.getCollection?.(target.dataSourceKey, target.collection)) return undefined;
  return { kind: 'fixed', collection: target.collection, dataSourceKey: target.dataSourceKey };
}

async function resolveNearestResourceTarget(input: RecordSlotResolverInput) {
  for (const node of await getLineage(input)) {
    const options = getModelOptions(node);
    const resource = options && getResourceTarget(options);
    const target = resource && toFixedTarget(input, resource);
    if (target) return target;
  }
  return undefined;
}

function callMethod(target: unknown, name: string, ...args: unknown[]) {
  if (!isObject(target) || typeof target[name] !== 'function') return undefined;
  return (target[name] as (...methodArgs: unknown[]) => unknown).apply(target, args);
}

function readString(target: unknown, key: string) {
  if (!isObject(target)) return undefined;
  const direct = target[key];
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const options = target.options;
  const nested = isObject(options) ? options[key] : undefined;
  return typeof nested === 'string' && nested.trim() ? nested.trim() : undefined;
}

function resolveAssociationTarget(
  input: RecordSlotResolverInput,
  resource: ResourceTarget,
  fieldPath: string,
): FixedResourceTarget | undefined {
  let dataSourceKey = resource.dataSourceKey;
  let collection = input.getCollection?.(dataSourceKey, resource.collection);
  const segments = fieldPath.split('.').filter(Boolean);
  for (let index = 0; index < segments.length; index++) {
    const field = callMethod(collection, 'getField', segments[index]);
    const association =
      callMethod(field, 'isAssociationField') === true || callMethod(field, 'isRelationField') === true;
    if (!association) return undefined;

    const rawTargetCollection = isObject(field) ? field.targetCollection : undefined;
    const targetCollection =
      typeof rawTargetCollection === 'function' ? rawTargetCollection.call(field) : rawTargetCollection;
    const targetName = readString(targetCollection, 'name') || readString(field, 'target');
    if (!targetName) return undefined;
    dataSourceKey = readString(targetCollection, 'dataSourceKey') || dataSourceKey;
    collection = targetCollection || input.getCollection?.(dataSourceKey, targetName);
    if (!collection) return undefined;
    if (index === segments.length - 1) {
      return { kind: 'fixed', collection: targetName, dataSourceKey };
    }
  }
  return undefined;
}

export function createBuiltInRecordSlotResolvers(): readonly RecordSlotResolverRegistration[] {
  return [
    ...['record', 'responseRecord', 'clickedRowRecord'].map(
      (varName): RecordSlotResolverRegistration => ({
        owner: '@nocobase/plugin-flow-engine',
        id: `direct:${varName}`,
        match: (path) => path.varName === varName,
        needsAncestors: true,
        resolve: async (input) => {
          const target = await resolveNearestResourceTarget(input);
          return target ? resolved([]) : { status: 'abstain' };
        },
      }),
    ),
    {
      owner: '@nocobase/plugin-flow-engine',
      id: 'view:record',
      match: (path) => path.varName === 'view' && path.runtimeSegments[0] === 'record',
      resolve: () => resolved(['record']),
    },
    {
      owner: '@nocobase/plugin-flow-engine',
      id: 'popup:record',
      match: (path) => {
        if (path.varName !== 'popup') return false;
        let index = 0;
        while (path.runtimeSegments[index] === 'parent') index += 1;
        return path.runtimeSegments[index] === 'record' || path.runtimeSegments[index] === 'sourceRecord';
      },
      resolve: ({ path }) => {
        let index = 0;
        while (path.runtimeSegments[index] === 'parent') index += 1;
        return resolved(path.runtimeSegments.slice(0, index + 1));
      },
    },
  ];
}

function samePolicy(left: RecordSlotPolicy, right: RecordSlotPolicy) {
  return left.slot.length === right.slot.length && left.slot.every((segment, index) => segment === right.slot[index]);
}

export async function compileRecordSlotPolicies(
  analysis: Pick<AnalyzedTemplate, 'paths'>,
  options: CompileRecordSlotPoliciesOptions,
): Promise<RecordSlotPolicies> {
  const registry = getRecordSlotResolverRegistry(options.app);
  const occurrences = new Map<string, Array<RecordSlotPolicy | undefined>>();
  for (const path of analysis.paths) {
    const policies = occurrences.get(path.canonicalKey) || [];
    policies.push(await registry.resolve({ ...options, path }));
    occurrences.set(path.canonicalKey, policies);
  }

  const result = new Map<string, RecordSlotPolicy>();
  for (const [canonicalKey, policies] of occurrences) {
    const first = policies[0];
    if (first && policies.every((policy) => !!policy && samePolicy(policy, first))) result.set(canonicalKey, first);
  }
  return result;
}

export async function createFlowModelVariableContract(
  analysis: AnalyzedTemplate,
  options: CompileRecordSlotPoliciesOptions,
): Promise<FlowModelVariableContract> {
  return Object.freeze({
    allowedPaths: new Set(analysis.paths.map((path) => path.canonicalKey)),
    recordSlots: await compileRecordSlotPolicies(analysis, options),
  });
}
