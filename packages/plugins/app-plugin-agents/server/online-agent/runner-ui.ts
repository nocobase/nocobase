import {
  publicUIPageContext,
  type AppUIJson,
} from '../../shared/ui-message.js';
import type { ConversationMessage } from '../../shared/conversations.js';
import {
  validateAppUIMessages,
  type AppUIMessage,
} from '../../shared/online-agent.js';
import {
  messagesRepo,
  toMessage,
} from '../core/conversations/conversation.store.js';
import type { TxRunner } from '../kernel/tx.js';
import type { NativeHistoryQuery, NativeHistoryPage } from './native-store.js';

export const runnerMessageId = (runId: string): string => `runner:${runId}`;
/** Pure projection: no Run inference from prose and no invented tools or approvals. */
export function runnerUIMessages(rows: ConversationMessage[]): AppUIMessage[] {
  const messages = new Map<string, AppUIMessage>();
  for (const row of rows) {
    const grouped = row.role === 'assistant' && row.runId;
    const id = grouped ? runnerMessageId(row.runId) : row.id;
    let message = messages.get(id);
    if (!message) {
      message = {
        id,
        role:
          row.role === 'user'
            ? 'user'
            : row.role === 'assistant'
              ? 'assistant'
              : 'system',
        metadata: {
          conversationId: row.conversationId,
          createdAt: row.createdAt,
          revision: row.seq,
          seq: row.seq,
          ...(row.metadata.clientId ? { clientId: row.metadata.clientId } : {}),
          ...(row.metadata.agentId ? { agentId: row.metadata.agentId } : {}),
          ...(row.runId ? { executionId: row.runId, turnId: row.runId } : {}),
          sourceRecords: [],
          ...(row.workContext
            ? { context: publicUIPageContext(row.workContext) }
            : {}),
        },
        parts: [],
      };
      messages.set(id, message);
    }
    const index = message.parts.length;
    const partId = `record:${row.id}`;
    if (row.metadata.notice) {
      const notice = row.metadata.notice;
      message.parts.push(
        notice.code === 'news'
          ? {
              type: 'data-notice',
              id: partId,
              data: {
                type: notice.type,
                title: notice.title,
                ...(notice.params ? { params: { ...notice.params } } : {}),
              },
            }
          : {
              type: 'data-business',
              id: partId,
              data: {
                kind: notice.code,
                id: row.id,
                payload: JSON.parse(JSON.stringify(notice)) as AppUIJson,
              },
            },
      );
    } else
      message.parts.push({
        type: 'text',
        text: row.content.content,
        state: 'done',
      });
    message.metadata!.sourceRecords!.push({
      recordId: row.id,
      seq: row.seq,
      partId,
      partIndex: index,
      createdAt: row.createdAt,
    });
    for (const file of row.attachments ?? []) {
      message.parts.push({
        type: 'file',
        filename: file.filename,
        mediaType: file.mimeType,
        url: file.contentUrl,
      });
      message.metadata!.sourceRecords!.push({
        recordId: row.id,
        seq: row.seq,
        partId: `file:${file.id}`,
        partIndex: message.parts.length - 1,
        createdAt: row.createdAt,
      });
    }
    message.metadata!.revision = Math.max(message.metadata!.revision, row.seq);
  }
  return [...messages.values()];
}

/** Seed a bounded source page, then expand whole Runs and the intervening independent records. */
export async function runnerUIPage(
  tx: TxRunner,
  id: string,
  lastSeq: number,
  query: NativeHistoryQuery,
  basePath: string,
): Promise<NativeHistoryPage> {
  const repo = messagesRepo(tx.read());
  const rows = await repo.findMany({
    filter: (f) =>
      f.and([
        f.string('conversationId').eq(id),
        ...(query.ids
          ? [
              f.or(
                query.ids.map((key) =>
                  key.startsWith('runner:')
                    ? f.string('runId').eq(key.slice(7))
                    : f.string('id').eq(key),
                ),
              ),
            ]
          : []),
        ...(query.before !== undefined
          ? [f.number('seq').lt(query.before)]
          : []),
        ...(query.after !== undefined ? [f.number('seq').gt(query.after)] : []),
      ]),
    sort: (s) =>
      query.after !== undefined || query.ids
        ? s.field('seq').asc()
        : s.field('seq').desc(),
    ...(query.ids ? {} : { limit: query.limit + 1 }),
  });
  const selected = rows.slice(0, query.ids ? rows.length : query.limit);
  const runIds = [
    ...new Set(
      selected
        .filter((row) => row.role === 'assistant' && row.runId)
        .map((row) => row.runId!),
    ),
  ];
  const groups = runIds.length
    ? await repo.findMany({
        filter: (f) =>
          f.and([
            f.string('conversationId').eq(id),
            f.string('role').eq('assistant'),
            f.or(runIds.map((runId) => f.string('runId').eq(runId))),
          ]),
        sort: (s) => s.field('seq').asc(),
      })
    : [];
  const gathered = [...selected, ...groups];
  if (!gathered.length) return { items: [], lastSeq, hasMore: false };
  const minimum = Math.min(...gathered.map((row) => Number(row.seq)));
  const maximum = Math.max(...gathered.map((row) => Number(row.seq)));
  // Notices interleaved with a logical message must be on the same page, never stranded behind its anchor.
  const interval = query.ids
    ? gathered
    : await repo.findMany({
        filter: (f) =>
          f.and([
            f.string('conversationId').eq(id),
            f.number('seq').gte(minimum),
            f.number('seq').lte(maximum),
          ]),
        sort: (s) => s.field('seq').asc(),
      });
  const unique = [
    ...new Map(
      interval
        .filter(
          (row) =>
            query.after === undefined ||
            Number(row.seq) > query.after ||
            (row.role === 'assistant' && runIds.includes(row.runId!)),
        )
        .map((row) => [row.id, row]),
    ).values(),
  ].sort((a, b) => Number(a.seq) - Number(b.seq));
  const items = await validateAppUIMessages(
    runnerUIMessages(unique.map((row) => toMessage(row, basePath))),
  );
  return {
    items: query.ids
      ? items.filter((message) => query.ids!.includes(message.id))
      : items,
    lastSeq,
    ...(query.after !== undefined && maximum < lastSeq
      ? { nextAfter: maximum }
      : {}),
    hasMore: query.ids
      ? false
      : query.after === undefined
        ? minimum > 1
        : maximum < lastSeq,
  };
}
