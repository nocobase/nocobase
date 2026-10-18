import {
  runnerUIMessages,
  runnerUIPage,
  runnerMessageId,
} from './runner-ui.js';
import { OnlineAgentUIStreams, type UIStreamChannel } from './ui-streams.js';
import type { AppUIMessage } from '../../shared/online-agent.js';
import { isDeepStrictEqual } from 'node:util';
import type { ModelMessage } from 'ai';
import type { Run } from '../../shared/runs.js';
import type { ConversationService } from '../core/conversations/ports.js';
import {
  conversationsRepo,
  findConversation,
  lockConversation,
  messagesRepo,
  toMessage,
} from '../core/conversations/conversation.store.js';
import { openRunsOnEach } from '../core/runs/index.js';
import { findRunRecord, toRun } from '../core/runs/run.store.js';
import { conflict, forbidden, invalid, notFound } from '../kernel/errors.js';
import type { TxRunner } from '../kernel/tx.js';
import { asJson, jsonObject } from '../kernel/values.js';
import type { OnlineAgentConfig, OnlineAgentContext } from './config.js';
import type {
  OnlineAgentRealtimeOptions,
  OnlineAgentRealtimeSession,
  OnlineAgentRunnerBackend,
  OnlineAgentSendOptions,
} from './realtime.js';
import { runnerBinding } from './runner-metadata.js';

type Execution = {
  id: string;
  userId: string;
  runId?: string;
  cursor: number;
  writer: UIStreamChannel;
  published: Set<string>;
  ready: boolean;
  started: boolean;
  snapshot?: AppUIMessage;
  pending?: Promise<void>;
  again: boolean;
  timer?: ReturnType<typeof setTimeout>;
  streamFailed?: boolean;
  cleared?: boolean;
};

/** A conversation adapter over the existing Runner queue, events and canonical history. */
export class RunnerOnlineAgentAdapter implements OnlineAgentRunnerBackend {
  private active = new Map<string, Execution>();
  private stopping = false;
  constructor(
    private deps: {
      tx: TxRunner;
      conversations: ConversationService;
      streams: OnlineAgentUIStreams;
      now(): string;
      basePath(): string;
      onError(error: unknown): void;
      measure?(phase: string, durationMs: number): void;
    },
  ) {}

