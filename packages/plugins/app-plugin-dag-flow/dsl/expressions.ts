/**
 * Typed references to the values a workflow produces at runtime.
 *
 * A reference is an authoring-time handle, never a value. It records where a
 * value will come from — invocation input, an administrator parameter, or an
 * upstream node's result — and `lowerBindings()` turns it into the template
 * string the engine's value resolver already understands. Nothing else may
 * serialize one: a reference throws when something tries to stringify it, so a
 * binding that was never lowered fails at authoring time instead of reaching a
 * handler as an opaque object.
 */

const REFERENCE: unique symbol = Symbol('workflow.dsl.reference');
const REFERENCE_TYPE: unique symbol = Symbol('workflow.dsl.reference.type');

/** Where a reference reads from. `output` also carries the producing node key. */
export type ReferenceNamespace = 'input' | 'parameters' | 'output';

export interface ReferenceSource {
  readonly namespace: ReferenceNamespace;
  readonly nodeKey?: string;
  readonly path: readonly string[];
}

/**
 * The workflow a reference belongs to.
 *
 * Indirect because a node's own output reference exists before the node is
 * added to a workflow: `addNode()` fills the identity in, and lowering a
 * reference whose identity is still `null` reports the node was never added.
 */
export interface ReferenceOwner {
  identity: object | null;
}

export interface ReferenceMetadata {
  readonly owner: ReferenceOwner;
  readonly source: ReferenceSource;
}

interface ReferenceBrand<T> {
  readonly [REFERENCE]: ReferenceMetadata;
  /** Phantom: keeps `Ref<string>` and `Ref<number>` from being interchangeable. */
  readonly [REFERENCE_TYPE]?: T;
}

type ReferenceMembers<T> = [T] extends [readonly (infer TItem)[]]
  ? { readonly [index: number]: Ref<TItem> }
  : [T] extends [object]
    ? { readonly [K in keyof T]-?: Ref<T[K]> }
    : unknown;

/** A typed handle on a value the workflow will produce. */
export type Ref<T> = ReferenceBrand<T> & ReferenceMembers<T>;

/**
 * A reference into a value this package has no static type for.
 *
 * Raw JSON Schema authoring gets this: property access keeps working and
 * numeric indexing resolves through the string index signature.
 */
export interface UntypedRef {
  readonly [REFERENCE]: ReferenceMetadata;
  readonly [key: string]: UntypedRef;
}

/**
 * A reference proxy for a surface the author gave a TypeBox schema to, and an
 * untyped one otherwise. Raw JSON Schema authoring keeps working; it just does
 * not get its bindings checked.
 */
export type SurfaceRef<T> = unknown extends T ? UntypedRef : Ref<T>;

const SEGMENT_PATTERN = /^(?:[A-Za-z_$][\w$]*|\d+)$/;

/** Members that must not be answered with a child reference. */
const SERIALIZATION_TRAPS: ReadonlySet<string> = new Set([
  'toJSON',
  'valueOf',
  'toString',
  'then',
]);

function trap(source: ReferenceSource): never {
  throw new TypeError(
    `Workflow reference "${describeReference(source)}" must be explicitly lowered before it is serialized or used as a value`,
  );
}

/** A human-readable form of a reference, used in authoring errors. */
export function describeReference(source: ReferenceSource): string {
  const root =
    source.namespace === 'output'
      ? `output(${source.nodeKey ?? '?'})`
      : source.namespace;
  return [root, ...source.path].join('.');
}

function child(
  owner: ReferenceOwner,
  source: ReferenceSource,
  segment: string,
): unknown {
  if (!SEGMENT_PATTERN.test(segment)) {
    throw new TypeError(
      `Workflow reference "${describeReference(source)}" cannot read property "${segment}"`,
    );
  }
  return createReference(owner, {
    ...source,
    path: [...source.path, segment],
  });
}

/** Build a reference proxy for one source path. */
export function createReference<T = unknown>(
  owner: ReferenceOwner,
  source: ReferenceSource,
): Ref<T> {
  const metadata: ReferenceMetadata = Object.freeze({
    owner,
    source: Object.freeze({ ...source, path: Object.freeze([...source.path]) }),
  });
  // An empty, extensible target: every own property the proxy reports is
  // synthesized by the traps, so no proxy invariant constrains them.
  const target: object = {};
  return new Proxy(target, {
    get: (_target, property): unknown => {
      if (property === REFERENCE) return metadata;
      if (property === Symbol.toStringTag) return 'WorkflowReference';
      if (typeof property === 'symbol') return undefined;
      if (SERIALIZATION_TRAPS.has(property)) trap(metadata.source);
      return child(owner, metadata.source, property);
    },
    has: (_target, property): boolean => property === REFERENCE,
    set: (): never => {
      throw new TypeError('Workflow references are read-only');
    },
    ownKeys: (): ArrayLike<string | symbol> => [],
  }) as unknown as Ref<T>;
}

/** Whether a value is a reference produced by `createReference()`. */
export function isReference(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Partial<ReferenceBrand<unknown>>)[REFERENCE] !== undefined
  );
}

/** Read a reference's metadata, or `null` when the value is not a reference. */
export function inspectReference(value: unknown): ReferenceMetadata | null {
  if (!isReference(value)) return null;
  return (value as ReferenceBrand<unknown>)[REFERENCE];
}
