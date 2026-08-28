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

function resolved(slot: readonly (string | number)[]) {
  return { status: 'resolved' as const, slot };
}

export function createBuiltInRecordSlotResolvers(): readonly RecordSlotResolverRegistration[] {
  return [
    ...['record', 'responseRecord', 'clickedRowRecord'].map(
      (varName): RecordSlotResolverRegistration => ({
        owner: '@nocobase/plugin-flow-engine',
        id: `direct:${varName}`,
        match: (path) => path.varName === varName,
        resolve: () => resolved([]),
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
