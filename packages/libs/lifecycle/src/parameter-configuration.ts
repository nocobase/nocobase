import { createHash } from 'node:crypto';

import type { LifecycleStore } from './store.js';
import type { JsonObject, JsonValue, LifecycleRecord } from './types.js';

export type ParameterReadMode = 'snapshot' | 'live';
export interface ParameterBinding {
  readonly state?: string;
  readonly transition?: string;
}
export interface ReviewerSelection {
  readonly group: number;
  readonly type: string;
  readonly referenceId: string;
}
export interface ConfigurableParameter {
  readonly type: 'number' | 'string' | 'boolean' | 'object' | 'reviewers';
  readonly title: string;
  readonly readMode?: ParameterReadMode;
  readonly bindings?: readonly ParameterBinding[];
  readonly minimum?: number;
  readonly maximum?: number;
  /** Validates and normalizes the complete value, including object members. */
  readonly parse: (value: unknown) => JsonValue;
}
export interface ParameterGroup {
  readonly key: string;
  readonly title: string;
  readonly schemaVersion: number;
  readonly fields: Readonly<Record<string, ConfigurableParameter>>;
  /** Cross-field validation over the complete version. */
  readonly validate?: (values: JsonObject) => void;
  /** Fields whose joint constraint requires the same effective reading mode. */
  readonly sameReadMode?: readonly (readonly string[])[];
}
export interface ParameterConfigurationDefinition {
  readonly readMode?: ParameterReadMode;
  readonly snapshotTransition?: string;
  readonly groups: readonly ParameterGroup[];
}
export interface ParameterSource {
  readonly group: string;
  readonly revision: number;
  readonly schemaVersion: number;
  readonly origin: 'default' | 'configuration';
  readonly readMode: ParameterReadMode;
}
export interface ParameterResolution {
  readonly scope: string;
  readonly values: JsonObject;
  readonly sources: Readonly<Record<string, ParameterSource>>;
}
export interface ParameterSnapshot extends ParameterResolution {
  readonly lifecycle: string;
  readonly recordId: string;
  readonly at: string;
}
export interface ParameterVersion {
  readonly scope: string;
  readonly group: string;
  readonly revision: number;
  readonly schemaVersion: number;
  readonly values: JsonObject;
  readonly actorId: string;
  readonly at: string;
}
export interface ParameterUsage extends ParameterResolution {
  readonly lifecycle: string;
  readonly recordId: string;
  readonly kind: 'transition' | 'action' | 'effect';
  readonly associationId: string;
  readonly attempt?: number;
  readonly at: string;
}
export interface SaveParameterVersion {
  readonly scope: string;
  readonly group: ParameterGroup;
  readonly values: JsonObject;
  readonly expectedRevision: number;
  readonly requestId: string;
  readonly actorId: string;
  readonly at: string;
}
export type ParameterConfigurationErrorCode =
  | 'CONFIGURATION_CONFLICT'
  | 'CONFIGURATION_INVALID'
  | 'CONFIGURATION_INCOMPATIBLE'
  | 'CONFIGURATION_REQUEST_REUSED'
  | 'PARAMETER_SNAPSHOT_REQUIRED'
  | 'PARAMETER_ATTEMPT_STALE';
export class ParameterConfigurationError extends Error {
  public constructor(
    public readonly code: ParameterConfigurationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ParameterConfigurationError';
  }
}
/** Optional capability: unconfigured runtimes never require these collections. */
export interface LifecycleParameterStore {
  read(
    scope: string,
    group: string,
    transaction?: unknown,
  ): Promise<ParameterVersion | undefined>;
  save(
    input: SaveParameterVersion,
    transaction?: unknown,
  ): Promise<ParameterVersion>;
  snapshot(
    scope: string,
    lifecycle: string,
    recordId: string,
    transaction?: unknown,
  ): Promise<ParameterSnapshot | undefined>;
  saveSnapshot(
    snapshot: ParameterSnapshot,
    transaction: unknown,
  ): Promise<void>;
  usage(
    lifecycle: string,
    kind: ParameterUsage['kind'],
    associationId: string,
    attempt?: number,
    transaction?: unknown,
  ): Promise<ParameterUsage | undefined>;
  saveUsage(usage: ParameterUsage, transaction?: unknown): Promise<void>;
  listUsage(
    scope: string,
    lifecycle: string,
    recordId: string,
    transaction?: unknown,
  ): Promise<readonly ParameterUsage[]>;
}
export const LIFECYCLE_PARAMETER_COLLECTIONS: Readonly<
  Record<
    'heads' | 'versions' | 'selections' | 'requests' | 'snapshots' | 'usages',
    string
  >
