import type { AuthorizationTitle } from './titles.js';
import type { Principal } from './types.js';

export interface RecordAccessContext<P = unknown> {
  principal: Principal;
  collection: string;
  action: string;
  params: P;
}

/** A named way to select records. The database adapter owns the result. */
export interface RecordAccessDefinition<P = unknown, R = unknown> {
  readonly key: string;
  readonly title?: AuthorizationTitle;
  readonly description?: AuthorizationTitle;
  /** Collection names it applies to; `*` applies to every collection. */
  readonly collections: readonly string[];
  readonly paramsSchema?: unknown;
  /**
   * The records are counted from the principal as a person, such as the ones they own: an identity that is no person
   * gets none from a rule that adds records this way.
   */
  readonly personal?: boolean;
  resolve(this: void, context: RecordAccessContext<P>): R | Promise<R>;
}

/** The serializable half of a definition, for type-safe grants and options. */
export interface RecordAccessReference<K extends string = string> {
  readonly key: K;
  readonly collections: readonly string[];
}

type RecordAccessMetadata<K extends string> = Omit<
  RecordAccessDefinition,
  'resolve' | 'key'
> & { key: K };

export class RecordAccessBuilder<K extends string, P = unknown> {
  private readonly metadata: RecordAccessMetadata<K>;
  private readonly resolveFn: RecordAccessDefinition<P>['resolve'] | undefined;

  constructor(
    metadata: RecordAccessMetadata<K>,
    resolve?: RecordAccessDefinition<P>['resolve'],
  ) {
    this.metadata = structuredClone(metadata);
    this.resolveFn = resolve;
  }

  title(title: AuthorizationTitle): RecordAccessBuilder<K, P> {
    return new RecordAccessBuilder({ ...this.metadata, title }, this.resolveFn);
  }

  description(description: AuthorizationTitle): RecordAccessBuilder<K, P> {
    return new RecordAccessBuilder(
      { ...this.metadata, description },
      this.resolveFn,
    );
  }

  /** Declares the records counted from the principal as a person; see `RecordAccessDefinition.personal`. */
  personal(): RecordAccessBuilder<K, P> {
    return new RecordAccessBuilder(
      { ...this.metadata, personal: true },
      this.resolveFn,
    );
  }

  collections(...collections: string[]): RecordAccessBuilder<K, P> {
    return new RecordAccessBuilder(
      { ...this.metadata, collections },
      this.resolveFn,
    );
  }

  /** Declares the params type; the optional schema describes it to editors. */
  params<T>(paramsSchema?: unknown): RecordAccessBuilder<K, T> {
    return new RecordAccessBuilder<K, T>(
      paramsSchema === undefined
        ? this.metadata
        : { ...this.metadata, paramsSchema },
    );
  }

  resolver(
    resolve: (context: RecordAccessContext<P>) => unknown,
  ): RecordAccessBuilder<K, P> {
    return new RecordAccessBuilder(this.metadata, resolve);
  }

  build(): RecordAccessDefinition<P> & { readonly key: K } {
    const resolve = this.resolveFn;
    if (!resolve) throw new TypeError('Record access requires a resolver');
    return validateDefinition({ ...structuredClone(this.metadata), resolve });
  }

  reference(): RecordAccessReference<K> {
    const { key, collections } = this.build();
    return { key, collections: [...collections] };
  }
}

/** Builds a definition; `authz.recordAccess.define` registers it. */
export function defineRecordAccess<const K extends string, P = unknown>(
  key: K,
  configure: (access: RecordAccessBuilder<K>) => RecordAccessBuilder<K, P>,
): RecordAccessBuilder<K, P> {
  if (!key) throw new TypeError('A record access key is required');
  return configure(new RecordAccessBuilder({ key, collections: [] }));
}

function validateDefinition<T extends RecordAccessDefinition>(
  definition: T,
): T {
  if (!definition.key) throw new TypeError('A record access key is required');
  if (typeof definition.resolve !== 'function')
    throw new TypeError('Record access requires a resolver');
  if (
    !definition.collections.length ||
    definition.collections.some((name) => typeof name !== 'string' || !name)
  )
    throw new TypeError('Record access requires collections');
  return definition;
}

function applies(
  definition: Pick<RecordAccessDefinition, 'collections'>,
  collection: string,
): boolean {
  return definition.collections.some(
    (name) => name === '*' || name === collection,
  );
}

export class RecordAccessRegistry {
  private readonly entries = new Map<string, RecordAccessDefinition>();

  define<K extends string, P>(
    definition:
      | (RecordAccessDefinition<P> & { readonly key: K })
      | RecordAccessBuilder<K, P>,
  ): RecordAccessReference<K> {
    const built =
      definition instanceof RecordAccessBuilder
        ? definition.build()
        : validateDefinition(definition);
    if (this.entries.has(built.key))
      throw new TypeError(`Record access already defined: ${built.key}`);
    const { resolve, ...metadata } = built;
    this.entries.set(built.key, {
      ...structuredClone(metadata),
      resolve: resolve,
    });
    return { key: built.key, collections: [...built.collections] };
  }

  get(key: string): RecordAccessDefinition | undefined {
    const definition = this.entries.get(key);
    if (!definition) return undefined;
    const { resolve, ...metadata } = definition;
    return { ...structuredClone(metadata), resolve };
  }

  list(): readonly RecordAccessDefinition[] {
    return [...this.entries.keys()].map((key) => this.get(key)!);
  }

  listFor(collection: string): readonly RecordAccessDefinition[] {
    return this.list().filter((definition) => applies(definition, collection));
  }

  async resolve(key: string, context: RecordAccessContext): Promise<unknown> {
    const definition = this.entries.get(key);
    if (!definition || !applies(definition, context.collection))
      throw new TypeError(`Unknown or inapplicable record access: ${key}`);
    return definition.resolve(context);
  }
}
