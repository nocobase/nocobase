import type { ModelMessage } from 'ai';
import type { DatabaseConnection } from '@nocobase/db';
import type { OnlineAgentConfig } from './config.js';
import type { OnlineAgentJson, OnlineAgentOutcome } from './codec.js';
import type { Tx, TxRunner } from '../kernel/tx.js';
import type { IdSource } from '../kernel/ids.js';
import { asJson, jsonObject } from '../kernel/values.js';
import { conflict, invalid, notFound } from '../kernel/errors.js';
import {
  lockConversation,
  conversationsRepo,
  findConversation,
  preferencesRepo,
  settingsRepo,
  type ConversationRecord,
} from '../core/conversations/conversation.store.js';
import type {
  ChatAttachmentLinks,
  ChatAttachmentService,
} from '../core/conversations/attachments.js';
import type { ModelRef } from '../../shared/models.js';
import { NativeSessionStore } from './native-store.js';
import type { ResolvedPageContext } from '../../shared/conversations.js';
import type { PageContextKinds } from '../core/conversations/page-context.js';

export type OnlineAgentCall = {
  actorId: string;
  state: 'running' | 'idle' | 'waitingApproval';
  executionId?: string;
  messageId?: string;
  revision?: number;
  approvalExpiresAt?: string;
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
  readonly native: NativeSessionStore;
  recoverAtStartup(): Promise<void>;
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
  /** Private model projection; public facades expose safe UI messages instead. */
  history(userId: string, id: string): Promise<ModelMessage[]>;
  executionHistory(
    userId: string,
    id: string,
    current?: ResolvedPageContext,
  ): Promise<ModelMessage[]>;
  finish(userId: string, id: string): Promise<void>;
}

export function createSessionManager(deps: {
  contextKinds?: PageContextKinds;
  tx: TxRunner;
  basePath?: () => string;
  ids: IdSource;
  attachments: ChatAttachmentLinks;
  files?: Pick<ChatAttachmentService, 'content'>;
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
    change: (
      conn: DatabaseConnection,
      row: ConversationRecord,
      emit: Tx['emit'],
    ) => Promise<T>,
  ): Promise<T> => {
    let start: number | undefined;
    try {
      return await deps.tx.run(async ({ conn, emit }) => {
        start = performance.now();
        const row = await owned(conn, userId, id, true);
        const result = await change(conn, row, emit);
        emit({ type: 'conversation.changed', conversationId: id, userId });
        return result;
      });
    } finally {
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
  const native = new NativeSessionStore(deps);
  return {
    native,
    async recoverAtStartup() {
      const startedAt = new Date(performance.timeOrigin);
      const stale = (row: ConversationRecord) => {
        const value = jsonObject(row.metadata).onlineAgent as
          OnlineAgentMetadata | undefined;
        return (
          !jsonObject(row.metadata).runnerOnlineAgent &&
          value?.version === 1 &&
          value.call?.state !== 'waitingApproval' &&
          new Date(row.updatedAt) < startedAt &&
          (value.call?.state === 'running' ||
            value.call?.closing ||
            value.call?.requiresEffectReview)
        );
      };
      let cursor: string | undefined;
      for (;;) {
        let scan = deps.tx
          .read()
          .query.selectFrom('agConversations')
          .select('id')
          .where('mode', '=', 'online')
          .where('createdAt', '<', startedAt);
        if (cursor !== undefined) scan = scan.where('id', '>', cursor);
        const ids = await scan.orderBy('id').limit(200).execute();
        if (!ids.length) break;
        const rows = await conversationsRepo(deps.tx.read()).findMany({
          filter: (f) =>
            f.or(ids.map((row) => f.string('id').eq(String(row.id)))),
          sort: (s) => s.field('id').asc(),
        });
        cursor = String(ids.at(-1)!.id);
        for (const candidate of rows.filter(stale)) {
          await write(
            candidate.userId,
            candidate.id,
            'startup',
            async (conn, row, emit) => {
              if (!stale(row)) return;
              const value = metadata(row);
              const {
                closing: _closing,
                requiresEffectReview: _review,
                ...call
              } = value.call!;
              if (!call.messageId)
                throw invalid(
                  'An internal UI message identity is required to recover this execution.',
                );
              const unfinished = !call.outcome;
              const lastSeq = await native.recover(conn, row, call);
              await saveMetadata(
                conn,
                row,
                { ...value, call: { ...call, state: 'idle' } },
                {
                  lastSeq,
                  ...(unfinished
                    ? { read: false, lastMessageAt: deps.now() }
                    : {}),
                  updatedAt: deps.now(),
                },
              );
              if (call.revision !== undefined)
                emit({
                  type: 'conversation.changed',
                  conversationId: row.id,
                  userId: row.userId,
                  messageId: call.messageId,
                  revision: call.revision,
                });
            },
          );
        }
        if (ids.length < 200) break;
      }
    },
    async defaults(userId) {
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
    async create(userId, kind, config, model, info) {
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
    async load(userId, id) {
      return session(await owned(deps.tx.read(), userId, id));
    },
    async configure(userId, id, config, model) {
      await write(userId, id, 'configure', async (conn, row) => {
        const value = metadata(row);
        if (
          value.call?.state === 'running' ||
          value.call?.state === 'waitingApproval' ||
          value.call?.closing
        )
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
    async history(userId, id) {
      return (await native.executionHistory(userId, id, undefined, false))
        .model;
    },
    async executionHistory(userId, id, current) {
      return (await native.executionHistory(userId, id, current)).model;
    },
    async finish(userId, id) {
      await write(userId, id, 'finish', async (conn, row) => {
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
