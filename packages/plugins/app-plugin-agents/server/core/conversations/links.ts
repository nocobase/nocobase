/**
 * What conversations are tied to (`agConversationLinks`): records of kinds the application registers, such as issues.
 * The owner ties and unties them; the application ties what the agent of a run on the conversation created. Each turn
 * of the conversation lists them, as their kinds resolve them for the owner.
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  CONVERSATION_LINK_KIND_PATTERN,
  type ConversationLink,
  type ConversationLinkOrigin,
  type ConversationLinkView,
} from '../../../shared/conversations.js';
import { invalid, notFound } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import {
  findConversation,
  linksRepo,
  lockConversation,
  type ConversationRecord,
  type LinkRecord,
} from './conversation.store.js';
import type {
  ConversationLinkKind,
  ConversationLinks,
  ConversationLinkTarget,
  ConversationRef,
} from './ports.js';

/** At most this many links are listed for one conversation, and this many conversations for one target. */
const CONVERSATION_LINKS_MAX = 200;

interface ConversationLinksDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly now: () => string;
  readonly refOf: (record: ConversationRecord) => ConversationRef;
  /** Announces a change of the conversation to its owner. */
  readonly changed: (unit: Tx, record: ConversationRecord) => void;
}

export interface ConversationLinksInternal extends ConversationLinks {
  /** Resolve a page of already authorized conversations once per owner and kind. */
  summaries(
    conn: DatabaseConnection,
    conversations: readonly Pick<ConversationRecord, 'id' | 'userId'>[],
  ): Promise<Map<string, ConversationLink[]>>;
  /** The "Linked work" section of a turn, as the owner sees the links; null when there are none. */
  turnSection(
    conn: DatabaseConnection,
    conversation: Pick<ConversationRecord, 'id' | 'userId'>,
  ): Promise<string[] | null>;
  /** The ids of the conversations tied to the target. */
  conversationIds(
    conn: DatabaseConnection,
    target: ConversationLinkTarget,
  ): Promise<string[]>;
}

function checkTarget(target: ConversationLinkTarget): void {
  if (!CONVERSATION_LINK_KIND_PATTERN.test(target.kind))
    throw invalid('kind is not a link kind.', { field: 'kind' });
  if (
    typeof target.targetId !== 'string' ||
    target.targetId.length === 0 ||
    target.targetId.length > 255
  )
    throw invalid('targetId must be 1 to 255 characters.', {
      field: 'targetId',
    });
}

