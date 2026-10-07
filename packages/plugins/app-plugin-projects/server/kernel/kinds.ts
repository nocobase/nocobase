/**
 * The kinds of principal the plugin knows (`shared/kinds.ts`): `user` and `system` built in, more registered through
 * `projectsKindsToken` before the plugin's services are first used. A kind says how its ids are named, whether it may
 * execute issues and be mentioned, and which moves a workflow may let it make.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { BusinessKey } from '../../shared/access.js';
import type { MentionCandidate, MentionRef } from '../../shared/comments.js';
import type { StatusCategory } from '../../shared/issues.js';
import {
  BUILTIN_KINDS,
  SYSTEM_KIND,
  USER_KIND,
  type ExecutorCandidate,
  type KindInfo,
  type KindTitle,
  type NameText,
} from '../../shared/kinds.js';
import { forbidden, invalid } from './errors.js';
import type { UserDirectory } from './users.js';
import type { IssueWorkHandler } from './work.js';

/** What a kind that may execute issues answers. */
export interface ExecutorDirectory {
  /** 400 unless `id` exists, may execute issues, and `userId` may give it work. */
  require(conn: DatabaseConnection, id: string, userId: string): Promise<void>;
  /** Whether an issue owned by `ownerUserId` may keep `id` as its executor. */
  canKeep(
    conn: DatabaseConnection,
    id: string,
    ownerUserId: string,
  ): Promise<boolean>;
  /** The ids `userId` may give work to, for an executor picker; a kind without it is not offered there. */
  candidates?(conn: DatabaseConnection, userId: string): Promise<string[]>;
  /** Names and state of `ids` for an executor picker or a board: whether one can take work now, and how busy it is. */
  describe?(
    conn: DatabaseConnection,
    ids: readonly string[],
  ): Promise<ExecutorDescription[]>;
}

export interface ExecutorDescription {
  readonly id: string;
  readonly name: string;
  /** Its name in the viewer's language, when it has one. */
  readonly nameText?: NameText;
  /** Something can run its work now (for an agent: a fitting runner is online). */
  readonly online?: boolean;
  /** Work it is doing or has queued. */
  readonly busy?: number;
}

/** What a kind that may be mentioned (`mention://<key>/<id>`) answers. */
export interface MentionDirectory {
  /** Candidates for the `@` list, best first; `issueId` names the issue being written about, if any. */
  candidates(
    conn: DatabaseConnection,
    input: {
      readonly userId: string;
      readonly issueId: string | null;
      readonly q: string;
      readonly limit: number;
    },
  ): Promise<MentionCandidate[]>;
  /**
   * Whether `userId` may mention `id` (an agent the caller may not give work to, say). Allowed when left out. A note
   * (`/note`) starts no work, which a kind may take into account.
   */
  mayMention?(
    conn: DatabaseConnection,
    id: string,
    input: { readonly userId: string; readonly note: boolean },
  ): Promise<boolean>;
}

export interface PrincipalKind {
  /** `^[a-z][a-z0-9_]{1,31}$`; `user` and `system` are taken. */
  readonly key: string;
  readonly title?: KindTitle;
  /** Display names by id; unknown ids are left out. */
  names?(
    conn: DatabaseConnection,
    ids: readonly string[],
  ): Promise<Map<string, string>>;
  readonly executor?: ExecutorDirectory;
  /** Present when the kind may be mentioned. */
  readonly mention?: MentionDirectory;
  /** Whether a workflow may let this kind move an issue into a status of `category`. Every category by default. */
  mayEnter?(category: StatusCategory): boolean;
  /** Whether a workflow may let this kind move an issue to "any status". True by default. */
  readonly mayTargetAny?: boolean;
  /** What the kind does when issues it executes or is named in change (`kernel/work.ts`). */
  readonly work?: IssueWorkHandler;
  /**
   * The business actions a principal of this kind may be granted at most, such as the ones an agent may be configured
   * with; what it may do is always within what the person it acts for may do.
   */
  readonly actions?: readonly BusinessKey[];
}

export interface KindRegistry {
  /** Registers a kind; returns what unregisters it. */
  add(kind: PrincipalKind): () => void;
  get(key: string): PrincipalKind | undefined;
  has(key: string): boolean;
  /** Every kind, built-in ones first, then in registration order. */
  list(): readonly PrincipalKind[];
  /** What the browser is told. */
  info(): KindInfo[];
  /** Names of ids of one kind; an unknown kind names nobody. */
  names(
    conn: DatabaseConnection,
    key: string,
    ids: Iterable<string | null | undefined>,
  ): Promise<Map<string, string>>;
  /** Names of principals of any kinds, looked up kind by kind: `name(type, id)` is null for an unknown one. */
  nameAll(
    conn: DatabaseConnection,
    refs: Iterable<{
      readonly type: string | null;
      readonly id: string | null;
    }>,
  ): Promise<(type: string | null, id: string | null) => string | null>;
  /** The `@` list: each mentionable kind's candidates, other kinds before people, at most `limit`. */
  mentionCandidates(
    conn: DatabaseConnection,
    input: {
      readonly userId: string;
      readonly issueId: string | null;
      readonly q: string;
      readonly limit: number;
    },
  ): Promise<MentionCandidate[]>;
  /** 403 `MENTION_FORBIDDEN` when a kind refuses one of `refs`; mentions of unknown kinds are ignored. */
  requireMentions(
    conn: DatabaseConnection,
    refs: readonly MentionRef[],
    input: { readonly userId: string; readonly note: boolean },
  ): Promise<void>;
  /**
   * The executors of other kinds `userId` may give work to, for a picker: each kind that lists its candidates, in
   * registration order, described when the kind can say whether one can take work now.
   */
  executorCandidates(
    conn: DatabaseConnection,
    userId: string,
  ): Promise<ExecutorCandidate[]>;
  /** 400 `INVALID_EXECUTOR` unless `kind` may execute issues and `id` is one `userId` may give work to. */
  requireExecutor(
    conn: DatabaseConnection,
    kind: string,
    id: string,
    userId: string,
  ): Promise<void>;
}

