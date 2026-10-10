/**
 * Turning typed references into the templates the engine already resolves.
 *
 * This is the only place a reference becomes data. The engine's value resolver
 * (`resolveWorkflowValue`) understands `{{$input.x}}`, `{{$parameters.x}}` and
 * `{{$nodeResults.key.field}}`, so lowering emits exactly those and nothing in
 * the runtime has to learn about the authoring layer.
 */

import type { JsonObject, JsonValue } from '../server/instructions/types.js';

import {
  describeReference,
  inspectReference,
  type ReferenceMetadata,
  type ReferenceSource,
} from './expressions.js';

export interface LoweringScope {
  /** The workflow the bindings belong to; references from another are rejected. */
  readonly identity: object;
  /** Node keys whose results are visible at this position. */
  readonly availableNodes: ReadonlySet<string>;
}

const TEMPLATE_PATTERN = /\{\{[^{}]*\}\}/;

function template(source: ReferenceSource, location: string): string {
  switch (source.namespace) {
    case 'input':
      return `{{$input${source.path.map((part) => `.${part}`).join('')}}}`;
    case 'parameters': {
      if (source.path.length !== 1) {
        throw new TypeError(
          `${location}: a workflow parameter reference must name exactly one declared parameter, received "${describeReference(source)}"`,
        );
      }
      return `{{$parameters.${source.path[0]}}}`;
    }
    case 'output': {
      if (!source.nodeKey) {
        throw new TypeError(`${location}: node result reference has no node`);
      }
      return `{{$nodeResults.${source.nodeKey}${source.path.map((part) => `.${part}`).join('')}}}`;
    }
  }
}

function lowerReference(
  metadata: ReferenceMetadata,
  scope: LoweringScope,
  location: string,
): string {
  const { owner, source } = metadata;
  if (owner.identity === null) {
    throw new TypeError(
      `${location}: "${describeReference(source)}" refers to a node that was never added to a workflow`,
    );
  }
  if (owner.identity !== scope.identity) {
    throw new TypeError(
      `${location}: "${describeReference(source)}" belongs to a different workflow; cross-workflow references cannot be lowered`,
    );
  }
  if (
    source.namespace === 'output' &&
    source.nodeKey !== undefined &&
    !scope.availableNodes.has(source.nodeKey)
  ) {
    throw new TypeError(
      `${location}: node "${source.nodeKey}" has no result available at this position; it must run before the node that reads it`,
    );
  }
  return template(source, location);
}

/**
 * Lower one binding tree to JSON.
 *
 * Plain strings pass through untouched except for one case: a string that looks
 * like a template is rejected. The typed builders offer a reference for every
 * value the engine can resolve, so a hand-written `'{{$input.x}}'` is a
 * reference that skipped both type checking and the availability check above.
 */
export function lowerBindings(
  value: unknown,
  scope: LoweringScope,
  location: string = 'args',
): JsonValue {
  const metadata = inspectReference(value);
  if (metadata) return lowerReference(metadata, scope, location);
  if (value === null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new TypeError(`${location} must be a finite number`);
    return value;
  }
  if (typeof value === 'string') {
    if (TEMPLATE_PATTERN.test(value)) {
      throw new TypeError(
        `${location}: template-looking string ${JSON.stringify(value)} is not allowed; bind the typed reference instead`,
      );
    }
    return value;
  }
  if (Array.isArray(value))
    return value.map((item, index) =>
      lowerBindings(item, scope, `${location}[${index}]`),
    );
  if (typeof value === 'object') {
    const prototype: unknown = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError(
        `${location} must be a plain object, array, or primitive`,
      );
    }
    const result: Record<string, JsonValue> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>))
      result[key] = lowerBindings(item, scope, `${location}.${key}`);
    return result;
  }
  throw new TypeError(`${location} cannot hold a ${typeof value} value`);
}

/** Lower a binding tree that must be an object, such as a run node's arguments. */
export function lowerBindingObject(
  value: Record<string, unknown>,
  scope: LoweringScope,
  location: string,
): JsonObject {
  const lowered = lowerBindings(value, scope, location);
  if (
    lowered === null ||
    typeof lowered !== 'object' ||
    Array.isArray(lowered)
  ) {
    throw new TypeError(`${location} must be an object`);
  }
  return lowered;
}