export function createConversationLinks(
  deps: ConversationLinksDeps,
): ConversationLinksInternal {
  const { tx, ids, now } = deps;
  const kinds = new Map<string, ConversationLinkKind>();

  async function owned(conn: DatabaseConnection, userId: string, id: string) {
    const record = await findConversation(conn, id);
    if (!record || record.userId !== userId) throw notFound('Conversation');
    return record;
  }

  /** Each kind's views of its targets, for `userId`. */
  async function views(
    conn: DatabaseConnection,
    userId: string,
    rows: readonly LinkRecord[],
  ): Promise<Map<string, ConversationLinkView>> {
    const found = new Map<string, ConversationLinkView>();
    const byKind = new Map<string, string[]>();
    for (const row of rows)
      byKind.set(row.kind, [...(byKind.get(row.kind) ?? []), row.targetId]);
    for (const [key, targetIds] of byKind) {
      const resolved = await kinds
        .get(key)
        ?.resolve?.(conn, userId, [...new Set(targetIds)]);
      for (const [targetId, view] of resolved ?? [])
        found.set(`${key}:${targetId}`, view);
    }
    return found;
  }

  function linkOf(
    row: LinkRecord,
    found: ReadonlyMap<string, ConversationLinkView>,
  ): ConversationLink {
    return {
      id: row.id,
      conversationId: row.conversationId,
      kind: row.kind,
      targetId: row.targetId,
      origin: row.origin as ConversationLinkOrigin,
      createdAt: row.createdAt,
      view: found.get(`${row.kind}:${row.targetId}`) ?? null,
    };
  }

  async function rowsOf(conn: DatabaseConnection, conversationId: string) {
    return (
      await linksRepo(conn).findMany({
        filter: { conversationId },
        sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
        limit: CONVERSATION_LINKS_MAX,
      })
    ).filter((row) => kinds.has(row.kind));
  }

  /** Ties the target to the locked conversation; the row, and whether it is new. */
  async function tie(
    unit: Tx,
    record: ConversationRecord,
    target: ConversationLinkTarget,
    origin: ConversationLinkOrigin,
    createdById: string | null,
  ): Promise<{ row: LinkRecord; created: boolean }> {
    const filter = {
      conversationId: record.id,
      kind: target.kind,
      targetId: target.targetId,
    };
    const existing = await linksRepo(unit.conn).findOne({ filter });
    if (existing) return { row: existing, created: false };
    const id = ids.next();
    await linksRepo(unit.conn).createOne({
      values: { id, ...filter, origin, createdById, createdAt: now() },
    });
    deps.changed(unit, record);
    return {
      row: (await linksRepo(unit.conn).findOne({ filter: { id } }))!,
      created: true,
    };
  }

  async function conversationIds(
    conn: DatabaseConnection,
    target: ConversationLinkTarget,
  ): Promise<string[]> {
    const rows = await linksRepo(conn).findMany({
      filter: { kind: target.kind, targetId: target.targetId },
      sort: (sort) => sort.field('createdAt').desc(),
      limit: CONVERSATION_LINKS_MAX,
    });
    return [...new Set(rows.map((row) => row.conversationId))];
  }

  return {
    registerKind(kind) {
      if (!CONVERSATION_LINK_KIND_PATTERN.test(kind.key))
        throw new Error(`Not a conversation link kind: ${kind.key}`);
      if (kinds.has(kind.key))
        throw new Error(
          `Conversation link kind already registered: ${kind.key}`,
        );
      kinds.set(kind.key, kind);
      return () => {
        if (kinds.get(kind.key) === kind) kinds.delete(kind.key);
      };
    },
    hasKind: (key) => kinds.has(key),

    async summaries(conn, conversations) {
      const result = new Map<string, ConversationLink[]>();
      if (!conversations.length) return result;
      const rows = await linksRepo(conn).findMany({
        filter: (f) =>
          f.or(
            conversations.map((item) => f.string('conversationId').eq(item.id)),
          ),
        sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
      });
      const owners = new Map<string, LinkRecord[]>();
      const counts = new Map<string, number>();
      const userOf = new Map(
        conversations.map((item) => [item.id, item.userId]),
      );
      for (const row of rows) {
        const count = counts.get(row.conversationId) ?? 0;
        if (count >= CONVERSATION_LINKS_MAX) continue;
        counts.set(row.conversationId, count + 1);
        if (!kinds.has(row.kind)) continue;
        const userId = userOf.get(row.conversationId)!;
        const group = owners.get(userId) ?? [];
        group.push(row);
        owners.set(userId, group);
      }
      for (const [userId, group] of owners) {
        const found = await views(conn, userId, group);
        for (const row of group) {
          const items = result.get(row.conversationId) ?? [];
          items.push(linkOf(row, found));
          result.set(row.conversationId, items);
        }
      }
      return result;
    },

    async list(userId, conversationId) {
      const conn = tx.read();
      await owned(conn, userId, conversationId);
      const rows = await rowsOf(conn, conversationId);
      const found = await views(conn, userId, rows);
      return rows.map((row) => linkOf(row, found));
    },

    async add(userId, conversationId, target) {
      checkTarget(target);
      const kind = kinds.get(target.kind);
      if (!kind)
        throw invalid(`${target.kind} is not a kind conversations link to.`, {
          field: 'kind',
        });
      const conn = tx.read();
      await owned(conn, userId, conversationId);
      // Resolved before the transaction: the kind reads what the owner may see.
      const view = kind.resolve
        ? (await kind.resolve(conn, userId, [target.targetId])).get(
            target.targetId,
          )
        : undefined;
      if (kind.resolve && !view)
        throw invalid('targetId names nothing you may see.', {
          field: 'targetId',
        });
      const row = await tx.run(async (unit) => {
        const record = await lockConversation(unit.conn, conversationId, now());
        if (!record || record.userId !== userId) throw notFound('Conversation');
        return (await tie(unit, record, target, 'user', userId)).row;
      });
      return linkOf(
        row,
        new Map(view ? [[`${target.kind}:${target.targetId}`, view]] : []),
      );
    },

    async remove(userId, conversationId, linkId) {
      await tx.run(async (unit) => {
        const record = await lockConversation(unit.conn, conversationId, now());
        if (!record || record.userId !== userId) throw notFound('Conversation');
        const deleted = await linksRepo(unit.conn).deleteMany({
          filter: { id: linkId, conversationId },
        });
        if (deleted.deletedCount !== 1) throw notFound('Link');
        deps.changed(unit, record);
      });
    },

    async attach(conversationId, target, options = {}) {
      checkTarget(target);
      const work = async (unit: Tx) => {
        const record = await lockConversation(unit.conn, conversationId, now());
        if (!record) return false;
        return (
          await tie(unit, record, target, options.origin ?? 'application', null)
        ).created;
      };
      return options.outer ? work(options.outer) : tx.run(work);
    },

    async linkedTo(conn, target) {
      const found: ConversationRef[] = [];
      for (const id of await conversationIds(conn, target)) {
        const record = await findConversation(conn, id);
        if (record) found.push(deps.refOf(record));
      }
      return found;
    },

    async turnSection(conn, conversation) {
      const rows = await rowsOf(conn, conversation.id);
      if (rows.length === 0) return null;
      const found = await views(conn, conversation.userId, rows);
      const lines = rows.flatMap((row) => {
        const view = found.get(`${row.kind}:${row.targetId}`);
        // What the owner may no longer see is left out, as it is from their list.
        if (kinds.get(row.kind)?.resolve && !view) return [];
        const name = view?.key ?? row.targetId;
        return [
          `- ${row.kind} ${name}${view ? `: ${view.title}` : ''}${view?.status ? ` (${view.status})` : ''}`,
        ];
      });
      return lines.length > 0
        ? [
            'Linked work (what this conversation drives, as it stands now):',
            ...lines,
          ]
        : null;
    },

    conversationIds,
  };
}
