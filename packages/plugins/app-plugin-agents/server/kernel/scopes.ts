/**
 * The scopes variables and default skills are kept in, besides an agent's own. This plugin knows two keys:
 *
 * - `agent`: an agent's own; reserved, decided by `agents.agents` permissions;
 * - `workdir`: a working directory a run works in (`SubjectDir.scopeId`), a git checkout or a plain directory.
 *
 * Everything else is the application's: it registers a kind for each scope its subjects name (`SubjectAssembly.scopes`,
 * such as the group a run's subject belongs to), with its title and who may see and change what is kept there. An
 * application registers `workdir` too, to say who may see and change a working directory's; without a registered kind,
 * nobody may.
 */
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { I18nText } from '../../shared/i18n.js';

export const CORE_SCOPES = ['agent', 'workdir'] as const;

export type CoreScope = (typeof CORE_SCOPES)[number];

/** A scope key: a short identifier, stored in `scope` columns of 32 characters. */
export const SCOPE_KEY_PATTERN: RegExp = /^[a-z][A-Za-z0-9]{1,31}$/u;

export interface ScopeAccess {
  /** Whether the user may see the scope's settings. */
  readonly visible: boolean;
  /** Whether the user may change them. */
  readonly manage: boolean;
}

export interface ScopeKind {
  /** `SCOPE_KEY_PATTERN`; `agent` is reserved. */
  readonly key: string;
  readonly title: I18nText;
  readonly description?: I18nText;
  /** What `userId` may do with the scope `scopeId`; null when it does not exist. */
  access(scopeId: string, userId: string): Promise<ScopeAccess | null>;
}

export interface ScopeKindRegistry {
  /** Returns what removes the kind. A key has one kind. */
  register(kind: ScopeKind): () => void;
  get(key: string): ScopeKind | undefined;
  /** The registered kinds in the order they were registered, `workdir` last. */
  list(): readonly ScopeKind[];
  /** The scope keys values may be kept under now: `agent`, `workdir` and the registered ones. */
  keys(): readonly string[];
  /** What `userId` may do with the scope; null when it does not exist or no kind decides. */
  access(
    scope: string,
    scopeId: string,
    userId: string,
  ): Promise<ScopeAccess | null>;
}

/** `workdir` as people read it when the application gives it no title of its own. */
export const WORKDIR_TITLE: I18nText = {
  key: 'scopes.workdir',
  ns: ACCESS_NAMESPACE,
};

export function createScopeKinds(): ScopeKindRegistry {
  const kinds = new Map<string, ScopeKind>();
  return {
    register(kind) {
      if (kind.key === 'agent' || !SCOPE_KEY_PATTERN.test(kind.key))
        throw new Error(
          `Not a scope key an application may register: ${kind.key}`,
        );
      if (kinds.has(kind.key))
        throw new Error(`Scope kind already registered: ${kind.key}`);
      kinds.set(kind.key, kind);
      return () => {
        if (kinds.get(kind.key) === kind) kinds.delete(kind.key);
      };
    },
    get: (key) => kinds.get(key),
    list: () => [
      ...[...kinds.values()].filter((kind) => kind.key !== 'workdir'),
      ...[...kinds.values()].filter((kind) => kind.key === 'workdir'),
    ],
    keys: () => [...new Set<string>([...CORE_SCOPES, ...kinds.keys()])],
    access: async (scope, scopeId, userId) => {
      const kind = kinds.get(scope);
      return kind ? kind.access(scopeId, userId) : null;
    },
  };
}
