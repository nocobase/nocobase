import type { ServiceResolver } from '@nocobase/service-provider';
import type { z } from 'zod';
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

/**
 * Data a plugin adds under `extensions[key]`. `read()` may return a runtime object; only what `schema` declares
 * reaches the response, so declare public fields only, with `z.object` (which drops undeclared keys) rather than
 * `z.looseObject`, `z.record` or `z.unknown`. A value that does not match is left out and logged.
 */
export interface DistributedData {
  readonly schema: z.ZodType;
  /** May return a promise; the resolved value is parsed through `schema`. */
  read(context: DistributedStatusContext): unknown;
}

/**
 * Where other plugins extend the status page. Resolve it in `boot()` after checking `container.has()`, so the plugin
 * still works in an application without this one.
 */
export interface DistributedStatusRegistry {
  /** Adds a check whose results join the built-in ones; returns a function that removes it. */
  addCheck(check: DistributedCheck): () => void;
  /**
   * Adds data under `extensions[key]` of the status, for a client block to render; returns a remover. Only the fields
   * `data.schema` declares are sent.
   */
  addData(key: string, data: DistributedData): () => void;
  checks(): readonly DistributedCheck[];
  data(): ReadonlyMap<string, DistributedData>;
}

export function createDistributedStatusRegistry(): DistributedStatusRegistry {
  const checks = new Map<string, DistributedCheck>();
  const data = new Map<string, DistributedData>();
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
    addData(key, entry) {
      assertId('data key', key);
      if (typeof entry?.read !== 'function')
        throw new TypeError(`Distributed status data "${key}" needs read().`);
      if (typeof entry.schema?.safeParse !== 'function')
        throw new TypeError(
          `Distributed status data "${key}" needs a zod schema of its public fields.`,
        );
      if (data.has(key))
        throw new Error(
          `Distributed status data "${key}" is already registered.`,
        );
      data.set(key, entry);
      return () => {
        if (data.get(key) === entry) data.delete(key);
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
