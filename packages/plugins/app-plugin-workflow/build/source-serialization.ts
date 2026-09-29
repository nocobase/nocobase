import type { WorkflowSourceAst } from '../dsl/definition.js';

/**
 * Whether a value has the shape `defineWorkflow()` returns.
 *
 * The evaluated module is untrusted input either way: the disposable process
 * hands back parsed JSON, and development discovery hands back a live object.
 */
export function isWorkflowSourceAst(
  value: unknown,
): value is WorkflowSourceAst {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as { title?: unknown }).title === 'string' &&
    Array.isArray((value as { nodes?: unknown }).nodes)
  );
}

/**
 * Reject anything an Artifact's `workflow.json` could not round-trip.
 *
 * A definition that survives this is byte-stable, which is what lets the digest
 * of an unchanged package stay the same across builds.
 */
export function assertSerializableDefinition(
  value: unknown,
  location: string,
  ancestors: Set<object> = new Set<object>(),
): void {
  if (value === null || typeof value === 'boolean' || typeof value === 'string')
    return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new TypeError(`${location} contains a non-finite number`);
    return;
  }
  if (typeof value !== 'object')
    throw new TypeError(
      `${location} contains a non-JSON ${typeof value} value`,
    );
  if (ancestors.has(value))
    throw new TypeError(`${location} contains a circular reference`);
  if (
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) !== '[object Object]'
  )
    throw new TypeError(`${location} contains a non-JSON object value`);
  if (Object.getOwnPropertySymbols(value).length)
    throw new TypeError(`${location} contains a symbol-keyed value`);
  ancestors.add(value);
  try {
    for (const [key, item] of Object.entries(value))
      assertSerializableDefinition(item, `${location}.${key}`, ancestors);
  } finally {
    ancestors.delete(value);
  }
}
