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

/**
 * A check another plugin adds. Its results are sent with their authored `title`, `detail` and `fix`; `params` are
 * dropped, because only the built-in checks' translations interpolate them.
 */
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
 * The public fields of extension data, declared field by field: `'string'`, `'number'` or `'boolean'` for a value, an
 * object of declarations for a nested object, and a one-element array for a list of the declared element. There is no
 * open record or unknown value, so nothing reaches the response that a field here does not name.
 */
export type DistributedDataFields =
  | 'string'
  | 'number'
  | 'boolean'
  | { readonly [field: string]: DistributedDataFields }
  | readonly [DistributedDataFields];

/**
 * Data a plugin adds under `extensions[key]`. `read()` may return a runtime object; the server copies only what
 * `fields` declares, value by value, and drops a value whose type does not match.
 */
export interface DistributedData {
  readonly fields: { readonly [field: string]: DistributedDataFields };
  /** May return a promise; the resolved value is projected onto `fields`. */
  read(context: DistributedStatusContext): unknown;
}

/** Copies `value` onto `fields`: declared keys only, at every depth; `undefined` where the type does not match. */
export function projectDistributedData(
  fields: DistributedDataFields,
  value: unknown,
): unknown {
  if (fields === 'string' || fields === 'number' || fields === 'boolean')
    return typeof value === fields &&
      (fields !== 'number' || Number.isFinite(value))
      ? value
      : undefined;
  if (Array.isArray(fields)) {
    if (!Array.isArray(value)) return undefined;
    const element = (fields as readonly [DistributedDataFields])[0];
    return value
      .map((item) => projectDistributedData(element, item))
      .filter((item) => item !== undefined);
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return undefined;
  const projected: Record<string, unknown> = {};
  for (const [field, declaration] of Object.entries(
    fields as Readonly<Record<string, DistributedDataFields>>,
  )) {
    if (!Object.hasOwn(value, field)) continue;
    const item = projectDistributedData(
      declaration,
      (value as Record<string, unknown>)[field],
    );
    if (item !== undefined) projected[field] = item;
  }
  return projected;
}

function assertFields(key: string, fields: unknown, path = 'fields'): void {
  const fail = (): never => {
    throw new TypeError(
      `Distributed status data "${key}" declares an invalid ${path}: use 'string', 'number', 'boolean', an object or a one-element array.`,
    );
  };
  if (fields === 'string' || fields === 'number' || fields === 'boolean')
    return;
  if (Array.isArray(fields)) {
    if (fields.length !== 1) fail();
    assertFields(key, fields[0], `${path}[0]`);
    return;
  }
  if (typeof fields !== 'object' || fields === null) fail();
  for (const [field, declaration] of Object.entries(fields as object))
    assertFields(key, declaration, `${path}.${field}`);
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
   * `data.fields` declares are sent.
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
      if (
        typeof entry.fields !== 'object' ||
        entry.fields === null ||
        Array.isArray(entry.fields)
      )
        throw new TypeError(
          `Distributed status data "${key}" needs an object of the public fields it sends.`,
        );
      assertFields(key, entry.fields);
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
