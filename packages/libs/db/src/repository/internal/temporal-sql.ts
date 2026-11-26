import type { Knex } from 'knex';
import type { FieldDefinition } from '../../collection/types.js';
import { getDatabaseDriverRuntime } from '../../database/runtime.js';
import { RepositoryError } from '../errors.js';
import { isTemporalType, normalizeTemporalValue } from '../temporal.js';

export interface TemporalSqlClient {
  readonly client: Knex.Client;
  raw: Knex['raw'];
}

function assertPrecision(field: FieldDefinition): void {
  // DATE has no fractional-second component.  Some catalogs expose a
  // precision inherited from the database's temporal family, but that value
  // must not make ordinary date reads unusable.
  if (field.type !== 'date' && (field.fractionalSecondsPrecision ?? 3) > 3)
    throw new RepositoryError(
      'FIELD_CAPABILITY_NOT_SUPPORTED',
      `Field "${field.name}" exceeds V1 millisecond precision.`,
      { field: field.name },
    );
}

export function temporalBinding(
  client: TemporalSqlClient,
  field: FieldDefinition,
  value: unknown,
): Knex.Raw | string | null {
  assertPrecision(field);
  const normalized = normalizeTemporalValue(field, value);
  if (normalized === null) return null;
  const precision = field.fractionalSecondsPrecision ?? 3;
  const fraction = normalized.match(/\.(\d{3})/)?.[1];
  if (fraction && /[1-9]/.test(fraction.slice(precision)))
    throw new RepositoryError(
      'INVALID_MUTATION',
      `Value exceeds Field "${field.name}" fractional-second precision.`,
      { field: field.name },
    );
  const strategy =
    getDatabaseDriverRuntime(client as unknown as Knex)?.repository
      ?.temporalBinding ??
    getDatabaseDriverRuntime(
      (client as unknown as { client?: Knex }).client as Knex,
    )?.repository?.temporalBinding;
  if (strategy)
    return strategy({ client: client as Knex, field, value: normalized });
  return normalized;
}

/** Format at the database boundary so driver Date parsing cannot apply a host zone. */
export function temporalProjection(
  client: Knex,
  field: FieldDefinition | undefined,
  reference: string | Knex.Raw,
): Knex.Raw | Knex.Ref<string, Record<string, string>> {
  const referenceExpression =
    typeof reference === 'string' ? client.ref(reference) : reference;
  if (!field || !isTemporalType(field.type)) return referenceExpression;
  assertPrecision(field);
  const strategy =
    getDatabaseDriverRuntime(client)?.repository?.temporalProjection;
  if (!strategy) return referenceExpression;
  // Keep SQL NULL as NULL whatever the dialect's concatenation semantics:
  // KingbaseES in Oracle-compatible mode, for example, turns `NULL || 'Z'`
  // into `'Z'`, which is not a temporal value.
  return client.raw('case when ? is null then null else ? end', [
    referenceExpression,
    strategy({ client, field, reference }),
  ]);
}