> = Object.freeze({
  heads: 'lifecycleParameterHeads',
  versions: 'lifecycleParameterVersions',
  selections: 'lifecycleParameterSelections',
  requests: 'lifecycleParameterRequests',
  snapshots: 'lifecycleParameterSnapshots',
  usages: 'lifecycleParameterUsages',
});
export function parameterIdentity(
  ...parts: readonly (string | number)[]
): string {
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}
function invalid(message: string): never {
  throw new ParameterConfigurationError('CONFIGURATION_INVALID', message);
}
function assertJsonValue(
  value: unknown,
  parents: Set<object> = new Set(),
): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (
    typeof value !== 'object' ||
    !value ||
    parents.has(value) ||
    (!Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  )
    invalid('Parameter schemas must return finite, acyclic JSON values.');
  parents.add(value);
  for (const child of Array.isArray(value) ? value : Object.values(value))
    assertJsonValue(child, parents);
  parents.delete(value);
}
export function normalizeParameterValues(
  group: ParameterGroup,
  values: JsonObject,
): JsonObject {
  for (const key of Object.keys(values))
    if (!Object.hasOwn(group.fields, key))
      invalid(`Unknown configurable parameter "${key}".`);
  const normalized: JsonObject = {};
  for (const [key, field] of Object.entries(group.fields)) {
    if (!Object.hasOwn(values, key))
      invalid(`Missing configurable parameter "${key}".`);
    try {
      const parsed = field.parse(values[key]);
      assertJsonValue(parsed);
      normalized[key] = structuredClone(parsed);
    } catch (error) {
      invalid(
        `Invalid parameter "${key}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  try {
    group.validate?.(normalized);
  } catch (error) {
    invalid(error instanceof Error ? error.message : String(error));
  }
  return normalized;
}
function canonical(value: JsonValue): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
    .join(',')}}`;
}
function stored<T>(record: LifecycleRecord | undefined): T | undefined {
  return record ? (structuredClone(record.payload) as T) : undefined;
}
function isUniqueConflict(error: unknown): boolean {
  const seen = new Set<object>();
  let current = error;
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    const item = current as Record<string, unknown>;
    const number = item.errno ?? item.number ?? item.errorNum;
    if (
      [
        '23505',
        'ER_DUP_ENTRY',
        'SQLITE_CONSTRAINT',
        'SQLITE_CONSTRAINT_UNIQUE',
        'SQLITE_CONSTRAINT_PRIMARYKEY',
      ].includes(typeof item.code === 'string' ? item.code : '') ||
      [1, 1062, 2601, 2627].includes(Number(number)) ||
      item.errCode === -6602
    )
      return true;
    current = item.cause ?? item.originalError;
  }
  return false;
}
/** The same transactional adapter works with Memory and Repository LifecycleStores. */
export class StoredLifecycleParameters implements LifecycleParameterStore {
  public constructor(
    private readonly store: LifecycleStore,
    private readonly collections: typeof LIFECYCLE_PARAMETER_COLLECTIONS = LIFECYCLE_PARAMETER_COLLECTIONS,
  ) {}
  private transaction<R>(
    handle: unknown,
    work: (store: LifecycleStore) => Promise<R>,
  ): Promise<R> {
    return this.store.transaction(
      work,
      handle === undefined ? undefined : { within: handle },
    );
  }
  private async version(
    store: LifecycleStore,
    scope: string,
    group: string,
    revision: number,
  ): Promise<ParameterVersion | undefined> {
    const row = await store.findRecord(
      this.collections.versions,
      parameterIdentity(scope, group, revision),
    );
    const version = stored<ParameterVersion>(row);
    if (!version) return undefined;
    if (
      version.scope !== scope ||
      version.group !== group ||
      version.revision !== revision
    )
      throw new ParameterConfigurationError(
        'CONFIGURATION_INCOMPATIBLE',
        'Configuration version metadata does not match its identity.',
      );
    const counts = (row?.selectionCounts ?? {}) as Record<string, number>;
    const values = { ...version.values };
    for (const [field, count] of Object.entries(counts)) {
      if (!Number.isSafeInteger(count) || count < 1 || count > 100)
        throw new ParameterConfigurationError(
          'CONFIGURATION_INCOMPATIBLE',
          'The stored reviewer selection count is invalid.',
        );
      const selections: JsonValue[] = [];
      for (let index = 0; index < count; index++) {
        const selection = await store.findRecord(
          this.collections.selections,
          parameterIdentity(scope, group, revision, field, index),
        );
        if (!selection)
          throw new ParameterConfigurationError(
            'CONFIGURATION_INCOMPATIBLE',
            'A referenced rule selection no longer exists.',
          );
        selections.push({
          group: Number(selection.group),
          type: String(selection.type),
          referenceId: String(selection.referenceId),
        });
      }
      values[field] = selections;
    }
    return { ...version, values };
  }
  public read(
    scope: string,
    group: string,
    transaction?: unknown,
  ): Promise<ParameterVersion | undefined> {
    return this.transaction(transaction, async (store) => {
      const head = await store.findRecord(
        this.collections.heads,
        parameterIdentity(scope, group),
      );
      if (!head) return undefined;
      const version = await this.version(
        store,
        scope,
        group,
        Number(head.revision),
      );
      if (!version)
        throw new ParameterConfigurationError(
          'CONFIGURATION_INCOMPATIBLE',
          'The current configuration version no longer exists.',
        );
      return version;
    });
  }
  public async save(
    input: SaveParameterVersion,
    transaction?: unknown,
  ): Promise<ParameterVersion> {
    const values = normalizeParameterValues(input.group, input.values);
    if (
      !input.scope ||
      !input.requestId ||
      !input.actorId ||
      !Number.isSafeInteger(input.expectedRevision) ||
      input.expectedRevision < 0
    )
      invalid(
        'Configuration saves require a scope, actor, request ID and non-negative expected revision.',
      );
    const requestKey = parameterIdentity(
      input.scope,
      input.group.key,
      input.requestId,
    );
    const fingerprint = canonical(values);
    return this.transaction(transaction, async (store) => {
      const request = await store.findRecord(
        this.collections.requests,
        requestKey,
      );
      if (request) {
        if (
          request.actorId !== input.actorId ||
          request.fingerprint !== fingerprint
        )
          throw new ParameterConfigurationError(
            'CONFIGURATION_REQUEST_REUSED',
            'The configuration request ID was already used with different input or actor.',
          );
        const previous = await this.version(
          store,
          input.scope,
          input.group.key,
          Number(request.revision),
        );
        if (!previous)
          throw new ParameterConfigurationError(
            'CONFIGURATION_INCOMPATIBLE',
            'The requested version no longer exists.',
          );
        return previous;
      }
      const id = parameterIdentity(input.scope, input.group.key);
      const head = await store.findRecord(this.collections.heads, id);
      if (!head) {
        if (input.expectedRevision !== 0)
          throw new ParameterConfigurationError(
            'CONFIGURATION_CONFLICT',
            'The configuration revision changed.',
          );
        try {
          // A savepoint keeps a concurrent first-head insert from aborting a
          // PostgreSQL business transaction before we report the CAS conflict.
          await store.transaction(
            async (nested) => {
              await nested.createRecord(this.collections.heads, {
                id,
                scope: input.scope,
                groupKey: input.group.key,
                status: 'current',
                revision: 0,
              });
            },
            { within: store.transactionHandle },
          );
        } catch (error) {
          if (
            isUniqueConflict(error) ||
            (await store.findRecord(this.collections.heads, id))
          )
            throw new ParameterConfigurationError(
              'CONFIGURATION_CONFLICT',
              'The configuration revision changed.',
            );
          throw error;
        }
      }
      const revision = input.expectedRevision + 1;
      if (
        !(await store.updateRecordIf(
          this.collections.heads,
          id,
          {
            stateField: 'status',
            state: 'current',
            versionField: 'revision',
            version: input.expectedRevision,
          },
          { revision },
        ))
      )
        throw new ParameterConfigurationError(
          'CONFIGURATION_CONFLICT',
          'The configuration revision changed.',
        );
      const storedValues = { ...values };
      const selectionCounts: Record<string, number> = {};
      for (const [field, definition] of Object.entries(input.group.fields))
        if (definition.type === 'reviewers') {
          const selections = values[field] as JsonObject[];
          selectionCounts[field] = selections.length;
          delete storedValues[field];
          for (const [index, selection] of selections.entries())
            await store.createRecord(this.collections.selections, {
              id: parameterIdentity(
                input.scope,
                input.group.key,
                revision,
                field,
                index,
              ),
              versionId: parameterIdentity(
                input.scope,
                input.group.key,
                revision,
              ),
              ruleKey: field,
              group: selection.group,
              type: selection.type,
              referenceId: selection.referenceId,
            });
        }
      const version: ParameterVersion = {
        scope: input.scope,
        group: input.group.key,
        revision,
        schemaVersion: input.group.schemaVersion,
        values,
        actorId: input.actorId,
        at: input.at,
      };
      await store.createRecord(this.collections.versions, {
        id: parameterIdentity(input.scope, input.group.key, revision),
        payload: { ...version, values: storedValues },
        selectionCounts,
      });
      await store.createRecord(this.collections.requests, {
        id: requestKey,
        actorId: input.actorId,
        fingerprint,
        revision,
      });
      return version;
    });
  }
  public snapshot(
    scope: string,
    lifecycle: string,
    recordId: string,
    transaction?: unknown,
  ): Promise<ParameterSnapshot | undefined> {
    return this.transaction(transaction, async (store) =>
      stored<ParameterSnapshot>(
        await store.findRecord(
          this.collections.snapshots,
          parameterIdentity(scope, lifecycle, recordId),
        ),
      ),
    );
  }
  public saveSnapshot(
    snapshot: ParameterSnapshot,
    transaction: unknown,
  ): Promise<void> {
    if (transaction === undefined)
      throw new Error(
        'A parameter snapshot must join the business transaction.',
      );
    return this.transaction(transaction, async (store) => {
      const id = parameterIdentity(
        snapshot.scope,
        snapshot.lifecycle,
        snapshot.recordId,
      );
      const existing = stored<ParameterSnapshot>(
        await store.findRecord(this.collections.snapshots, id),
      );
      if (existing) {
        if (canonical(existing.values) !== canonical(snapshot.values))
          throw new ParameterConfigurationError(
            'CONFIGURATION_CONFLICT',
            'A record snapshot is immutable.',
          );
        return;
      }
      await store.createRecord(this.collections.snapshots, {
        id,
        payload: snapshot,
      });
    });
  }
  public usage(
    lifecycle: string,
    kind: ParameterUsage['kind'],
    associationId: string,
    attempt: number = 0,
    transaction?: unknown,
  ): Promise<ParameterUsage | undefined> {
    return this.transaction(transaction, async (store) =>
      stored<ParameterUsage>(
        await store.findRecord(
          this.collections.usages,
          parameterIdentity(lifecycle, kind, associationId, attempt),
        ),
      ),
    );
  }
  public listUsage(
    scope: string,
    lifecycle: string,
    recordId: string,
    transaction?: unknown,
  ): Promise<readonly ParameterUsage[]> {
    return this.transaction(transaction, async (store) => {
      // LifecycleStore's idle cursor advances non-numeric IDs by timestamp
      // only. Grow the bounded read instead so facts sharing an instant are
      // never lost at a page boundary.
      let limit = 100;
      for (;;) {
        const rows = await store.findIdleRecords(this.collections.usages, {
          stateField: 'recordKey',
          states: [parameterIdentity(scope, lifecycle, recordId)],
          changedAtField: 'at',
          changedBefore: '9999-12-31T23:59:59.999Z',
          limit,
        });
        if (rows.length < limit)
          return rows.map((row) => stored<ParameterUsage>(row)!);
        limit *= 2;
      }
    });
  }
  public saveUsage(
    usage: ParameterUsage,
    transaction?: unknown,
  ): Promise<void> {
    return this.transaction(transaction, async (store) => {
      if (
        usage.kind === 'effect' &&
        !(await store.updateEffectRun(
          usage.associationId,
          { status: 'running', attempts: usage.attempt },
          { status: 'running' },
        ))
      )
        throw new ParameterConfigurationError(
          'PARAMETER_ATTEMPT_STALE',
          'The effect attempt no longer owns the run.',
        );
      const id = parameterIdentity(
        usage.lifecycle,
        usage.kind,
        usage.associationId,
        usage.attempt ?? 0,
      );
      const existing = stored<ParameterUsage>(
        await store.findRecord(this.collections.usages, id),
      );
      if (existing) {
        if (canonical(existing.values) !== canonical(usage.values))
          throw new ParameterConfigurationError(
            'CONFIGURATION_CONFLICT',
            'A parameter usage fact is immutable.',
          );
        return;
      }
      await store.createRecord(this.collections.usages, {
        id,
        payload: usage,
        recordKey: parameterIdentity(
          usage.scope,
          usage.lifecycle,
          usage.recordId,
        ),
        at: usage.at,
      });
    });
  }
}
