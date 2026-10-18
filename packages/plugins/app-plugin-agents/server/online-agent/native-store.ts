import { publicUIPageContext } from '../../shared/ui-message.js';
import { isDeepStrictEqual } from 'node:util';
import { isToolUIPart, type ModelMessage, type UIMessage } from 'ai';
import type { DatabaseConnection } from '@nocobase/db';
import {
  appUIMessageText,
  validateAppUIMessages,
  type AppUIMessage,
  type AppUIToolApprovalInput,
} from '../../shared/online-agent.js';
import type { ResolvedPageContext } from '../../shared/conversations.js';
import {
  chatAttachmentUrl,
  type ChatAttachmentService,
  type ChatAttachmentLinks,
  storedAttachments,
} from '../core/conversations/attachments.js';
import {
  historicalPageContext,
  latestPageContext,
  type PageContextKinds,
} from '../core/conversations/page-context.js';
import {
  conversationsRepo,
  findConversation,
  lockConversation,
  messagesRepo,
  type ConversationRecord,
} from '../core/conversations/conversation.store.js';
import { conflict, invalid, notFound } from '../kernel/errors.js';
import { asJson, jsonObject } from '../kernel/values.js';
import type { Tx, TxRunner } from '../kernel/tx.js';
import { OnlineAgentConfigurator, type OnlineAgentConfig } from './config.js';
import type { OnlineAgentCall } from './sessions.js';
import { NativeMessages, type NativeMessage } from './messages.js';
export type NativeApproval = AppUIToolApprovalInput;
export type NativeSnapshot = {
  message: NativeMessage;
};
export type NativeHistoryQuery = {
  ids?: string[];
  before?: number;
  after?: number;
  limit: number;
};
export type NativeHistoryPage = {
  items: AppUIMessage[];
  lastSeq: number;
  hasMore: boolean;
  nextAfter?: number;
};

export type NativeInput = {
  id: string;
  parts: NativeMessage['parts'];
  attachments: string[];
  clientId?: string;
  workContext?: ResolvedPageContext;
  providerOptions?: ModelMessage['providerOptions'];
};

export class NativeSessionStore {
  messages: NativeMessages = new NativeMessages(new OnlineAgentConfigurator());
  constructor(
    private deps: {
      tx: TxRunner;
      attachments: ChatAttachmentLinks;
      files?: Pick<ChatAttachmentService, 'content'>;
      contextKinds?: PageContextKinds;
      basePath?: () => string;
      now(): string;
      measure?: (phase: string, durationMs: number) => void;
    },
  ) {}

