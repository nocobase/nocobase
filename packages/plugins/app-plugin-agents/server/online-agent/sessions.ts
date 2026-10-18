import {
  historicalPageContext,
  latestPageContext,
  type PageContextKinds,
} from '../core/conversations/page-context.js';
import { isDeepStrictEqual } from 'node:util';
import type { ModelMessage } from 'ai';
import type { DatabaseConnection } from '@nocobase/db';
import type { OnlineAgentConfig } from './config.js';
import {
  content,
  restore,
  type OnlineAgentJson,
  type OnlineAgentOutcome,
} from './codec.js';
import type { TxRunner } from '../kernel/tx.js';
import type { IdSource } from '../kernel/ids.js';
import { asJson, jsonObject } from '../kernel/values.js';
import { conflict, invalid, notFound } from '../kernel/errors.js';
import {
  lockConversation,
  conversationsRepo,
  messagesRepo,
  findConversation,
  preferencesRepo,
  settingsRepo,
  toMessage,
  type ConversationRecord,
} from '../core/conversations/conversation.store.js';
import type { ChatAttachmentLinks } from '../core/conversations/attachments.js';
import type { ModelRef } from '../../shared/models.js';

export type OnlineAgentCall = {
  actorId: string;
  state: 'running' | 'idle';
  outcome?: OnlineAgentOutcome;
  closing?: boolean;
  result?: OnlineAgentJson;
  error?: string;
  /** Legacy hint only; never an admission condition. Removed after finalization. */
  requiresEffectReview?: boolean;
};
export type OnlineAgentSession = {
  id: string;
  kind: 'realtime' | 'background';
  config: OnlineAgentConfig;
  model: ModelRef;
  call: OnlineAgentCall | null;
  lastSeq: number;
};
type OnlineAgentMetadata = {
  version: 1;
  kind: OnlineAgentSession['kind'];
  config: OnlineAgentConfig;
  call: OnlineAgentCall | null;
};

function metadata(row: ConversationRecord): OnlineAgentMetadata {
  const found = jsonObject(row.metadata).onlineAgent as
    OnlineAgentMetadata | undefined;
  if (!found || found.version !== 1)
    throw invalid(
      'This historical conversation has not been switched to OnlineAgent.',
    );
  if ('permissions' in found.config)
    throw invalid('Permission-restricted configuration is not supported.');
  return found;
}
function session(row: ConversationRecord): OnlineAgentSession {
  const value = metadata(row);
  if (!row.model || !row.modelService)
    throw invalid('Select a valid chat model.');
  return {
    id: row.id,
    ...value,
    lastSeq: Number(row.lastSeq),
    model: { model: row.model, modelService: row.modelService },
  };
}

export interface OnlineAgentSessionManager {
  /** Server boot only, before requests; ignores rows written by this process. */
  recoverAtStartup(): Promise<void>;
  publicHistory(
    userId: string,
    id: string,
  ): Promise<import('../../shared/conversations.js').ConversationMessage[]>;
  defaults(userId: string): Promise<{ scope?: string[]; model?: ModelRef }>;
  create(
    userId: string,
    kind: OnlineAgentSession['kind'],
    config: OnlineAgentConfig,
    model: ModelRef,
    info?: { source?: string; title?: string; showInChatList?: boolean },
  ): Promise<string>;
  load(userId: string, id: string): Promise<OnlineAgentSession>;
  configure(
    userId: string,
    id: string,
    config: OnlineAgentConfig,
    model: ModelRef,
  ): Promise<void>;
  history(userId: string, id: string): Promise<ModelMessage[]>;
  /** Model history plus transient, freshly authorized page references; never persisted. */
  executionHistory(
    userId: string,
    id: string,
    current?: import('../../shared/conversations.js').ResolvedPageContext,
  ): Promise<ModelMessage[]>;
  accept(
    userId: string,
    id: string,
    config: OnlineAgentConfig,
    model: ModelRef,
    items: {
      id: string;
      message: ModelMessage;
      attachments?: string[];
      clientId?: string;
      workContext?: import('../../shared/conversations.js').ResolvedPageContext;
    }[],
  ): Promise<number>;
  save(
    userId: string,
    id: string,
    items: {
      id: string;
      message: ModelMessage | null;
      excludedFromHistory?: boolean;
      partial?: string;
    }[],
    call: OnlineAgentCall,
  ): Promise<number>;
  finish(userId: string, id: string): Promise<void>;
}

