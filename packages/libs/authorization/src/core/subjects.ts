import type { AuthorizationIdentity, AuthorizationSubject } from './types.js';

export function resolveAuthorizationSubjects(
  identity: AuthorizationIdentity,
): readonly AuthorizationSubject[] {
  const subjects: AuthorizationSubject[] = [
    { type: identity.principal.type, id: identity.principal.id },
    ...(identity.subjects ?? []),
  ];
  const seen = new Set<string>();
  return subjects.filter((subject) => {
    const key = `${subject.type}\u0000${subject.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Open extension point for host-owned subject metadata.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AuthorizationSubjectTypeExtensions {}

export interface AuthorizationSubjectType<
  TTransaction = unknown,
> extends AuthorizationSubjectTypeExtensions {
  /** Subjects of this type inherited by a principal, such as current team memberships. */
  resolveFor?(
    principal: AuthorizationIdentity['principal'],
  ): Promise<readonly string[]>;
  /**
   * Narrows the ids of this one type to the ones that still confer anything.
   * Batched on purpose: one query answers the whole set. The caller's
   * transaction is passed on when there is one, so the answer reads the
   * snapshot that transaction has already locked.
   */
  filterActive(
    ids: readonly string[],
    transaction?: TTransaction,
  ): Promise<readonly string[]>;
  /**
   * Narrows the ids of this type to the ones a sharing rule may name, such as people but never service accounts,
   * which act as no person. Absent: every id may be named.
   */
  filterShareable?(
    ids: readonly string[],
    transaction?: TTransaction,
  ): Promise<readonly string[]>;
}

/**
 * What an application knows about its own subject types. Subject types are
 * open strings the library never validates, so an undeclared type is not an
 * unknown one — it is a type nothing further is known about.
 */
export class AuthorizationSubjectRegistry {
  private readonly types = new Map<string, AuthorizationSubjectType<unknown>>();

  /** Returns a function that removes the type again. */
  add<TTransaction = unknown>(
    type: string,
    definition: AuthorizationSubjectType<TTransaction>,
  ): () => void {
    if (this.types.has(type)) {
      throw new Error(`Authorization subject type already registered: ${type}`);
    }
    this.types.set(type, definition);
    return (): void => {
      if (this.types.get(type) === definition) this.types.delete(type);
    };
  }

  get(type: string): AuthorizationSubjectType<unknown> | undefined {
    return this.types.get(type);
  }

  async resolveFor(
    principal: AuthorizationIdentity['principal'],
  ): Promise<readonly AuthorizationSubject[]> {
    const subjects = await Promise.all(
      [...this.types.entries()].map(async ([type, definition]) =>
        ((await definition.resolveFor?.(principal)) ?? []).map((id) => ({
          type,
          id,
        })),
      ),
    );
    return this.filterActive(subjects.flat());
  }

  list(): readonly string[] {
    return [...this.types.keys()];
  }

  /** Subjects of an undeclared type pass through: nothing says otherwise. */
  async filterActive(
    subjects: readonly AuthorizationSubject[],
    transaction?: unknown,
  ): Promise<readonly AuthorizationSubject[]> {
    const declared = new Map<string, Set<string>>();
    for (const subject of subjects) {
      if (!this.types.has(subject.type)) continue;
      const ids = declared.get(subject.type) ?? new Set<string>();
      ids.add(subject.id);
      declared.set(subject.type, ids);
    }
    if (declared.size === 0) return subjects;
    const active = new Map<string, Set<string>>();
    for (const [type, ids] of declared) {
      const definition = this.types.get(type)!;
      active.set(
        type,
        new Set(await definition.filterActive([...ids], transaction)),
      );
    }
    return subjects.filter((subject) => {
      const ids = active.get(subject.type);
      return ids === undefined || ids.has(subject.id);
    });
  }
}
