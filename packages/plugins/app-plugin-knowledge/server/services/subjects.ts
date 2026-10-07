/**
 * Who an entry's permissions name. The plugin knows no users, roles or groups: the application registers one
 * `KnowledgeSubjectProvider` per type of subject (`docs/permissions.md`), which offers subjects to the picker, labels
 * stored ones, and says which of its subjects a person or an actor belongs to. Access asks the last at query time, so a
 * change of membership needs nothing recomputed.
 */
import {
  KNOWLEDGE_SUBJECT_TYPE_PATTERN,
  type KnowledgeSubject,
  type KnowledgeSubjectIcon,
  type KnowledgeSubjectType,
  type KnowledgeText,
  type SpaceRef,
} from '../../shared/knowledge.js';

/** Who access is decided for: a person (`user`), or an actor of the application's kind (`agent`). */
export interface KnowledgePrincipal {
  readonly kind: string;
  readonly id: string;
}

/** The space a provider is asked about. */
export interface KnowledgeSubjectContext {
  readonly space: SpaceRef;
}

export interface KnowledgeSubjectProvider {
  /** `[a-z][a-z0-9-]{0,31}`: what entries store as `subjectType`. */
  readonly type: string;
  /** The picker's group heading. */
  readonly title: KnowledgeText;
  readonly icon: KnowledgeSubjectIcon;
  /** Subjects to offer for `q` (all, best first, when empty), at most `limit`. */
  search(
    q: string,
    context: KnowledgeSubjectContext & { readonly limit: number },
  ): Promise<readonly KnowledgeSubject[]>;
  /** The stored subjects of `ids` it still knows, with their labels; an unknown one is left out. */
  describe(
    ids: readonly string[],
    context: KnowledgeSubjectContext,
  ): Promise<readonly KnowledgeSubject[]>;
  /** The ids of this type `principal` belongs to in the space. */
  subjectsOf(
    principal: KnowledgePrincipal,
    context: KnowledgeSubjectContext,
  ): Promise<readonly string[]>;
}

export interface KnowledgeSubjects {
  /** Adds a type of subject; a second provider of the same type replaces the first. Answers what removes it. */
  register(provider: KnowledgeSubjectProvider): () => void;
  get(type: string): KnowledgeSubjectProvider | undefined;
  list(): readonly KnowledgeSubjectProvider[];
  types(): KnowledgeSubjectType[];
  /** Every subject `principal` belongs to in the space, as `type:id` keys. */
  keysOf(
    principal: KnowledgePrincipal,
    space: SpaceRef,
  ): Promise<ReadonlySet<string>>;
  /** Labels for stored subjects; one no provider knows is marked `known: false` and labelled by its id. */
  describe(
    refs: readonly { readonly type: string; readonly id: string }[],
    space: SpaceRef,
  ): Promise<Map<string, KnowledgeSubject>>;
}

/** The key of a subject: its type has no colon, so the first one separates them. */
export function subjectKey(subject: {
  readonly type: string;
  readonly id: string;
}): string {
  return `${subject.type}:${subject.id}`;
}

export function createSubjects(
  onError: (message: string, error: unknown) => void,
): KnowledgeSubjects {
  const providers = new Map<string, KnowledgeSubjectProvider>();
  const subjects: KnowledgeSubjects = {
    register(provider) {
      if (!KNOWLEDGE_SUBJECT_TYPE_PATTERN.test(provider.type))
        throw new Error(
          `The knowledge subject type ${provider.type} is not a valid type.`,
        );
      providers.set(provider.type, provider);
      return () => {
        if (providers.get(provider.type) === provider)
          providers.delete(provider.type);
      };
    },
    get: (type) => providers.get(type),
    list: () => [...providers.values()],
    types: () =>
      [...providers.values()].map((provider) => ({
        type: provider.type,
        title: provider.title,
        icon: provider.icon,
      })),
    async keysOf(principal, space) {
      const keys = new Set<string>();
      await Promise.all(
        [...providers.values()].map(async (provider) => {
          let ids: readonly string[];
          try {
            ids = await provider.subjectsOf(principal, { space });
          } catch (error) {
            // A provider that fails grants nothing: access only narrows.
            onError(
              `The knowledge subject provider ${provider.type} failed.`,
              error,
            );
            return;
          }
          for (const id of ids)
            keys.add(subjectKey({ type: provider.type, id }));
        }),
      );
      return keys;
    },
    async describe(refs, space) {
      const found = new Map<string, KnowledgeSubject>();
      const byType = new Map<string, string[]>();
      for (const ref of refs) {
        const ids = byType.get(ref.type) ?? [];
        if (!ids.includes(ref.id)) ids.push(ref.id);
        byType.set(ref.type, ids);
      }
      await Promise.all(
        [...byType].map(async ([type, ids]) => {
          const provider = providers.get(type);
          if (!provider) return;
          try {
            for (const subject of await provider.describe(ids, { space }))
              found.set(subjectKey(subject), {
                ...subject,
                type,
                known: true,
              });
          } catch (error) {
            onError(`The knowledge subject provider ${type} failed.`, error);
          }
        }),
      );
      for (const ref of refs)
        if (!found.has(subjectKey(ref)))
          found.set(subjectKey(ref), {
            type: ref.type,
            id: ref.id,
            label: ref.id,
            known: false,
          });
      return found;
    },
  };
  return subjects;
}