const KEY = /^[a-z][a-z0-9_]{1,31}$/u;

export function createKindRegistry(users: UserDirectory): KindRegistry {
  const builtIn: PrincipalKind[] = [
    {
      key: USER_KIND,
      names: (conn, ids) => users.names(conn, ids),
      mention: {
        async candidates(conn, { q, limit }) {
          const needle = q.trim().toLowerCase();
          return (await users.listActive(conn))
            .filter(
              (user) =>
                !needle ||
                user.name.toLowerCase().includes(needle) ||
                (user.email ?? '').toLowerCase().includes(needle),
            )
            .slice(0, limit)
            .map((user) => ({
              kind: USER_KIND,
              id: user.id,
              name: user.name,
              ...(user.email ? { hint: user.email } : {}),
            }));
        },
      },
      executor: {
        async require(conn, id) {
          if (!(await users.isPerson(conn, id)))
            throw invalid(
              'INVALID_EXECUTOR',
              'The executor is not an active user.',
            );
        },
        canKeep: () => Promise.resolve(true),
      },
    },
    { key: SYSTEM_KIND },
  ];
  const added = new Map<string, PrincipalKind>();
  const all = () => [...builtIn, ...added.values()];
  const get = (key: string) => all().find((kind) => kind.key === key);
  return {
    add(kind) {
      if (!KEY.test(kind.key))
        throw new TypeError(`Kind ${kind.key} must match ${String(KEY)}.`);
      if (BUILTIN_KINDS.includes(kind.key) || added.has(kind.key))
        throw new TypeError(`Kind ${kind.key} is registered already.`);
      added.set(kind.key, kind);
      return () => {
        if (added.get(kind.key) === kind) added.delete(kind.key);
      };
    },
    get,
    has: (key) => get(key) !== undefined,
    list: all,
    info: () =>
      all().map((kind) => ({
        key: kind.key,
        title: kind.title ?? null,
        executor: kind.executor !== undefined,
        mentionable: kind.mention !== undefined,
      })),
    async names(conn, key, ids) {
      const wanted = [
        ...new Set([...ids].filter((id): id is string => Boolean(id))),
      ];
      const kind = get(key);
      if (!kind?.names || wanted.length === 0) return new Map();
      return kind.names(conn, wanted);
    },
    async nameAll(conn, refs) {
      const byKind = new Map<string, Set<string>>();
      for (const ref of refs) {
        if (!ref.type || !ref.id) continue;
        const ids = byKind.get(ref.type) ?? new Set<string>();
        ids.add(ref.id);
        byKind.set(ref.type, ids);
      }
      const names = new Map(
        await Promise.all(
          [...byKind].map(
            async ([key, ids]) =>
              [key, await this.names(conn, key, ids)] as const,
          ),
        ),
      );
      return (type, id) =>
        (type && id ? names.get(type)?.get(id) : undefined) ?? null;
    },
    async mentionCandidates(conn, input) {
      // Other kinds first, people last, as the old `@` list put agents first.
      const kinds = all().filter((kind) => kind.mention);
      const ordered = [
        ...kinds.filter((kind) => kind.key !== USER_KIND),
        ...kinds.filter((kind) => kind.key === USER_KIND),
      ];
      const result: MentionCandidate[] = [];
      for (const kind of ordered) {
        if (result.length >= input.limit) break;
        const found = await kind.mention!.candidates(conn, {
          ...input,
          limit: input.limit - result.length,
        });
        result.push(...found.slice(0, input.limit - result.length));
      }
      return result;
    },
    async requireMentions(conn, refs, input) {
      for (const ref of refs) {
        const mention = get(ref.kind)?.mention;
        if (
          mention?.mayMention &&
          !(await mention.mayMention(conn, ref.id, input))
        )
          throw forbidden(
            `You may not mention ${ref.kind} ${ref.id}.`,
            'MENTION_FORBIDDEN',
          );
      }
    },
    async executorCandidates(conn, userId) {
      const result: ExecutorCandidate[] = [];
      for (const kind of all()) {
        const executor = kind.executor;
        if (!executor?.candidates) continue;
        const ids = await executor.candidates(conn, userId);
        if (ids.length === 0) continue;
        if (executor.describe) {
          for (const found of await executor.describe(conn, ids))
            result.push({
              type: kind.key,
              id: found.id,
              name: found.name,
              ...(found.nameText ? { nameText: found.nameText } : {}),
              ...(found.online === undefined ? {} : { online: found.online }),
              ...(found.busy === undefined ? {} : { busy: found.busy }),
            });
          continue;
        }
        const names = await this.names(conn, kind.key, ids);
        for (const id of ids)
          result.push({ type: kind.key, id, name: names.get(id) ?? id });
      }
      return result;
    },
    async requireExecutor(conn, key, id, userId) {
      const executor = get(key)?.executor;
      if (!executor)
        throw invalid(
          'INVALID_EXECUTOR',
          `executor.type must be one of ${all()
            .filter((kind) => kind.executor)
            .map((kind) => kind.key)
            .join(', ')}.`,
        );
      await executor.require(conn, id, userId);
    },
  };
}
