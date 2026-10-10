import type { FilterBuilder, FilterNode } from '@nocobase/db';

import { asIdFilter } from '../engine/utils.js';
import type { WorkflowId } from '../engine/types.js';

/**
 * `field IN (...)`, which the Repository filter contract does not spell.
 *
 * Every caller passes a bounded list — one page of keys, the ids of one run's
 * node runs, the Artifacts a deployment carries — so a disjunction is the same
 * query the database would have planned anyway.
 *
 * An empty list is refused rather than passed through. `or([])` is a no-op in
 * this filter language, so an `IN ()` that should match nothing would instead
 * match every row, which is the kind of mistake that reads as correct and
 * deletes or reports far too much.
 */
export function anyOfStrings(
  filter: FilterBuilder,
  field: string,
  values: readonly string[],
): FilterNode {
  assertNotEmpty(field, values.length);
  return filter.or(values.map((value) => filter.string(field).eq(value)));
}

/** `field IN (...)` for a `bigInt` column, which takes numbers. */
export function anyOfIds(
  filter: FilterBuilder,
  field: string,
  ids: readonly WorkflowId[],
): FilterNode {
  assertNotEmpty(field, ids.length);
  return filter.or(ids.map((id) => filter.number(field).eq(asIdFilter(id))));
}

function assertNotEmpty(field: string, length: number): void {
  if (length === 0)
    throw new Error(`Cannot filter "${field}" against an empty list.`);
}
