/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import type { Application } from '@nocobase/server';
import type { PathSegment, VariablePathRef } from '../template/variable-expression';

type MaybePromise<T> = T | Promise<T>;

export type RecordSlotResolved = Readonly<{
  status: 'resolved';
  slot: readonly PathSegment[];
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
  return Object.freeze({ status: 'resolved', slot: Object.freeze([...result.slot]) });
}

function sameResolved(left: RecordSlotResolved, right: RecordSlotResolved) {
  return left.slot.length === right.slot.length && left.slot.every((segment, index) => segment === right.slot[index]);
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
  }>,
): RecordSlotResolverRegistration {
  return Object.freeze({
    owner: registration.owner,
    id: registration.id,
    match: (path) => path.varName === registration.varName && path.runtimeSegments[0] === 'record',
    resolve: () => ({ status: 'resolved' as const, slot: ['record'] }),
  });
}
