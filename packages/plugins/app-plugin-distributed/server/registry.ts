import type { ServiceResolver } from '@nocobase/service-provider';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type {
  DistributedCheckResult,
  DistributedIdGeneration,
  DistributedService,
} from '../shared/types.js';

/** What a check or a data reader sees: the status assembled so far and the application's services. */
export interface DistributedStatusContext {
  readonly mode: 'single' | 'multi';
  readonly services: readonly DistributedService[];
  readonly idGeneration: DistributedIdGeneration;
  readonly container: ServiceResolver;
}

export interface DistributedCheck {
  /** Unique among registered checks. */
  readonly id: string;
  run(
    context: DistributedStatusContext,
  ):
    | readonly DistributedCheckResult[]
    | Promise<readonly DistributedCheckResult[]>;
}

/** Returns JSON for `extensions[key]`. It must not contain connection addresses, credentials or tokens. */
export type DistributedDataReader = (
  context: DistributedStatusContext,
) => unknown;

/**
 * Where other plugins extend the status page. Resolve it in `boot()` after checking `container.has()`, so the plugin
 * still works in an application without this one.
 */
export interface DistributedStatusRegistry {
  /** Adds a check whose results join the built-in ones; returns a function that removes it. */
  addCheck(check: DistributedCheck): () => void;
  /** Adds data under `extensions[key]` of the status, for a client block to render; returns a remover. */
  addData(key: string, read: DistributedDataReader): () => void;
  checks(): readonly DistributedCheck[];
  data(): ReadonlyMap<string, DistributedDataReader>;
}

export function createDistributedStatusRegistry(): DistributedStatusRegistry {
  const checks = new Map<string, DistributedCheck>();
  const data = new Map<string, DistributedDataReader>();
  const assertId = (kind: string, id: unknown): void => {
    if (typeof id !== 'string' || !id.trim())
      throw new TypeError(`A distributed status ${kind} needs a non-empty id.`);
  };
  return {
    addCheck(check) {
      assertId('check', check?.id);
      if (typeof check.run !== 'function')
        throw new TypeError(
          `Distributed status check "${check.id}" needs run().`,
        );
      if (checks.has(check.id))
        throw new Error(
          `Distributed status check "${check.id}" is already registered.`,
        );
      checks.set(check.id, check);
      return () => {
        if (checks.get(check.id) === check) checks.delete(check.id);
      };
    },
    addData(key, read) {
      assertId('data key', key);
      if (typeof read !== 'function')
        throw new TypeError(`Distributed status data "${key}" needs a reader.`);
      if (data.has(key))
        throw new Error(
          `Distributed status data "${key}" is already registered.`,
        );
      data.set(key, read);
      return () => {
        if (data.get(key) === read) data.delete(key);
      };
    },
    checks: () => [...checks.values()],
    data: () => new Map(data),
  };
}

export const distributedStatusToken: ServiceToken<DistributedStatusRegistry> =
  createServiceToken<DistributedStatusRegistry>(
    '@nocobase/app-plugin-distributed/status',
  );