export function createSessionManager(deps: {
  contextKinds?: PageContextKinds;
  tx: TxRunner;
  basePath?: () => string;
  ids: IdSource;
  attachments: ChatAttachmentLinks;
  now(): string;
  measure?: (phase: string, durationMs: number) => void;
}): OnlineAgentSessionManager {
  const owned = async (
    conn: DatabaseConnection,
    userId: string,
    id: string,
    lock = false,
  ) => {
    const row = lock
      ? await lockConversation(conn, id, deps.now())
      : await findConversation(conn, id);
    if (!row || row.userId !== userId) throw notFound('Conversation');
    return row;
  };
  const write = async <T>(
    userId: string,
    id: string,
    phase: string,
    change: (conn: DatabaseConnection, row: ConversationRecord) => Promise<T>,
    messageSeq?: (result: T) => number,
  ) => {
    let start: number | undefined;
    try {
      return await deps.tx.run(async ({ conn, emit }) => {
        start = performance.now();
        const row = await owned(conn, userId, id, true);
        const result = await change(conn, row);
        const lastSeq = messageSeq?.(result);
        if (lastSeq !== undefined && lastSeq > Number(row.lastSeq)) {
          emit({
            type: 'conversation.changed',
            conversationId: id,
            userId,
            lastSeq,
          });
        }
        // Preserve the detail invalidation that also announces execution and metadata changes.
        emit({ type: 'conversation.changed', conversationId: id, userId });
        return result;
      });
    } finally {
      // Includes lock acquisition and commit: a conservative upper bound on lock ownership.
      if (start !== undefined) deps.measure?.(phase, performance.now() - start);
    }
  };
  const saveMetadata = (
    conn: DatabaseConnection,
    row: ConversationRecord,
    value: OnlineAgentMetadata,
    extra: Record<string, unknown> = {},
  ) =>
    conversationsRepo(conn).updateMany({
      filter: { id: row.id },
      values: {
        metadata: asJson({ ...jsonObject(row.metadata), onlineAgent: value }),
        ...extra,
      },
    });
  const append = async (
    conn: DatabaseConnection,
    row: ConversationRecord,
    items: {
      id: string;
      message: ModelMessage | null;
      excludedFromHistory?: boolean;
      partial?: string;
      attachments?: string[];
      clientId?: string;
      workContext?: import('../../shared/conversations.js').ResolvedPageContext;
    }[],
    outcome: OnlineAgentOutcome,
  ) => {
    let seq = Number(row.lastSeq);
    const now = deps.now();
    for (const item of items) {
      const files = await deps.attachments.attach(
        conn,
        row.userId,
        { conversationId: row.id, messageId: item.id },
        item.attachments ?? [],
      );
      const payload = content(
        item.message,
        outcome,
        item.partial,
        item.excludedFromHistory,
      );
      await messagesRepo(conn).createOne({
        values: {
          id: item.id,
          conversationId: row.id,
          seq: ++seq,
          // The column is a display role; the SDK role remains in content.original.
          role:
            item.message?.role === 'tool'
              ? 'system'
              : (item.message?.role ?? 'assistant'),
          content: asJson(payload),
          searchText: payload.content,
          toolCalls: null,
          attachments: files.length ? asJson(files) : null,
          workContext: item.workContext ? asJson(item.workContext) : null,
          metadata: asJson(item.clientId ? { clientId: item.clientId } : {}),
          runId: null,
          runEventSeq: null,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
    return seq;
  };
  async function history(
    userId: string,
    id: string,
    current?: import('../../shared/conversations.js').ResolvedPageContext,
    replay = false,
  ): Promise<ModelMessage[]> {
    await owned(deps.tx.read(), userId, id);
    const rows = await messagesRepo(deps.tx.read()).findMany({
      filter: { conversationId: id },
      sort: (sort) => sort.field('seq').asc(),
    });
    const messages = rows.flatMap((row, index): ModelMessage[] => {
      const original = jsonObject(jsonObject(row.content).original);
      if (!original.excludedFromHistory) {
        const value = restore(row.content, row.role);
        return value ? [value] : [];
      }
      // Earlier releases excluded interrupted tool evidence. Restore only valid
      // calls and their adjacent results; never replay an unpaired fragment.
      const value = restore(row.content, row.role, true);
      if (value?.role !== 'assistant' || !Array.isArray(value.content))
        return [];
      const calls = value.content.filter(
        (part): part is Extract<typeof part, { type: 'tool-call' }> =>
          part.type === 'tool-call' &&
          typeof part.toolCallId === 'string' &&
          typeof part.toolName === 'string' &&
          'input' in part,
      );
      if (!calls.length) return [];
      const next = rows[index + 1];
      const result =
        next &&
        jsonObject(jsonObject(next.content).original).excludedFromHistory
          ? restore(next.content, next.role, true)
          : null;
      return [
        { ...value, content: calls },
        {
          role: 'tool',
          content: calls.map((call) => {
            const saved =
              result?.role === 'tool'
                ? result.content.find(
                    (part) =>
                      part.type === 'tool-result' &&
                      part.toolCallId === call.toolCallId &&
                      part.toolName === call.toolName,
                  )
                : undefined;
            return (
              saved ?? {
                type: 'tool-result',
                toolCallId: call.toolCallId,
                toolName: call.toolName,
                output: {
                  type: 'error-text',
                  value:
                    'Tool result unknown. The action may have completed; check its result before repeating it.',
                },
              }
            );
          }),
        },
      ];
    });
    const page =
      replay && deps.contextKinds
        ? await historicalPageContext(
            deps.contextKinds,
            deps.tx.read(),
            userId,
            latestPageContext(rows),
            current,
          )
        : undefined;
    if (page) messages.push({ role: 'user', content: page });
    return messages;
  }

  return {
    async recoverAtStartup() {
      const startedAt = new Date(performance.timeOrigin);
      const stale = (row: ConversationRecord) => {
        const value = jsonObject(row.metadata).onlineAgent as
          OnlineAgentMetadata | undefined;
        return (
          !jsonObject(row.metadata).runnerOnlineAgent &&
          value?.version === 1 &&
          new Date(row.updatedAt) < startedAt &&
          (value.call?.state === 'running' ||
            value.call?.closing ||
            value.call?.requiresEffectReview)
        );
      };
      let offset = 0;
      // Scan before locking: JSON metadata is inspected portably across database dialects.
      for (;;) {
        const rows = await conversationsRepo(deps.tx.read()).findMany({
          filter: (f) =>
            f.and([
              f.string('mode').eq('online'),
              f.date('createdAt').before(startedAt),
            ]),
          sort: (s) => s.field('id').asc(),
          limit: 200,
          offset,
        });
        if (!rows.length) break;
        for (const candidate of rows.filter(stale)) {
          await write(
            candidate.userId,
            candidate.id,
            'startup',
            async (conn, row) => {
              if (!stale(row)) return;
              const value = metadata(row);
              const {
                closing: _closing,
                requiresEffectReview: _review,
                ...call
              } = value.call!;
              const unfinished = call.state === 'running' && !call.outcome;
              const message =
                'The server stopped before this execution finished. Some actions may have completed; check their results before repeating them.';
              const lastSeq = unfinished
                ? await append(
                    conn,
                    row,
                    [
                      {
                        id: deps.ids.next(),
                        message: { role: 'assistant', content: message },
                      },
                    ],
                    'failed',
                  )
                : Number(row.lastSeq);
              await saveMetadata(
                conn,
                row,
                {
                  ...value,
                  call: {
                    ...call,
                    state: 'idle',
                    ...(unfinished
                      ? { outcome: 'failed', error: message, result: undefined }
                      : {}),
                  },
                },
                {
                  lastSeq,
                  ...(unfinished
                    ? { read: false, lastMessageAt: deps.now() }
                    : {}),
                  updatedAt: deps.now(),
                },
              );
              return lastSeq;
            },
            (seq) => seq ?? Number(candidate.lastSeq),
          );
        }
        // Creation time is immutable, so finalization cannot move rows between pages.
        offset += rows.length;
      }
    },
    async defaults(userId: string) {
      const conn = deps.tx.read();
      const [personal, system] = await Promise.all([
        preferencesRepo(conn).findOne({ filter: { userId } }),
        settingsRepo(conn).findOne({ filter: { key: 'chat' } }),
      ]);
      return {
        ...jsonObject(jsonObject(system?.value).onlineAgent),
        ...jsonObject(personal?.onlineAgent),
      };
    },
    async create(
      userId: string,
      kind: OnlineAgentSession['kind'],
      config: OnlineAgentConfig,
      model: ModelRef,
      info?: { source?: string; title?: string; showInChatList?: boolean },
    ) {
      const id = deps.ids.next();
      const now = deps.now();
      await deps.tx.run(async ({ conn, emit }) => {
        await conversationsRepo(conn).createOne({
          values: {
            id,
            userId,
            mode: 'online',
            modelService: model.modelService,
            model: model.model,
            fallbackFromAgentId: null,
            title: info?.title ?? null,
            titleSource: info?.title ? 'user' : 'auto',
            category: 'chat',
            showInChatList:
              kind === 'background' ? false : (info?.showInChatList ?? true),
            source: info?.source ?? 'chat',
            read: true,
            thread: 0,
            lastSeq: 0,
            syncRunId: null,
            syncSeq: 0,
            lastMessageAt: now,
            archivedAt: null,
            lockedAt: null,
            createdAt: now,
            updatedAt: now,
            metadata: asJson({
              onlineAgent: { version: 1, kind, config, call: null },
            }),
          },
        });
        emit({ type: 'conversation.changed', conversationId: id, userId });
      });
      return id;
    },
    async load(userId: string, id: string) {
      return session(await owned(deps.tx.read(), userId, id));
    },
    async configure(userId, id, config, model) {
      await write(userId, id, 'configure', async (conn, row) => {
        const value = metadata(row);
        if (value.call?.state === 'running' || value.call?.closing)
          throw conflict('This conversation is busy.');
        await saveMetadata(
          conn,
          row,
          { ...value, config },
          {
            modelService: model.modelService,
            model: model.model,
            updatedAt: deps.now(),
          },
        );
      });
    },
    async publicHistory(userId, id) {
      await owned(deps.tx.read(), userId, id);
      const rows = await messagesRepo(deps.tx.read()).findMany({
        filter: { conversationId: id },
        sort: (sort) => sort.field('seq').asc(),
      });
      return rows.map((row) => toMessage(row, deps.basePath?.() ?? ''));
    },
    async history(userId: string, id: string): Promise<ModelMessage[]> {
      return history(userId, id);
    },
    async executionHistory(userId, id, current) {
      return history(userId, id, current, true);
    },
    accept(
      userId: string,
      id: string,
      config: OnlineAgentConfig,
      model: ModelRef,
      items: {
        id: string;
        message: ModelMessage;
        attachments?: string[];
        clientId?: string;
        workContext?: import('../../shared/conversations.js').ResolvedPageContext;
      }[],
    ) {
      return write(
        userId,
        id,
        'accept',
        async (conn, row) => {
          const value = metadata(row);
          if (value.call?.state === 'running' || value.call?.closing)
            throw conflict('This conversation is busy.');
          if (row.archivedAt || row.syncRunId)
            throw conflict('This conversation cannot accept input.');
          const lastSeq = await append(conn, row, items, 'completed');
          await saveMetadata(
            conn,
            row,
            { ...value, config, call: { actorId: userId, state: 'running' } },
            {
              modelService: model.modelService,
              model: model.model,
              read: true,
              lastSeq,
              ...(row.title
                ? {}
                : {
                    title:
                      items
                        .map((item) => content(item.message).content)
                        .join(' ')
                        .slice(0, 30) || null,
                  }),
              lastMessageAt: deps.now(),
              updatedAt: deps.now(),
            },
          );
          return lastSeq;
        },
        (seq) => seq,
      );
    },
    save(
      userId: string,
      id: string,
      items: {
        id: string;
        message: ModelMessage | null;
        excludedFromHistory?: boolean;
        partial?: string;
      }[],
      call: OnlineAgentCall,
    ) {
      return write(
        userId,
        id,
        'save',
        async (conn, row) => {
          const value = metadata(row);
          // Stable response ids allow a commit-unknown retry to verify, rather than append twice.
          const existing = items.length
            ? await messagesRepo(conn).findMany({
                filter: (f) =>
                  f.and([
                    f.string('conversationId').eq(id),
                    f.or(items.map((item) => f.string('id').eq(item.id))),
                  ]),
              })
            : [];
          if (existing.length && existing.length !== items.length)
            throw conflict('Incomplete response persistence.');
          if (
            existing.length &&
            items.some((item) => {
              const saved = existing.find((row) => row.id === item.id);
              return (
                !saved ||
                !isDeepStrictEqual(
                  saved.content,
                  content(
                    item.message,
                    call.outcome ?? 'failed',
                    item.partial,
                    item.excludedFromHistory,
                  ),
                )
              );
            })
          )
            throw conflict(
              'The saved response differs from the finalization retry.',
            );
          const lastSeq = existing.length
            ? Number(row.lastSeq)
            : await append(conn, row, items, call.outcome ?? 'failed');
          await saveMetadata(
            conn,
            row,
            { ...value, call: { ...call, closing: true } },
            {
              lastSeq,
              ...(!existing.length &&
              items.some(
                (item) =>
                  (item.message?.role === 'assistant' ||
                    item.message === null) &&
                  content(
                    item.message,
                    call.outcome ?? 'failed',
                    item.partial,
                  ).content.trim().length > 0,
              )
                ? { read: false }
                : {}),
              lastMessageAt: deps.now(),
              updatedAt: deps.now(),
            },
          );
          return lastSeq;
        },
        (seq) => seq,
      );
    },
    finish(userId: string, id: string) {
      return write(userId, id, 'finish', async (conn, row) => {
        const value = metadata(row);
        if (!value.call) throw conflict('No execution is being finalized.');
        const {
          closing: _closing,
          requiresEffectReview: _review,
          ...call
        } = value.call;
        await saveMetadata(conn, row, {
          ...value,
          call: { ...call, state: 'idle' },
        });
      });
    },
  };
}
