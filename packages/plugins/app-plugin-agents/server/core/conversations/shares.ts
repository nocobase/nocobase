import { autoTitle } from './titles.js';
import { CONVERSATION_TITLE_AUTO_CHARS } from '../../../shared/conversations.js';
import type { DatabaseConnection, Repository } from '@nocobase/db';
import type {
  ConversationShare,
  ConversationShareCandidate,
} from '../../../shared/conversations.js';
import type { IdSource } from '../../kernel/ids.js';
import type { People } from '../../kernel/people.js';
import type { TxRunner } from '../../kernel/tx.js';
import { invalid, notFound } from '../../kernel/errors.js';
import { jsonObject } from '../../kernel/values.js';
import {
  findConversation,
  lockConversation,
  messagesRepo,
  type ConversationRecord,
} from './conversation.store.js';
import { openRunsOnEach } from '../runs/run.store.js';

export interface ShareRecord {
  readonly id: string;
  readonly conversationId: string;
  readonly userId: string;
  readonly cutoffSeq: number;
  readonly snapshotAt: string;
  readonly title: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export const sharesRepo = (conn: DatabaseConnection): Repository<ShareRecord> =>
  conn.repository<ShareRecord>('agConversationShares');

/** No cache: revocation takes effect on the next read, including file downloads. */
export async function conversationAccess(
  conn: DatabaseConnection,
  userId: string,
  id: string,
): Promise<{ record: ConversationRecord; share: ShareRecord | null }> {
  const record = await findConversation(conn, id);
  if (!record) throw notFound('Conversation');
  if (record.userId === userId) return { record, share: null };
  const share = await sharesRepo(conn).findOne({
    filter: { conversationId: id, userId },
  });
  if (!share) throw notFound('Conversation');
  return { record, share };
}

export type ConversationShareScope = (
  conn: DatabaseConnection,
  ownerId: string,
  conversationId: string,
) => Promise<readonly ConversationShareCandidate[]>;
export interface ConversationShares {
  /** Optional application scope. The default is the existing People directory. Both listing and granting use it. */
  provideScope(scope: ConversationShareScope): () => void;
  candidates(
    ownerId: string,
    conversationId: string,
  ): Promise<readonly ConversationShareCandidate[]>;
  list(
    ownerId: string,
    conversationId: string,
  ): Promise<readonly ConversationShare[]>;
  grant(
    ownerId: string,
    conversationId: string,
    userId: string,
  ): Promise<ConversationShare>;
  revoke(
    ownerId: string,
    conversationId: string,
    userId: string,
  ): Promise<void>;
}

export function createConversationShares(deps: {
  tx: TxRunner;
  ids: IdSource;
  people: People;
  now(): string;
}): ConversationShares {
  let scope: ConversationShareScope | undefined;
  async function owned(conn: DatabaseConnection, ownerId: string, id: string) {
    const record = await findConversation(conn, id);
    if (!record || record.userId !== ownerId) throw notFound('Conversation');
    return record;
  }
  async function candidates(
    conn: DatabaseConnection,
    ownerId: string,
    id: string,
  ) {
    const people = scope
      ? await scope(conn, ownerId, id)
      : await deps.people.list(conn);
    const inactive = await deps.people.inactive(
      conn,
      people.map((person) => person.id),
    );
    return people
      .filter((person) => person.id !== ownerId && !inactive.has(person.id))
      .map(({ id, name }) => ({ id, name }));
  }
  const view = (row: ShareRecord, name: string | null): ConversationShare => ({
    userId: row.userId,
    name,
    cutoffSeq: Number(row.cutoffSeq),
    snapshotAt: row.snapshotAt,
    updatedAt: row.updatedAt,
  });
  return {
    provideScope(next) {
      scope = next;
      return () => {
        if (scope === next) scope = undefined;
      };
    },
    async candidates(ownerId, id) {
      const conn = deps.tx.read();
      await owned(conn, ownerId, id);
      return candidates(conn, ownerId, id);
    },
    async list(ownerId, id) {
      const conn = deps.tx.read();
      await owned(conn, ownerId, id);
      const rows = await sharesRepo(conn).findMany({
        filter: { conversationId: id },
        sort: (s) => s.field('createdAt').asc(),
      });
      const names = await deps.people.names(
        conn,
        rows.map((row) => row.userId),
      );
      return rows.map((row) => view(row, names.get(row.userId) ?? null));
    },
    async grant(ownerId, id, userId) {
      return deps.tx.run(async ({ conn }) => {
        await owned(conn, ownerId, id);
        const person = (await candidates(conn, ownerId, id)).find(
          (p) => p.id === userId,
        );
        if (!person) throw invalid('Select an available application user.');
        // Reuse the conversation's ordinary serialization with admission and finalization.
        const record = (await lockConversation(conn, id, deps.now()))!;
        if (!record || record.userId !== ownerId)
          throw notFound('Conversation');
        let cutoffSeq = Number(record.lastSeq);
        const open = await openRunsOnEach(conn, 'conversation', [id]);
        const runner = jsonObject(
          jsonObject(record.metadata).runnerOnlineAgent,
        );
        const closingId = runner.closingRunId;
        const runIds = [
          ...open.map((run) => run.id),
          ...(typeof closingId === 'string' ? [closingId] : []),
        ];
        if (runIds.length) {
          const first = await messagesRepo(conn).findOne({
            filter: (f) =>
              f.and([
                f.string('conversationId').eq(id),
                f.or(runIds.map((runId) => f.string('runId').eq(runId))),
              ]),
            sort: (s) => s.field('seq').asc(),
          });
          if (first?.role === 'user') cutoffSeq = Number(first.seq) - 1;
          else {
            // Application-triggered turns may have no user row. Their in-progress notices and output
            // are beyond the last finished run, even before its first assistant message is saved.
            const previous = await messagesRepo(conn).findOne({
              filter: (f) =>
                f.and([
                  f.string('conversationId').eq(id),
                  f.string('runId').notEmpty(),
                  ...runIds.map((runId) => f.string('runId').ne(runId)),
                ]),
              sort: (s) => s.field('seq').desc(),
            });
            cutoffSeq = previous ? Number(previous.seq) : 0;
          }
        }
        const call = jsonObject(
          jsonObject(jsonObject(record.metadata).onlineAgent).call,
        );
        if (
          call.state === 'running' ||
          call.state === 'waitingApproval' ||
          call.closing
        ) {
          // Native input and its response share the execution id in their durable metadata.
          const first = await messagesRepo(conn).findOne({
            filter: (f) =>
              f.and([
                f.string('conversationId').eq(id),
                f
                  .json('content')
                  .path(['original', 'metadata', 'executionId'])
                  .eq(
                    typeof call.executionId === 'string'
                      ? call.executionId
                      : '',
                  ),
              ]),
            sort: (s) => s.field('seq').asc(),
          });
          cutoffSeq = Math.min(cutoffSeq, first ? Number(first.seq) - 1 : 0);
        }
        const last = await messagesRepo(conn).findOne({
          filter: (f) =>
            f.and([
              f.string('conversationId').eq(id),
              f.number('seq').lte(cutoffSeq),
            ]),
          sort: (s) => s.field('seq').desc(),
        });
        const at = deps.now();
        const filter = { conversationId: id, userId };
        const old = await sharesRepo(conn).findOne({ filter });
        if (old && cutoffSeq < Number(old.cutoffSeq))
          return view(old, person.name);
        let title = record.title;
        if (
          cutoffSeq < Number(record.lastSeq) &&
          record.titleSource !== 'user'
        ) {
          const firstIncluded = await messagesRepo(conn).findOne({
            filter: (f) =>
              f.and([
                f.string('conversationId').eq(id),
                f.string('role').eq('user'),
                f.number('seq').lte(cutoffSeq),
              ]),
            sort: (s) => s.field('seq').asc(),
          });
          const content = jsonObject(firstIncluded?.content).content;
          title =
            typeof content === 'string'
              ? autoTitle(content, CONVERSATION_TITLE_AUTO_CHARS) || null
              : null;
        }
        const values = {
          cutoffSeq,
          snapshotAt: last?.createdAt ?? record.createdAt,
          title,
          updatedAt: at,
        };
        if (old) await sharesRepo(conn).updateMany({ filter, values });
        else
          await sharesRepo(conn).createOne({
            values: {
              id: deps.ids.next(),
              ...filter,
              ...values,
              createdAt: at,
            },
          });
        return view(
          { ...(old ?? { id: '', ...filter, createdAt: at }), ...values },
          person.name,
        );
      });
    },
    async revoke(ownerId, id, userId) {
      await deps.tx.run(async ({ conn }) => {
        await owned(conn, ownerId, id);
        await sharesRepo(conn).deleteMany({
          filter: { conversationId: id, userId },
        });
      });
    },
  };
}
