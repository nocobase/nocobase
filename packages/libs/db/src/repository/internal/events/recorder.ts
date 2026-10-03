import type { RowChange, RowChangeKind } from '../../events/types.js';

interface RecordedRow {
  readonly collection: string;
  kind: RowChangeKind;
  readonly key: Readonly<Record<string, unknown>>;
  fields?: Set<string>;
  values?: Record<string, unknown>;
}

/**
 * The rows one Repository call wrote.
 *
 * A call can write the same row more than once, for example a nested update
 * followed by an optimistic lock increment, and reports it once: a created
 * row stays created, an updated row unites the fields of every write, and a
 * row created and then deleted within the call disappears.
 */
export class MutationRecorder {
  private readonly rows = new Map<string, RecordedRow>();
  /** Rows of one bulk statement, distinct by construction and never merged. */
  private readonly bulk: RowChange[] = [];

  /** @param withValues Whether any subscription asked for written values. */
  constructor(readonly withValues: boolean) {}

  record(change: RowChange): void {
    const id = `${change.collection}\u0000${keyIdentity(change.key)}`;
    const existing = this.rows.get(id);
    if (!existing) {
      this.rows.set(id, {
        collection: change.collection,
        kind: change.kind,
        key: change.key,
        fields: change.fields ? new Set(change.fields) : undefined,
        values:
          this.withValues && change.values ? { ...change.values } : undefined,
      });
      return;
    }
    if (change.kind === 'deleted') {
      if (existing.kind === 'created') {
        this.rows.delete(id);
        return;
      }
      existing.kind = 'deleted';
      existing.fields = undefined;
      existing.values = undefined;
      return;
    }
    if (existing.kind === 'deleted') {
      // Deleted and written again under the same key within one call.
      existing.kind = change.kind === 'created' ? 'created' : 'updated';
      existing.fields = new Set(change.fields);
      existing.values =
        this.withValues && change.values ? { ...change.values } : undefined;
      return;
    }
    existing.fields ??= new Set();
    for (const field of change.fields ?? []) existing.fields.add(field);
    if (this.withValues && change.values) {
      existing.values = { ...existing.values, ...change.values };
    }
  }

  /** Rows one bulk statement wrote; the caller guarantees they are distinct. */
  recordBulk(changes: readonly RowChange[]): void {
    for (const change of changes) {
      this.bulk.push(
        this.withValues || !change.values
          ? change
          : { ...change, values: undefined },
      );
    }
  }

  /** A recorder for an adapter-level savepoint, merged only if the savepoint is released. */
  child(): MutationRecorder {
    return new MutationRecorder(this.withValues);
  }

  absorb(child: MutationRecorder): void {
    for (const change of child.changes) this.record(change);
  }

  get changes(): RowChange[] {
    const changes: RowChange[] = [];
    for (const row of this.rows.values()) {
      changes.push({
        collection: row.collection,
        kind: row.kind,
        key: row.key,
        ...(row.fields ? { fields: [...row.fields] } : {}),
        ...(row.values ? { values: row.values } : {}),
      });
    }
    for (const change of this.bulk) {
      changes.push(
        change.values === undefined
          ? {
              collection: change.collection,
              kind: change.kind,
              key: change.key,
              ...(change.fields ? { fields: change.fields } : {}),
            }
          : change,
      );
    }
    return changes;
  }
}

function keyIdentity(key: Readonly<Record<string, unknown>>): string {
  return Object.keys(key)
    .sort()
    .map((field) => `${field}=${valueIdentity(key[field])}`)
    .join('\u0001');
}

/**
 * Keys reach the recorder from several paths, a decoded record on one and a
 * selector on another, so a number and its string form name the same row.
 */
function valueIdentity(value: unknown): string {
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'bigint':
    case 'boolean':
      return `:${value}`;
    case 'undefined':
      return 'undefined';
    default:
      if (value === null) return 'null';
      if (value instanceof Date) return `:${value.toISOString()}`;
      return `:${JSON.stringify(value)}`;
  }
}
