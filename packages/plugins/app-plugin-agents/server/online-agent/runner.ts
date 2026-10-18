import { isDeepStrictEqual } from 'node:util';
import type { ModelMessage } from 'ai';
import type { ConversationMessage } from '../../shared/conversations.js';
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
import type {
  OnlineAgentStreamManager,
  OnlineAgentStreamWriter,
} from './streams.js';

type Execution = {
  id: string;
  userId: string;
  runId?: string;
  cursor: number;
  writer: OnlineAgentStreamWriter;
  pending?: Promise<void>;
  again: boolean;
  timer?: ReturnType<typeof setTimeout>;
  streamFailed?: boolean;
  cleared?: boolean;
};

/** A conversation adapter over the existing Runner queue, events and canonical history. */
export class RunnerOnlineAgentAdapter implements OnlineAgentRunnerBackend {
  private active = new Map<string, Execution>();
  private restoring = new Map<string, Promise<void>>();
  private stopping = false;
  constructor(
    private deps: {
      tx: TxRunner;
      conversations: ConversationService;
      streams: OnlineAgentStreamManager;
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
            showInChatList: options.showInChatList,
          },
          config,
        )
      ).id;
    const row = await this.owned(context.user.id, id);
    if (row.agentId !== config.agentId)
      throw conflict('Start a new conversation to choose another agent.');
    if (!this.active.has(id) && !this.restoring.has(id)) {
      const task = (async () => {
        const runId =
          runnerBinding(row.metadata)?.closingRunId ??
          (await openRunsOnEach(this.deps.tx.read(), 'conversation', [id]))[0]
            ?.id;
        if (runId && !this.active.has(id)) {
          if (this.active.size >= 1024)
            throw conflict('OnlineAgent execution limit exceeded.');
          const writer = await this.deps.streams.open(id, 0);
          const execution: Execution = {
            id,
            userId: context.user.id,
            runId,
            cursor: 0,
            writer,
            again: false,
          };
          this.active.set(id, execution);
          void this.refresh(execution).catch((error) =>
            this.deps.onError(error),
          );
        }
      })();
      this.restoring.set(id, task);
    }
    const restored = this.restoring.get(id);
    if (restored) {
      try {
        await restored;
      } finally {
        if (this.restoring.get(id) === restored) this.restoring.delete(id);
      }
    }

    const history = async (): Promise<ConversationMessage[]> => {
      await this.owned(context.user.id, id);
      const rows = await messagesRepo(this.deps.tx.read()).findMany({
        filter: { conversationId: id },
        sort: (sort) => sort.field('seq').asc(),
      });
      return rows.map((row) => toMessage(row, this.deps.basePath()));
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
      status,
      receive: async () => {
        await this.owned(context.user.id, id);
        const execution = this.active.get(id);
        if (execution) await this.refresh(execution);
        return this.deps.streams.receive(id);
      },
      retryFinalization: async () => {
        await this.owned(context.user.id, id);
        const execution = this.active.get(id);
        if (execution) await this.refresh(execution);
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
        const writer = await this.deps.streams.open(id, Number(before.lastSeq));
        const execution: Execution = {
          id,
          userId: context.user.id,
          cursor: Number(before.lastSeq),
          writer,
          again: false,
        };
        this.active.set(id, execution);
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
          void this.refresh(execution).catch((error) =>
            this.deps.onError(error),
          );
          return accepted.message.seq;
        } catch (error) {
          this.active.delete(id);
          await writer.discard();
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
    if (!execution.runId || this.active.get(execution.id) !== execution)
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
    // syncRun checks its persisted cursor before acquiring any write lock.
    let row = await this.owned(execution.userId, execution.id);
    while (Number(row.lastSeq) > execution.cursor) {
      const page = await this.deps.conversations.messages(
        execution.userId,
        execution.id,
        { after: execution.cursor, limit: 200 },
      );
      if (!page.items.length) break;
      for (const message of page.items) {
        if (!execution.streamFailed) {
          try {
            await execution.writer.message(message);
          } catch (error) {
            execution.streamFailed = true;
            await execution.writer.discard(
              new Error(
                'The stream cache limit was exceeded; refresh saved history.',
              ),
            );
            this.deps.onError(error);
          }
        }
        execution.cursor = message.seq;
      }
      row = await this.owned(execution.userId, execution.id);
    }
    if (!this.terminal(run)) return;
    await execution.writer.seal();
    const started = performance.now();
    try {
      if (!execution.cleared)
        await this.deps.tx.run(async (unit) => {
          const current = await lockConversation(
            unit.conn,
            execution.id,
            this.deps.now(),
          );
          if (!current || current.userId !== execution.userId)
            throw notFound('Conversation');
          const binding = runnerBinding(current.metadata);
          if (binding?.closingRunId && binding.closingRunId !== run.id)
            throw conflict('Another execution is being finalized.');
          if (binding?.closingRunId) {
            const { closingRunId: _closed, ...kept } = binding;
            await conversationsRepo(unit.conn).updateMany({
              filter: { id: current.id },
              values: {
                metadata: asJson({
                  ...jsonObject(current.metadata),
                  runnerOnlineAgent: kept,
                }),
              },
            });
          }
        });
      execution.cleared = true;
    } finally {
      this.deps.measure?.('runner-finish', performance.now() - started);
    }
    await execution.writer.finish(
      run.status === 'completed'
        ? 'completed'
        : run.status === 'cancelled'
          ? 'cancelled'
          : 'failed',
      Number(row.lastSeq),
    );
    if (this.active.get(execution.id) === execution)
      this.active.delete(execution.id);
    clearTimeout(execution.timer);
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
    for (const execution of this.active.values())
      await execution.writer.discard();
    this.active.clear();
    // Browser and application shutdown do not cancel or redispatch Runner work.
  }
}