  private credentials(context: OnlineAgentContext): void {
    const credentials = jsonObject(context.credentials);
    if (
      context.authorization.identity.keyScope ||
      credentials.credential ||
      jsonObject(credentials.user).kind === 'service'
    )
      throw forbidden(
        'Runner chat cannot preserve restricted entry credentials.',
      );
  }
  private supported(
    config: OnlineAgentConfig,
    options?: OnlineAgentRealtimeOptions | OnlineAgentSendOptions,
  ): void {
    if (
      !config.agentId ||
      config.agentId === 'online' ||
      config.model.length ||
      config.tool.length ||
      config.thinking !== undefined ||
      options?.selectedModel
    )
      throw invalid(
        'Runner chat does not support native models, local tools or thinking configuration.',
      );
  }
  private async owned(userId: string, id: string) {
    const row = await findConversation(this.deps.tx.read(), id);
    if (!row || row.userId !== userId) throw notFound('Conversation');
    return row;
  }
  async configuration(
    context: OnlineAgentContext,
    id: string,
  ): Promise<OnlineAgentConfig | null> {
    const row = await this.owned(context.user.id, id);
    return runnerBinding(row.metadata)?.config ?? null;
  }
  async configure(
    context: OnlineAgentContext,
    id: string,
    config: OnlineAgentConfig,
    expectedConfig: OnlineAgentConfig,
  ): Promise<void> {
    this.credentials(context);
    this.supported(config);
    await this.deps.tx.run(async (unit) => {
      const row = await lockConversation(unit.conn, id, this.deps.now());
      if (!row || row.userId !== context.user.id)
        throw notFound('Conversation');
      const binding = runnerBinding(row.metadata);
      if (!binding)
        throw invalid('This is not a Runner OnlineAgent conversation.');
      if (!isDeepStrictEqual(binding.config, expectedConfig))
        throw conflict(
          'The conversation configuration changed; read it again.',
        );
      if (config.agentId !== row.agentId)
        throw conflict('Start a new conversation to choose another agent.');
      if (
        this.active.has(id) ||
        binding.closingRunId ||
        (await openRunsOnEach(unit.conn, 'conversation', [id])).length
      )
        throw conflict('This conversation is busy.');
      await conversationsRepo(unit.conn).updateMany({
        filter: { id },
        values: {
          metadata: asJson({
            ...jsonObject(row.metadata),
            runnerOnlineAgent: { ...binding, config },
          }),
        },
      });
    });
  }
  async open(
    context: OnlineAgentContext,
    config: OnlineAgentConfig,
    options: OnlineAgentRealtimeOptions,
    expectedConfig: OnlineAgentConfig = config,
  ): Promise<OnlineAgentRealtimeSession> {
    this.credentials(context);
    this.supported(config, options);
    const id =
      options.sessionId ??
      (
        await this.deps.conversations.create(
          context.user.id,
          {
            agentId: config.agentId,
            source: options.source,
            title: options.title,
          },
          config,
        )
      ).id;
    const row = await this.owned(context.user.id, id);
    if (row.agentId !== config.agentId)
      throw conflict('Start a new conversation to choose another agent.');
    const closingRunId = runnerBinding(row.metadata)?.closingRunId;
    if (closingRunId && !this.active.has(id)) {
      // Missing streams never imply completion. Only a saved terminal Run can release this gate.
      const stored = await findRunRecord(this.deps.tx.read(), closingRunId);
      if (stored && this.terminal(toRun(stored)))
        await this.finalizeSavedRun(context.user.id, id, closingRunId);
    }
    let response: UIStreamChannel | undefined;
    const history = async (): Promise<AppUIMessage[]> => {
      await this.owned(context.user.id, id);
      const rows = await messagesRepo(this.deps.tx.read()).findMany({
        filter: { conversationId: id },
        sort: (s) => s.field('seq').asc(),
      });
      return runnerUIMessages(
        rows.map((row) => toMessage(row, this.deps.basePath())),
      );
    };
    const status = async () => {
      const current = await this.owned(context.user.id, id);
      return this.active.has(id) ||
        runnerBinding(current.metadata)?.closingRunId ||
        (await openRunsOnEach(this.deps.tx.read(), 'conversation', [id])).length
        ? ('running' as const)
        : ('idle' as const);
    };
    return {
      sessionId: id,
      backend: 'runner',
      history,
      messages: async (query) => {
        const row = await this.owned(context.user.id, id);
        return runnerUIPage(
          this.deps.tx,
          id,
          Number(row.lastSeq),
          query,
          this.deps.basePath(),
        );
      },
      status,
      receive: async () => {
        await this.owned(context.user.id, id);
        return this.deps.streams.receive(
          context.user.id,
          id,
          response ?? this.active.get(id)?.writer,
        );
      },
      retryFinalization: async () => {
        await this.owned(context.user.id, id);
        const execution = this.active.get(id);
        if (execution) await this.refresh(execution);
        else {
          const row = await this.owned(context.user.id, id);
          const runId = runnerBinding(row.metadata)?.closingRunId;
          if (!runId) return;
          await this.finalizeSavedRun(context.user.id, id, runId);
        }
      },
      abort: async () => {
        await this.owned(context.user.id, id);
        // cancel is a request. The active projection and gate remain until terminal confirmation.
        await this.deps.conversations.stop(context.user.id, id);
        const execution = this.active.get(id);
        if (execution) await this.refresh(execution);
      },
      send: async (
        messages: ModelMessage[],
        input?: OnlineAgentSendOptions,
      ) => {
        if (this.stopping) throw conflict('OnlineAgent is stopping.');
        this.credentials(context);
        if (input?.overrides)
          throw invalid(
            'Resolve Runner configuration through the OnlineAgent service.',
          );
        this.supported(config, input);
        if (messages.length !== 1 || messages[0].role !== 'user')
          throw invalid('Runner chat accepts one user message per turn.');
        if (messages[0].providerOptions !== undefined)
          throw invalid(
            'Runner chat does not support provider-specific message options.',
          );
        const content = messages[0].content;
        if (
          Array.isArray(content) &&
          content.some(
            (part) =>
              part.type !== 'text' || part.providerOptions !== undefined,
          )
        )
          throw invalid(
            'Send Runner attachments by attachmentIds; native binary parts are unsupported.',
          );
        const text =
          typeof content === 'string'
            ? content
            : content
                .map((part) => (part.type === 'text' ? part.text : ''))
                .join('');
        if ((input?.attachmentIds?.length ?? 0) > 1)
          throw invalid('Attachments must belong to the single user message.');
        const before = await this.owned(context.user.id, id);
        if (this.active.has(id)) throw conflict('This conversation is busy.');
        if (this.active.size >= 1024)
          throw conflict('OnlineAgent execution limit exceeded.');
        // Install the channel before enqueue can notify a fast execution machine.
        const writer = await this.deps.streams.open(
          context.user.id,
          id,
          input?.clientId ?? id,
          'runner',
        );
        const execution: Execution = {
          id,
          userId: context.user.id,
          cursor: Number(before.lastSeq),
          writer,
          published: new Set(),
          ready: false,
          started: false,
          again: false,
        };
        this.active.set(id, execution);
        response = writer;
        try {
          const accepted = await this.deps.conversations.sendRealtime(
            context.user.id,
            id,
            {
              content: text,
              attachmentIds: input?.attachmentIds?.[0],
              clientId: input?.clientId,
            },
            {
              config,
              expectedConfig,
              workContext: input?.workContext,
              business: context.business,
            },
          );
          execution.runId = accepted.run!.id;
          execution.cursor = accepted.message.seq;
          await this.deps.streams
            .bind(id, writer, execution.runId)
            .catch((error) => writer.fail(error));
          execution.ready = true;
          void this.refresh(execution).catch((error) =>
            this.deps.onError(error),
          );
          return accepted.message.seq;
        } catch (error) {
          this.active.delete(id);
          await this.deps.streams.close(id, writer);
          throw error;
        }
      },
    };
  }
  /** Notifications wake a persisted read; they never supply authoritative text. */
  notify(runId: string): boolean {
    const execution = [...this.active.values()].find(
      (item) => item.runId === runId,
    );
    if (!execution) return false;
    void this.refresh(execution).catch((error) => this.deps.onError(error));
    return true;
  }
  private refresh(execution: Execution): Promise<void> {
    if (
      !execution.runId ||
      !execution.ready ||
      this.active.get(execution.id) !== execution
    )
      return Promise.resolve();
    if (execution.pending) {
      execution.again = true;
      return execution.pending;
    }
    clearTimeout(execution.timer);
    execution.pending = (async () => {
      do {
        execution.again = false;
        await this.read(execution);
      } while (execution.again && this.active.get(execution.id) === execution);
    })().finally(() => {
      execution.pending = undefined;
      if (!this.stopping && this.active.get(execution.id) === execution) {
        execution.timer = setTimeout(() => {
          void this.refresh(execution).catch((error) =>
            this.deps.onError(error),
          );
        }, 1000);
        execution.timer.unref();
      }
    });
    return execution.pending;
  }
  private async read(execution: Execution): Promise<void> {
    const run = await this.deps.conversations.syncRun(execution.runId!);
    if (run.actorUserId !== execution.userId || run.subject.id !== execution.id)
      throw forbidden('This run does not belong to the conversation.');
    // Existing synchronization commits first. Independent notices are delivered by durable business rereads.
    const row = await this.owned(execution.userId, execution.id);
    if (Number(row.lastSeq) > execution.cursor) {
      const records = await messagesRepo(this.deps.tx.read()).findMany({
        filter: {
          conversationId: execution.id,
          runId: execution.runId!,
          role: 'assistant',
        },
        sort: (s) => s.field('seq').asc(),
      });
      const message = runnerUIMessages(
        records.map((record) => toMessage(record, this.deps.basePath())),
      )[0];
      if (message) {
        if (!execution.started) {
          execution.writer.write({
            type: 'start',
            messageId: runnerMessageId(execution.runId!),
            messageMetadata: message.metadata!,
          });
          execution.started = true;
        }
        execution.writer.write({
          type: 'message-metadata',
          messageMetadata: message.metadata!,
        });
        for (const source of message.metadata!.sourceRecords!) {
          if (execution.published.has(source.partId)) continue;
          const part = message.parts[source.partIndex];
          if (part.type === 'text') {
            execution.writer.write({ type: 'text-start', id: source.partId });
            execution.writer.write({
              type: 'text-delta',
              id: source.partId,
              delta: part.text,
            });
            execution.writer.write({ type: 'text-end', id: source.partId });
          } else if (part.type === 'file')
            execution.writer.write({
              type: 'file',
              url: part.url,
              mediaType: part.mediaType,
              ...(part.filename ? { filename: part.filename } : {}),
            });
          execution.published.add(source.partId);
        }
        execution.snapshot = message;
      }
      execution.cursor = Number(row.lastSeq);
    }
    if (!this.terminal(run)) return;
    const started = performance.now();
    try {
      if (!execution.cleared)
        await this.clearClosing(execution.userId, execution.id, run.id);
      execution.cleared = true;
    } finally {
      this.deps.measure?.('runner-finish', performance.now() - started);
    }
    await this.deps.streams.release(execution.id, execution.writer);
    execution.writer.write({
      type: 'finish',
      finishReason: run.status === 'completed' ? 'stop' : 'other',
      ...(execution.snapshot
        ? { messageMetadata: execution.snapshot.metadata }
        : {}),
    });
    execution.writer.close();
    if (this.active.get(execution.id) === execution)
      this.active.delete(execution.id);
    clearTimeout(execution.timer);
  }
  private async finalizeSavedRun(
    userId: string,
    id: string,
    runId: string,
  ): Promise<void> {
    const run = await this.deps.conversations.syncRun(runId);
    if (
      run.actorUserId !== userId ||
      run.subject.kind !== 'conversation' ||
      run.subject.id !== id
    )
      throw forbidden('This run does not belong to the conversation.');
    if (!this.terminal(run))
      throw conflict('This run has not confirmed termination.');
    await this.deps.streams.forgetCompleted(userId, id, runId);
    await this.clearClosing(userId, id, runId);
  }
  private async clearClosing(
    userId: string,
    id: string,
    runId: string,
  ): Promise<void> {
    await this.deps.tx.run(async ({ conn }) => {
      const current = await lockConversation(conn, id, this.deps.now());
      if (!current || current.userId !== userId) throw notFound('Conversation');
      const binding = runnerBinding(current.metadata);
      if (binding?.closingRunId && binding.closingRunId !== runId)
        throw conflict('Another execution is being finalized.');
      if (!binding?.closingRunId) return;
      const { closingRunId: _closed, ...kept } = binding;
      await conversationsRepo(conn).updateMany({
        filter: { id },
        values: {
          metadata: asJson({
            ...jsonObject(current.metadata),
            runnerOnlineAgent: kept,
          }),
        },
      });
    });
  }
  private terminal(run: Run): boolean {
    return (
      run.status === 'completed' ||
      run.status === 'failed' ||
      run.status === 'cancelled'
    );
  }
  async shutdown(): Promise<void> {
    this.stopping = true;
    for (const execution of this.active.values()) clearTimeout(execution.timer);
    await Promise.allSettled(
      [...this.active.values()].map(
        (item) => item.pending ?? Promise.resolve(),
      ),
    );
    for (const execution of this.active.values()) execution.writer.close();
    this.active.clear();
    // Browser and application shutdown do not cancel or redispatch Runner work.
  }
}
