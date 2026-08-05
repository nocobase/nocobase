/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import type { ResourcerContext } from '@nocobase/resourcer';
import type { PathSegment, VariablePathRef } from '../template/variable-expression';
import type { RecordParams } from './records';

type MaybePromise<T> = T | Promise<T>;

export type RecordSlotFixedTarget = Readonly<{
  kind: 'fixed';
  dataSourceKey?: string;
  collection: string;
  associationName?: string;
}>;

export type RecordSlotTargetCapability = Readonly<{
  kind: 'capability';
  id: string;
  normalize: (ctx: ResourcerContext, params: Readonly<RecordParams>) => MaybePromise<RecordParams | undefined>;
}>;

export type RecordSlotTargetContract = RecordSlotFixedTarget | RecordSlotTargetCapability;

export type RecordSlotResolved = Readonly<{
  status: 'resolved';
  slot: readonly PathSegment[];
  target: RecordSlotTargetContract;
}>;

export type RecordSlotResolverResult = RecordSlotResolved | Readonly<{ status: 'deny' | 'abstain' }>;

export type RecordSlotResolverInput = Readonly<{
  path: VariablePathRef;
  currentNode?: unknown;
  loadAncestors?: () => Promise<readonly unknown[]>;
  ctx?: ResourcerContext;
  getCollection?: (dataSourceKey: string, collection: string) => unknown;
}>;

export type RecordSlotResolverRegistration = Readonly<{
  owner: string;
  id: string;
  needsAncestors?: boolean;
  match: (path: VariablePathRef) => boolean;
  resolve: (input: RecordSlotResolverInput) => MaybePromise<RecordSlotResolverResult>;
}>;

function normalizeTarget(target: RecordSlotTargetContract): RecordSlotTargetContract | undefined {
  if (target.kind === 'capability') {
    const id = target.id.trim();
    return id && typeof target.normalize === 'function'
      ? Object.freeze({ kind: 'capability', id, normalize: target.normalize })
      : undefined;
  }

  const dataSourceKey = (target.dataSourceKey || 'main').trim();
  const collection = target.collection.trim();
  const associationName = target.associationName?.trim();
  if (!dataSourceKey || !collection || (typeof target.associationName === 'string' && !associationName)) {
    return undefined;
  }
  return Object.freeze({
    kind: 'fixed',
    dataSourceKey,
    collection,
    ...(associationName ? { associationName } : {}),
  });
}

function normalizeResolved(result: RecordSlotResolverResult): RecordSlotResolved | undefined {
  if (result.status !== 'resolved' || !Array.isArray(result.slot)) return undefined;
  if (
    result.slot.some(
      (segment) =>
        (typeof segment !== 'string' && typeof segment !== 'number') ||
        (typeof segment === 'string' && segment.includes('*')) ||
        (typeof segment === 'number' && (!Number.isSafeInteger(segment) || segment < 0)),
    )
  ) {
    return undefined;
  }
  const target = normalizeTarget(result.target);
  return target ? Object.freeze({ status: 'resolved', slot: Object.freeze([...result.slot]), target }) : undefined;
}

export function sameRecordSlotTargetContract(left: RecordSlotTargetContract, right: RecordSlotTargetContract) {
  if (left.kind !== right.kind) return false;
  if (left.kind === 'capability' && right.kind === 'capability') {
    return left.id === right.id && left.normalize === right.normalize;
  }
  if (left.kind === 'fixed' && right.kind === 'fixed') {
    return (
      left.dataSourceKey === right.dataSourceKey &&
      left.collection === right.collection &&
      left.associationName === right.associationName
    );
  }
  return false;
}

function sameResolved(left: RecordSlotResolved, right: RecordSlotResolved) {
  return (
    left.slot.length === right.slot.length &&
    left.slot.every((segment, index) => segment === right.slot[index]) &&
    sameRecordSlotTargetContract(left.target, right.target)
  );
}

export class RecordSlotResolverRegistry {
  private readonly registrations = new Map<string, Map<string, RecordSlotResolverRegistration>>();

  has(owner: string, id: string) {
    return this.registrations.get(owner.trim())?.has(id.trim()) === true;
  }

  register(registration: RecordSlotResolverRegistration) {
    const owner = registration.owner.trim();
    const id = registration.id.trim();
    if (!owner || !id) throw new TypeError('Record Slot resolver owner and id are required');

    const entry = Object.freeze({ ...registration, owner, id });
    let owned = this.registrations.get(owner);
    if (!owned) {
      owned = new Map();
      this.registrations.set(owner, owned);
    }
    owned.set(id, entry);

    return () => {
      const current = this.registrations.get(owner);
      if (current?.get(id) !== entry) return;
      current.delete(id);
      if (!current.size) this.registrations.delete(owner);
    };
  }

  async resolve(input: RecordSlotResolverInput): Promise<RecordSlotResolved | undefined> {
    const resolutions: RecordSlotResolved[] = [];
    for (const owned of this.registrations.values()) {
      for (const registration of owned.values()) {
        try {
          if (!registration.match(input.path)) continue;
          const result = await registration.resolve(
            registration.needsAncestors ? input : { ...input, loadAncestors: undefined },
          );
          if (result.status === 'deny') return undefined;
          if (result.status === 'abstain') continue;
          const normalized = normalizeResolved(result);
          if (!normalized) return undefined;
          resolutions.push(normalized);
        } catch (_) {
          return undefined;
        }
      }
    }
    const first = resolutions[0];
    return first && resolutions.every((resolution) => sameResolved(resolution, first)) ? first : undefined;
  }
}

const registries = new WeakMap<Application, RecordSlotResolverRegistry>();

export function getRecordSlotResolverRegistry(app: Application) {
  let registry = registries.get(app);
  if (!registry) {
    registry = new RecordSlotResolverRegistry();
    registries.set(app, registry);
  }
  return registry;
}

export function createNestedRecordSlotResolver(
  registration: Readonly<{
    owner: string;
    id: string;
    varName: string;
    target: RecordSlotTargetContract;
  }>,
): RecordSlotResolverRegistration {
  return Object.freeze({
    owner: registration.owner,
    id: registration.id,
    match: (path) =>
      path.varName === registration.varName && path.runtimeSegments.length > 1 && path.runtimeSegments[0] === 'record',
    resolve: () => ({ status: 'resolved' as const, slot: ['record'], target: registration.target }),
  });
}

export async function normalizeRecordSlotTarget(
  target: RecordSlotTargetContract,
  ctx: ResourcerContext,
  params: Readonly<RecordParams>,
): Promise<RecordParams | undefined> {
  try {
    const contract = normalizeTarget(target);
    if (!contract) return undefined;
    if (contract.kind === 'capability') {
      const normalized = await contract.normalize(ctx, params);
      const dataSourceKey = (normalized?.dataSourceKey || 'main').trim();
      const collection = normalized?.collection.trim();
      const associationName = normalized?.associationName?.trim();
      if (
        !normalized ||
        !dataSourceKey ||
        !collection ||
        (typeof normalized.associationName === 'string' && !associationName)
      ) {
        return undefined;
      }
      return {
        ...normalized,
        dataSourceKey,
        collection,
        associationName,
      };
    }
    if (contract.associationName && typeof params.sourceId === 'undefined') return undefined;
    return {
      ...params,
      dataSourceKey: contract.dataSourceKey || 'main',
      collection: contract.collection,
      associationName: contract.associationName,
      sourceId: contract.associationName ? params.sourceId : undefined,
    };
  } catch (_) {
    return undefined;
  }
}