  private async owned(
    userId: string,
    id: string,
    conn = this.deps.tx.read(),
    lock = false,
  ): Promise<ConversationRecord> {
    const row = lock
      ? await lockConversation(conn, id, this.deps.now())
      : await findConversation(conn, id);
    if (!row || row.userId !== userId) throw notFound('Conversation');
    if (
      !['realtime', 'background'].includes(
        String(jsonObject(jsonObject(row.metadata).onlineAgent).kind),
      )
    )
      throw invalid('A native OnlineAgent conversation is required.');
    return row;
  }
  private async write<T>(
    userId: string,
    id: string,
    phase: string,
    work: (
      conn: DatabaseConnection,
      row: ConversationRecord,
      changed: (message: NativeMessage) => void,
    ) => Promise<T>,
    outer?: { unit: Tx; row: ConversationRecord },
  ): Promise<T> {
    let start: number | undefined;
    try {
      return await this.deps.tx.run(async ({ conn, emit }) => {
        start = performance.now();
        const row = outer?.row ?? (await this.owned(userId, id, conn, true));
        const result = await work(conn, row, (message) =>
          emit({
            type: 'conversation.changed',
            conversationId: id,
            userId,
            messageId: message.id,
            revision: message.metadata!.revision,
          }),
        );
        emit({ type: 'conversation.changed', conversationId: id, userId });
        return result;
      }, outer?.unit);
    } finally {
      // Includes lock acquisition and commit, a conservative upper bound on lock ownership.
      if (start !== undefined)
        this.deps.measure?.(phase, performance.now() - start);
    }
  }
  private update(
    conn: DatabaseConnection,
    row: ConversationRecord,
    call: OnlineAgentCall,
    extra: Record<string, unknown> = {},
  ): Promise<unknown> {
    const binding = jsonObject(jsonObject(row.metadata).onlineAgent);
    return conversationsRepo(conn).updateMany({
      filter: { id: row.id },
      values: {
        ...extra,
        updatedAt: this.deps.now(),
        metadata: asJson({
          ...jsonObject(row.metadata),
          onlineAgent: { ...binding, call },
        }),
      },
    });
  }
  /** Independent application notifications, including after the model response has ended. */
  deliver(
    userId: string,
    id: string,
    messageId: string,
    parts: AppUIMessage['parts'],
    outer?: { unit: Tx; row: ConversationRecord },
  ): Promise<AppUIMessage> {
    return this.write(
      userId,
      id,
      'native.notify',
      async (conn, row, changed) => {
        if (
          !parts.length ||
          parts.some(
            (part) =>
              part.type !== 'data-notice' && part.type !== 'data-business',
          )
        )
          throw invalid('Notifications accept only public data parts.');
        const existing = await messagesRepo(conn).findOne({
          filter: { id: messageId },
        });
        if (existing) {
          if (existing.conversationId !== id)
            throw conflict(
              'This notification ID already belongs to another conversation.',
            );
          const message = (
            await validateAppUIMessages([jsonObject(existing.content).original])
          )[0];
          if (
            message.role !== 'system' ||
            !isDeepStrictEqual(message.parts, parts)
          )
            throw conflict('This notification ID has different content.');
          return message;
        }
        const message: AppUIMessage = {
          id: messageId,
          role: 'system',
          metadata: {
            conversationId: id,
            createdAt: this.deps.now(),
            revision: 1,
            seq: Number(row.lastSeq) + 1,
          },
          parts,
        };
        await validateAppUIMessages([message]);
        await messagesRepo(conn).createOne({
          values: {
            id: messageId,
            conversationId: id,
            seq: message.metadata!.seq!,
            role: 'system',
            content: asJson({ type: 'text', content: '', original: message }),
            searchText: '',
            metadata: asJson({}),
            attachments: null,
            toolCalls: null,
            workContext: null,
            runId: null,
            runEventSeq: null,
            createdAt: message.metadata!.createdAt,
            updatedAt: this.deps.now(),
          },
        });
        await conversationsRepo(conn).updateMany({
          filter: { id },
          values: {
            lastSeq: message.metadata!.seq!,
            read: false,
            lastMessageAt: this.deps.now(),
            updatedAt: this.deps.now(),
          },
        });
        changed(message);
        return message;
      },
      outer,
    );
  }
  /** Server startup only: the previous process must have exited under single-instance deployment. */
  async recover(
    conn: DatabaseConnection,
    row: ConversationRecord,
    call: OnlineAgentCall,
  ): Promise<number> {
    const existing = call.messageId
      ? await messagesRepo(conn).findOne({
          filter: { id: call.messageId, conversationId: row.id },
        })
      : null;
    const savedOutcome = jsonObject(existing?.metadata).nativeOutcome;
    if (call.outcome && existing && savedOutcome === call.outcome)
      return Number(row.lastSeq);
    const text =
      'The server stopped before this execution finished. Some actions may have completed; check their results before repeating them.';
    const previous = existing
      ? (
          await this.messages.validate([jsonObject(existing.content).original])
        )[0]
      : undefined;
    const evidence: NativeMessage = previous ?? {
      id: call.messageId!,
      role: 'assistant',
      parts: [],
    };
    for (const part of evidence.parts) {
      if (
        isToolUIPart(part) &&
        !['output-available', 'output-error', 'output-denied'].includes(
          part.state,
        )
      )
        Object.assign(part, {
          state: 'output-error',
          errorText:
            'Tool result unknown. The action may have completed; check its result before repeating it.',
        });
    }
    const message: NativeMessage = {
      id: call.messageId!,
      role: 'assistant',
      metadata: {
        ...previous?.metadata,
        conversationId: row.id,
        createdAt: previous?.metadata?.createdAt ?? this.deps.now(),
        seq: existing ? Number(existing.seq) : Number(row.lastSeq) + 1,
        revision: (previous?.metadata?.revision ?? 0) + 1,
        ...(call.executionId
          ? { executionId: call.executionId, turnId: call.executionId }
          : {}),
      },
      parts: [
        ...(evidence.parts.filter(
          (part) =>
            part.type !== 'data-notice' || part.id !== 'execution-status',
        ) ?? []),
        {
          type: 'data-notice',
          id: 'execution-status',
          data: { type: 'failed', title: text },
        },
      ],
    };
    await this.messages.validate([message]);
    const publicMessage = (await this.messages.public([message]))[0];
    const values = {
      content: asJson({
        type: 'text',
        content: appUIMessageText(publicMessage),
        original: message,
      }),
      searchText: appUIMessageText(publicMessage),
      metadata: asJson({
        ...jsonObject(existing?.metadata),
        nativeOutcome: 'failed',
      }),
      updatedAt: this.deps.now(),
    };
    if (existing)
      await messagesRepo(conn).updateMany({
        filter: { id: existing.id },
        values,
      });
    else
      await messagesRepo(conn).createOne({
        values: {
          ...values,
          id: message.id,
          conversationId: row.id,
          seq: message.metadata!.seq!,
          role: 'assistant',
          createdAt: message.metadata!.createdAt,
          toolCalls: null,
          attachments: null,
          workContext: null,
          runId: null,
          runEventSeq: null,
        },
      });
    call.state = 'idle';
    call.outcome = 'failed';
    call.error = text;
    delete call.result;
    call.revision = message.metadata!.revision;
    return Math.max(Number(row.lastSeq), message.metadata!.seq!);
  }
  async history(
    userId: string,
    id: string,
    ids?: string[],
  ): Promise<AppUIMessage[]> {
    await this.owned(userId, id);
    const rows = await messagesRepo(this.deps.tx.read()).findMany({
      filter: (f) =>
        f.and([
          f.string('conversationId').eq(id),
          ...(ids ? [f.or(ids.map((id) => f.string('id').eq(id)))] : []),
        ]),
      sort: (s) => s.field('seq').asc(),
    });
    const selected = rows;
    if (!selected.length) return [];
    return this.messages.public(
      await this.messages.validate(
        selected.map((row) => jsonObject(row.content).original),
      ),
    );
  }
  async page(
    userId: string,
    id: string,
    query: NativeHistoryQuery,
  ): Promise<NativeHistoryPage> {
    const owner = await this.owned(userId, id);
    const rows = await messagesRepo(this.deps.tx.read()).findMany({
      filter: (f) =>
        f.and([
          f.string('conversationId').eq(id),
          ...(query.ids
            ? [f.or(query.ids.map((id) => f.string('id').eq(id)))]
            : []),
          ...(query.before !== undefined
            ? [f.number('seq').lt(query.before)]
            : []),
          ...(query.after !== undefined
            ? [f.number('seq').gt(query.after)]
            : []),
        ]),
      sort: (s) =>
        query.after !== undefined || query.ids
          ? s.field('seq').asc()
          : s.field('seq').desc(),
      limit: query.ids ? query.ids.length : query.limit + 1,
    });
    const hasMore = !query.ids && rows.length > query.limit;
    const selected = rows.slice(0, query.ids ? rows.length : query.limit);
    if (query.after === undefined && !query.ids) selected.reverse();
    return {
      items: selected.length
        ? await this.messages.public(
            await this.messages.validate(
              selected.map((row) => jsonObject(row.content).original),
            ),
          )
        : [],
      hasMore,
      lastSeq: Number(owner.lastSeq),
      ...(query.after !== undefined && hasMore && selected.length
        ? { nextAfter: Number(selected.at(-1)!.seq) }
        : {}),
    };
  }
  async executionHistory(
    userId: string,
    id: string,
    context?: ResolvedPageContext,
    page = true,
  ): Promise<{ ui: UIMessage[]; model: ModelMessage[]; page?: ModelMessage }> {
    const owner = await this.owned(userId, id);
    const rows = await messagesRepo(this.deps.tx.read()).findMany({
      filter: { conversationId: id },
      sort: (s) => s.field('seq').asc(),
    });
    if (!rows.length) return { ui: [], model: [] };
    const original = await this.messages.validate(
      rows.map((row) => jsonObject(row.content).original),
    );
    const ui = structuredClone(original);
    for (const message of ui) {
      const row = rows.find((row) => row.id === message.id)!;
      if (
        message.role === 'assistant' &&
        ['failed', 'cancelled'].includes(
          String(jsonObject(row.metadata).nativeOutcome),
        )
      ) {
        message.parts = message.parts.filter(
          (part) =>
            part.type === 'step-start' ||
            (isToolUIPart(part) &&
              ['output-available', 'output-error', 'output-denied'].includes(
                part.state,
              )),
        );
      }
      for (const part of message.parts) {
        if (part.type !== 'file') continue;
        const file = storedAttachments(row.attachments).find(
          (file) =>
            chatAttachmentUrl(this.deps.basePath?.() ?? '', file.id) ===
            part.url,
        );
        if (!file) {
          if (
            message.role === 'user' &&
            jsonObject(jsonObject(owner.metadata).onlineAgent).kind ===
              'background' &&
            (message.metadata?.inputFiles ?? []).includes(
              message.parts.indexOf(part),
            )
          )
            continue;
          if (message.role === 'assistant' && part.url.startsWith('data:'))
            continue;
          throw invalid('A saved file reference cannot be authorized.');
        }
        if (!this.deps.files)
          throw invalid('Attachment content is unavailable.');
        const authorized = await this.deps.files.content({ userId }, file.id);
        const bytes = Buffer.from(
          await new Response(authorized.body).arrayBuffer(),
        );
        part.url = `data:${file.mimeType};base64,${bytes.toString('base64')}`;
      }
    }
    const model = await this.messages.model(ui);
    const current =
      page && this.deps.contextKinds
        ? await historicalPageContext(
            this.deps.contextKinds,
            this.deps.tx.read(),
            userId,
            latestPageContext(rows),
            context,
          )
        : undefined;
    const historical: ModelMessage | undefined = current
      ? { role: 'user', content: current }
      : undefined;
    if (historical) model.push(historical);
    return { ui: original, model, page: historical };
  }
  accept(
    userId: string,
    id: string,
    input: NativeInput | NativeInput[],
    config: OnlineAgentConfig,
    model: { modelService: string; model: string },
    executionId: string,
    messageId: string,
    expected: {
      config: OnlineAgentConfig;
      model: { modelService: string; model: string };
    },
  ): Promise<number> {
    const inputs = structuredClone(Array.isArray(input) ? input : [input]);
    return this.write(
      userId,
      id,
      'native.accept',
      async (conn, row, changed) => {
        const call = jsonObject(jsonObject(row.metadata).onlineAgent)
          .call as OnlineAgentCall | null;
        if (
          call?.state === 'running' ||
          call?.state === 'waitingApproval' ||
          call?.closing ||
          row.archivedAt ||
          row.syncRunId
        ) {
          throw conflict('This conversation cannot accept input.');
        }
        if (
          !inputs.length ||
          inputs.some((item) => !item.id || item.id.length > 64)
        ) {
          throw invalid('A message ID of at most 64 characters is required.');
        }
        if (
          !isDeepStrictEqual(
            jsonObject(jsonObject(row.metadata).onlineAgent).config,
            expected.config,
          ) ||
          row.model !== expected.model.model ||
          row.modelService !== expected.model.modelService
        ) {
          throw conflict(
            'The conversation configuration has changed. Refresh before sending.',
          );
        }
        let seq = Number(row.lastSeq);
        const title: string[] = [];
        for (const item of inputs) {
          const files = await this.deps.attachments.attach(
            conn,
            userId,
            { conversationId: id, messageId: item.id },
            item.attachments,
          );
          const message: NativeMessage = {
            id: item.id,
            role: 'user',
            metadata: {
              conversationId: id,
              createdAt: this.deps.now(),
              revision: 1,
              seq: ++seq,
              executionId,
              turnId: executionId,
              ...(item.clientId ? { clientId: item.clientId } : {}),
              ...(item.providerOptions
                ? { inputProviderOptions: item.providerOptions }
                : {}),
              ...(item.parts.some((part) => part.type === 'file')
                ? {
                    inputFiles: item.parts.flatMap((part, index) =>
                      part.type === 'file' ? [index] : [],
                    ),
                  }
                : {}),
              ...(item.workContext
                ? { context: publicUIPageContext(item.workContext) }
                : {}),
            },
            parts: [
              ...item.parts,
              ...files.map((file) => ({
                type: 'file' as const,
                filename: file.filename,
                mediaType: file.mimeType,
                url: chatAttachmentUrl(this.deps.basePath?.() ?? '', file.id),
              })),
            ],
          };
          await this.messages.validate([message]);
          const publicMessage = (await this.messages.public([message]))[0];
          const text = appUIMessageText(publicMessage);
          title.push(text);
          await messagesRepo(conn).createOne({
            values: {
              id: message.id,
              conversationId: id,
              seq,
              role: 'user',
              content: asJson({
                type: 'text',
                content: text,
                original: message,
              }),
              searchText: text,
              toolCalls: null,
              attachments: files.length ? asJson(files) : null,
              workContext: asJson(item.workContext),
              metadata: asJson(
                item.clientId ? { clientId: item.clientId } : {},
              ),
              runId: null,
              runEventSeq: null,
              createdAt: message.metadata!.createdAt,
              updatedAt: this.deps.now(),
            },
          });
          changed(message);
        }
        const binding = jsonObject(jsonObject(row.metadata).onlineAgent);
        await conversationsRepo(conn).updateMany({
          filter: { id },
          values: {
            metadata: asJson({
              ...jsonObject(row.metadata),
              onlineAgent: {
                ...binding,
                config,
                call: {
                  actorId: userId,
                  state: 'running',
                  executionId,
                  messageId,
                },
              },
            }),
            modelService: model.modelService,
            model: model.model,
            lastSeq: seq,
            title: row.title ?? title.join(' ').slice(0, 30),
            read: true,
            lastMessageAt: this.deps.now(),
            updatedAt: this.deps.now(),
          },
        });
        return seq;
      },
    );
  }
  approve(
    userId: string,
    id: string,
    input: NativeApproval,
  ): Promise<{ message: NativeMessage; waiting: boolean }> {
    return this.write(
      userId,
      id,
      'native.approve',
      async (conn, row, changed) => {
        const call = jsonObject(jsonObject(row.metadata).onlineAgent)
          .call as OnlineAgentCall | null;
        if (
          !call ||
          call.actorId !== userId ||
          call.closing ||
          call.state !== 'waitingApproval' ||
          call.messageId !== input.messageId ||
          call.executionId !== input.executionId ||
          !call.approvalExpiresAt ||
          Date.parse(call.approvalExpiresAt) <= Date.parse(this.deps.now())
        )
          throw conflict('This approval is expired or no longer pending.');
        const record = await messagesRepo(conn).findOne({
          filter: { id: input.messageId, conversationId: id },
        });
        if (!record) throw conflict('The approval message is unavailable.');
        const publicMessage = (
          await this.messages.validate([jsonObject(record.content).original])
        )[0];
        if (publicMessage.metadata?.executionId !== input.executionId)
          throw conflict('The approval belongs to another execution.');
        let found = 0;
        for (const message of [publicMessage])
          for (const part of message.parts) {
            if (
              (part.type.startsWith('tool-') || part.type === 'dynamic-tool') &&
              'approval' in part &&
              part.state === 'approval-requested' &&
              part.approval.id === input.approval.id
            ) {
              Object.assign(part, {
                state: 'approval-responded',
                approval: { ...part.approval, ...input.approval },
              });
              found += 1;
            }
          }
        if (found !== 1)
          throw conflict('The requested tool approval is not pending.');
        const waiting = publicMessage.parts.some(
          (part) => isToolUIPart(part) && part.state === 'approval-requested',
        );
        publicMessage.metadata.revision += 1;
        for (const part of publicMessage.parts)
          if (part.type === 'data-notice' && part.id === 'execution-status')
            part.data = waiting
              ? { type: 'approval', title: 'Waiting for approval' }
              : { type: 'running', title: 'Continuing' };
        await messagesRepo(conn).updateMany({
          filter: { id: record.id },
          values: {
            content: asJson({
              ...jsonObject(record.content),
              original: publicMessage,
            }),
            updatedAt: this.deps.now(),
          },
        });
        await this.update(conn, row, {
          ...call,
          state: waiting ? 'waitingApproval' : 'running',
          revision: publicMessage.metadata.revision,
        });
        changed(publicMessage);
        return { message: publicMessage, waiting };
      },
    );
  }
  stop(userId: string, id: string): Promise<void> {
    return this.write(
      userId,
      id,
      'native.stopApproval',
      async (conn, row, changed) => {
        const call = jsonObject(jsonObject(row.metadata).onlineAgent)
          .call as OnlineAgentCall | null;
        if (call?.state !== 'waitingApproval' || !call.messageId)
          throw conflict('This execution is not waiting for approval.');
        const record = await messagesRepo(conn).findOne({
          filter: { id: call.messageId, conversationId: id },
        });
        if (!record) throw conflict('The approval message is unavailable.');
        const publicMessage = (
          await this.messages.validate([jsonObject(record.content).original])
        )[0];
        for (const message of [publicMessage])
          for (const part of message.parts) {
            if (
              'approval' in part &&
              'state' in part &&
              (part.state === 'approval-requested' ||
                part.state === 'approval-responded') &&
              part.approval
            )
              Object.assign(part, {
                state: 'output-denied',
                approval: {
                  ...part.approval,
                  approved: false,
                  reason: 'Stopped by the conversation owner.',
                },
              });
          }
        publicMessage.metadata!.revision += 1;
        for (const part of publicMessage.parts)
          if (part.type === 'data-notice' && part.id === 'execution-status')
            part.data = { type: 'cancelled', title: 'Stopped' };
        await messagesRepo(conn).updateMany({
          filter: { id: record.id },
          values: {
            content: asJson({
              ...jsonObject(record.content),
              original: publicMessage,
            }),
            metadata: asJson({
              ...jsonObject(record.metadata),
              nativeOutcome: 'cancelled',
            }),
            updatedAt: this.deps.now(),
          },
        });
        await this.update(conn, row, {
          ...call,
          state: 'idle',
          outcome: 'cancelled',
          revision: publicMessage.metadata!.revision,
        });
        changed(publicMessage);
      },
    );
  }
  save(
    userId: string,
    id: string,
    snapshot: NativeSnapshot,
    call: OnlineAgentCall,
    revision: number,
  ): Promise<AppUIMessage> {
    return this.write(userId, id, 'native.save', async (conn, row, changed) => {
      const existing = await messagesRepo(conn).findOne({
        filter: { id: snapshot.message.id, conversationId: id },
      });
      const message = structuredClone(snapshot.message);
      message.metadata!.seq = existing
        ? Number(existing.seq)
        : Number(row.lastSeq) + 1;
      message.metadata!.revision = revision + 1;
      await this.messages.validate([message]);
      const publicMessage = (await this.messages.public([message]))[0];
      const current = existing
        ? jsonObject(jsonObject(existing.content).original).metadata
        : null;
      if (existing && jsonObject(current).revision !== revision) {
        if (isDeepStrictEqual(jsonObject(existing.content).original, message))
          return publicMessage;
        // Only trusted approval/continuation writes can advance this same native message and execution.
        // A newer revision therefore acknowledges an earlier commit whose response was lost.
        if (
          existing.role === 'assistant' &&
          typeof jsonObject(current).revision === 'number' &&
          Number(jsonObject(current).revision) > revision + 1 &&
          jsonObject(current).executionId === message.metadata!.executionId &&
          jsonObject(current).conversationId === id
        )
          return (
            await this.messages.public(
              await this.messages.validate([
                jsonObject(existing.content).original,
              ]),
            )
          )[0];
        throw conflict('The message revision has changed.');
      }
      const currentCall = jsonObject(
        jsonObject(jsonObject(row.metadata).onlineAgent).call,
      );
      if (
        currentCall.state !== 'running' ||
        currentCall.executionId !== call.executionId ||
        currentCall.messageId !== message.id
      )
        throw conflict('This execution no longer owns the conversation.');
      const values = {
        content: asJson({
          type: 'text',
          content: appUIMessageText(publicMessage),
          original: message,
        }),
        searchText: appUIMessageText(publicMessage),
        metadata: asJson({
          nativeOutcome: call.outcome,
        }),
        updatedAt: this.deps.now(),
      };
      if (existing)
        await messagesRepo(conn).updateMany({
          filter: { id: existing.id },
          values,
        });
      else
        await messagesRepo(conn).createOne({
          values: {
            ...values,
            id: message.id,
            conversationId: id,
            seq: message.metadata!.seq,
            role: message.role,
            toolCalls: null,
            attachments: null,
            workContext: null,
            runId: null,
            runEventSeq: null,
            createdAt: message.metadata!.createdAt,
          },
        });
      const visible = publicMessage.parts.some((part) =>
        part.type === 'text'
          ? part.text.trim().length > 0
          : part.type === 'file' ||
            isToolUIPart(part) ||
            part.type === 'data-business',
      );
      await this.update(
        conn,
        row,
        { ...call, revision: message.metadata!.revision },
        {
          lastSeq: Math.max(Number(row.lastSeq), message.metadata!.seq),
          ...(visible ? { read: false } : {}),
          lastMessageAt: this.deps.now(),
        },
      );
      changed(message);
      return publicMessage;
    });
  }
}
