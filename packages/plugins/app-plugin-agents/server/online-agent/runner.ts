import type { BackgroundOnlineAgent, RealtimeOnlineAgent } from './agent.js';
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
import type { ModelRef } from '../../shared/models.js';
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
import type {
  OnlineAgentConfig,
  OnlineAgentConfigurator,
  OnlineAgentContext,
  OnlineAgentOptions,
} from './config.js';
import type {
  OnlineAgentRealtimeOptions,
  OnlineAgentSendOptions,
} from './realtime.js';
import type { NativeApproval, NativeHistoryQuery } from './native-store.js';
import {
  unsupportedCapability,
  type OnlineAgentBackend,
  type OnlineAgentBoundary,
  type OnlineAgentConfiguration,
  type OnlineAgentInitialConfiguration,
  type OnlineAgentNotification,
} from './backend.js';
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
  cleared?: boolean;
};

type RunnerDependencies = {
  tx: TxRunner;
  conversations: ConversationService;
  streams: OnlineAgentUIStreams;
  configurator: OnlineAgentConfigurator;
  now(): string;
  basePath(): string;
  onError(error: unknown): void;
  measure?(phase: string, durationMs: number): void;
};
type RunnerState = {
  active: Map<string, Execution>;
  admitting: Set<string>;
  admissions: Set<Promise<unknown>>;
  stopping: boolean;
  detaching: boolean;
};
type RunnerSessionHost = {
  deps: RunnerDependencies;
  state: RunnerState;
  refresh(execution: Execution): Promise<void>;
  finalizeSavedRun(userId: string, id: string, runId: string): Promise<void>;
};

function credentials(context: OnlineAgentContext): void {
  if (
    !context.user.id ||
    !context.authorization ||
    context.credentials === undefined ||
    context.credentials === null ||
    context.authorization.identity.principal?.type !== 'user' ||
    context.authorization.identity.principal.id !== context.user.id
  )
    throw invalid(
      'A trusted user, authorization and full entry credentials are required.',
    );
  const entry = jsonObject(context.credentials);
  if (
    context.authorization.identity.keyScope ||
    entry.credential ||
    jsonObject(entry.user).kind === 'service'
  )
    throw forbidden(
      'Runner chat cannot preserve restricted entry credentials.',
    );
}
function supported(config: OnlineAgentConfig, selectedModel?: ModelRef): void {
  if (
    !config.agentId ||
    config.agentId === 'online' ||
    config.model.length ||
    config.tool.length ||
    config.thinking !== undefined ||
    selectedModel
  )
    throw unsupportedCapability(
      'runner',
      'native models, local tools or thinking configuration',
    );
}
async function owned(deps: RunnerDependencies, userId: string, id: string) {
  const row = await findConversation(deps.tx.read(), id);
  if (!row || row.userId !== userId) throw notFound('Conversation');
  return row;
}
function overrides(
  options: OnlineAgentRealtimeOptions,
): OnlineAgentOptions | undefined {
  const {
    sessionId: _id,
    source: _source,
    title: _title,
    showInChatList: _showInChatList,
    selectedModel: _selectedModel,
    ...pending
  } = options;
  return Object.keys(pending).length ? pending : undefined;
}

/** One trusted facade, with pending configuration and only its last accepted response pinned. */
export class RunnerRealtimeOnlineAgent implements RealtimeOnlineAgent {
  readonly backend = 'runner' as const;
  private response?: UIStreamChannel;
  constructor(
    private host: RunnerSessionHost,
    private context: OnlineAgentContext,
    readonly sessionId: string,
    private agentId: string | undefined,
    private pendingOptions: OnlineAgentOptions | undefined,
    private boundary?: OnlineAgentBoundary,
  ) {}

  async status(): Promise<'running' | 'idle'> {
    const row = await owned(
      this.host.deps,
      this.context.user.id,
      this.sessionId,
    );
    return this.host.state.active.has(this.sessionId) ||
      runnerBinding(row.metadata)?.closingRunId ||
      (
        await openRunsOnEach(this.host.deps.tx.read(), 'conversation', [
          this.sessionId,
        ])
      ).length
      ? 'running'
      : 'idle';
  }
  async history(): Promise<AppUIMessage[]> {
    const { deps } = this.host;
    await owned(deps, this.context.user.id, this.sessionId);
    const rows = await messagesRepo(deps.tx.read()).findMany({
      filter: { conversationId: this.sessionId },
      sort: (s) => s.field('seq').asc(),
    });
    return runnerUIMessages(rows.map((row) => toMessage(row, deps.basePath())));
  }
  async messages(
    query: NativeHistoryQuery,
  ): ReturnType<RealtimeOnlineAgent['messages']> {
    const { deps } = this.host;
    const row = await owned(deps, this.context.user.id, this.sessionId);
    return runnerUIPage(
      deps.tx,
      this.sessionId,
      Number(row.lastSeq),
      query,
      deps.basePath(),
    );
  }
  async receive(): ReturnType<RealtimeOnlineAgent['receive']> {
    await owned(this.host.deps, this.context.user.id, this.sessionId);
    return this.host.deps.streams.receive(
      this.context.user.id,
      this.sessionId,
      this.response ?? this.host.state.active.get(this.sessionId)?.writer,
    );
  }
  async abort(): Promise<void> {
    await owned(this.host.deps, this.context.user.id, this.sessionId);
    // Stop is a request. The active projection and gate remain until terminal confirmation.
    await this.host.deps.conversations.stop(
      this.context.user.id,
      this.sessionId,
    );
    const execution = this.host.state.active.get(this.sessionId);
    if (execution) await this.host.refresh(execution);
  }
  async retryFinalization(): Promise<void> {
    const row = await owned(
      this.host.deps,
      this.context.user.id,
      this.sessionId,
    );
    const execution = this.host.state.active.get(this.sessionId);
    if (execution) await this.host.refresh(execution);
    else {
      const runId = runnerBinding(row.metadata)?.closingRunId;
      if (runId)
        await this.host.finalizeSavedRun(
          this.context.user.id,
          this.sessionId,
          runId,
        );
    }
  }
  async approve(_input: NativeApproval): Promise<number> {
    throw unsupportedCapability('runner', 'approval');
  }
  send(
    messages: ModelMessage[],
    input?: OnlineAgentSendOptions,
  ): Promise<number> {
    const { state } = this.host;
    if (state.stopping)
      return Promise.reject(conflict('OnlineAgent is stopping.'));
    if (state.admitting.has(this.sessionId) || state.active.has(this.sessionId))
      return Promise.reject(conflict('This conversation is busy.'));
    // Reserve synchronously, and track the whole admission, including providers and stream registration.
    state.admitting.add(this.sessionId);
    const task = Promise.resolve().then(() => this.submit(messages, input));
    state.admissions.add(task);
    void task
      .finally(() => {
        state.admitting.delete(this.sessionId);
        state.admissions.delete(task);
      })
      .catch(() => {});
    return task;
  }
  private async submit(
    messages: ModelMessage[],
    input?: OnlineAgentSendOptions,
  ): Promise<number> {
    const { deps, state } = this.host;
    credentials(this.context);
    if (input?.selectedModel)
      throw unsupportedCapability('runner', 'native models');
    if (messages.length !== 1 || messages[0].role !== 'user')
      throw invalid('Runner chat accepts one user message per turn.');
    if (messages[0].providerOptions !== undefined)
      throw unsupportedCapability(
        'runner',
        'provider-specific message options',
      );
    const content = messages[0].content;
    if (
      Array.isArray(content) &&
      content.some(
        (part) => part.type !== 'text' || part.providerOptions !== undefined,
      )
    )
      throw unsupportedCapability(
        'runner',
        'native binary parts; send attachments by attachmentIds',
      );
    if ((input?.attachmentIds?.length ?? 0) > 1)
      throw invalid('Attachments must belong to the single user message.');
    const before = await owned(deps, this.context.user.id, this.sessionId);
    if (
      state.active.has(this.sessionId) ||
      runnerBinding(before.metadata)?.closingRunId ||
      (await openRunsOnEach(deps.tx.read(), 'conversation', [this.sessionId]))
        .length
    )
      throw conflict('This conversation is busy.');
    const current = runnerBinding(before.metadata)?.config;
    if (!current)
      throw invalid('This is not a Runner OnlineAgent conversation.');
    const requested = input?.overrides ?? this.pendingOptions;
    const config = requested
      ? await deps.configurator.resolve(
          this.context,
          requested,
          current,
          [],
          this.boundary === 'http',
        )
      : current;
    if (config.agentId !== this.agentId)
      throw conflict('Start a new conversation to choose another agent.');
    supported(config);
    if (state.active.size >= 1024)
      throw conflict('OnlineAgent execution limit exceeded.');
    // Install the channel before enqueue can notify a fast execution machine.
    const writer = await deps.streams.open(
      this.context.user.id,
      this.sessionId,
      input?.clientId ?? this.sessionId,
      'runner',
    );
    const execution: Execution = {
      id: this.sessionId,
      userId: this.context.user.id,
      cursor: Number(before.lastSeq),
      writer,
      published: new Set(),
      ready: false,
      started: false,
      again: false,
    };
    state.active.set(this.sessionId, execution);
    let accepted;
    try {
      accepted = await deps.conversations.sendRealtime(
        this.context.user.id,
        this.sessionId,
        {
          content:
            typeof content === 'string'
              ? content
              : content
                  .map((part) => (part.type === 'text' ? part.text : ''))
                  .join(''),
          attachmentIds: input?.attachmentIds?.[0],
          clientId: input?.clientId,
        },
        {
          config,
          expectedConfig: current,
          workContext: input?.workContext,
          business: this.context.business,
        },
      );
    } catch (error) {
      if (state.active.get(this.sessionId) === execution)
        state.active.delete(this.sessionId);
      await deps.streams.close(this.sessionId, writer);
      throw error;
    }
    // Nothing after durable acceptance may turn it into a failed/retried business admission.
    this.response = writer;
    this.pendingOptions = undefined;
    execution.runId = accepted.run!.id;
    execution.cursor = accepted.seq;
    await deps.streams
      .bind(this.sessionId, writer, execution.runId)
      .catch((error) => writer.fail(error));
    execution.ready = true;
    void this.host.refresh(execution).catch((error) => deps.onError(error));
    return accepted.seq;
  }
}

/** Full Runner backend over the existing queue, events and canonical conversation history. */
export class RunnerOnlineAgentAdapter implements OnlineAgentBackend {
  readonly kind = 'runner' as const;
  private state: RunnerState = {
    active: new Map(),
    admitting: new Set(),
    admissions: new Set(),
    stopping: false,
    detaching: false,
  };
  private shutdownTask?: Promise<void>;
  constructor(private deps: RunnerDependencies) {}

  private available(context: OnlineAgentContext): void {
    credentials(context);
    if (this.state.stopping) throw conflict('OnlineAgent is stopping.');
  }
  private session(
    context: OnlineAgentContext,
    id: string,
    config: OnlineAgentConfig,
    pending?: OnlineAgentOptions,
    boundary?: OnlineAgentBoundary,
  ) {
    return new RunnerRealtimeOnlineAgent(
      {
        deps: this.deps,
        state: this.state,
        refresh: (execution) => this.refresh(execution),
        finalizeSavedRun: (userId, sessionId, runId) =>
          this.finalizeSavedRun(userId, sessionId, runId),
      },
      context,
      id,
      config.agentId,
      pending,
      boundary,
    );
  }
  async createRealtime(
    context: OnlineAgentContext,
    initial: OnlineAgentInitialConfiguration,
    options: OnlineAgentRealtimeOptions,
    boundary?: OnlineAgentBoundary,
  ): Promise<RunnerRealtimeOnlineAgent> {
    this.available(context);
    supported(initial.config, options.selectedModel);
    const row = await this.deps.conversations.create(
      context.user.id,
      {
        agentId: initial.config.agentId,
        source: options.source,
        title: options.title,
        showInChatList: options.showInChatList,
      },
      initial.config,
    );
    // The router already resolved the initial selection. Never execute its providers again here.
    return this.session(context, row.id, initial.config, undefined, boundary);
  }
  async restoreRealtime(
    context: OnlineAgentContext,
    options: OnlineAgentRealtimeOptions & { sessionId: string },
    boundary?: OnlineAgentBoundary,
  ): Promise<RunnerRealtimeOnlineAgent> {
    this.available(context);
    const row = await owned(this.deps, context.user.id, options.sessionId);
    const binding = runnerBinding(row.metadata);
    if (!binding)
      throw invalid('This is not a Runner OnlineAgent conversation.');
    if (options.agentId && options.agentId !== binding.config.agentId)
      throw conflict('Start a new conversation to choose another agent.');
    supported(binding.config, options.selectedModel);
    if (binding.closingRunId && !this.state.active.has(row.id)) {
      // Missing streams never imply completion. Only a saved terminal Run can release this gate.
      const stored = await findRunRecord(
        this.deps.tx.read(),
        binding.closingRunId,
      );
      if (stored && this.terminal(toRun(stored)))
        await this.finalizeSavedRun(
          context.user.id,
          row.id,
          binding.closingRunId,
        );
    }
    const pending = overrides(options);
    const session = this.session(
      context,
      row.id,
      binding.config,
      pending,
      boundary,
    );
    if (pending && (await session.status()) === 'running')
      throw conflict('This conversation is busy.');
    // Pending options are resolved against the latest saved configuration only on successful send.
    return session;
  }
  async createBackground(
    _context: OnlineAgentContext,
    _initial: OnlineAgentInitialConfiguration,
    _options: OnlineAgentRealtimeOptions,
    _boundary?: OnlineAgentBoundary,
  ): Promise<BackgroundOnlineAgent> {
    throw unsupportedCapability('runner', 'background');
  }
  async restoreBackground(
    _context: OnlineAgentContext,
    _options: OnlineAgentRealtimeOptions & { sessionId: string },
    _boundary?: OnlineAgentBoundary,
  ): Promise<BackgroundOnlineAgent> {
    throw unsupportedCapability('runner', 'background');
  }
  async deliverNotification(
    _context: OnlineAgentContext,
    _id: string,
    _input: OnlineAgentNotification,
  ): Promise<AppUIMessage> {
    throw unsupportedCapability('runner', 'notifications');
  }
  async configuration(
    context: OnlineAgentContext,
    id: string,
  ): Promise<OnlineAgentConfiguration | null> {
    const row = await owned(this.deps, context.user.id, id);
    const config = runnerBinding(row.metadata)?.config;
    if (config) credentials(context);
    return config ? { ...config, selectedModel: null } : null;
  }
  async configure(
    context: OnlineAgentContext,
    id: string,
    options: OnlineAgentOptions,
    selectedModel?: ModelRef,
    boundary?: OnlineAgentBoundary,
  ): Promise<OnlineAgentConfiguration> {
    this.available(context);
    if (selectedModel) throw unsupportedCapability('runner', 'native models');
    const current = await this.configuration(context, id);
    if (!current)
      throw invalid('This is not a Runner OnlineAgent conversation.');
    const { selectedModel: _selectedModel, ...expectedConfig } = current;
    const session = this.session(context, id, expectedConfig);
    if (this.state.admitting.has(id) || (await session.status()) === 'running')
      throw conflict('This conversation is busy.');
    const config = await this.deps.configurator.resolve(
      context,
      options,
      expectedConfig,
      [],
      boundary === 'http',
    );
    supported(config);
    if (config.agentId !== expectedConfig.agentId)
      throw conflict('Start a new conversation to choose another agent.');
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
        this.state.admitting.has(id) ||
        this.state.active.has(id) ||
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
    return { ...config, selectedModel: null };
  }
  isActive(id: string): boolean {
    return this.state.active.has(id);
  }
  async producerAvailable(
    id: string,
    persistedRunning = true,
  ): Promise<boolean> {
    return (
      this.isActive(id) ||
      (persistedRunning && (await this.deps.streams.producerAvailable(id)))
    );
  }
  async recoverAtStartup(): Promise<void> {
    // Runner owns durable dispatch/recovery. Terminal conversation projection is repaired on restore;
    // startup must neither cancel nor re-enqueue work, nor invent a local UI producer for remote work.
  }
  /** Notifications wake a persisted read; they never supply authoritative text. */
  notify(runId: string): boolean {
    const execution = [...this.state.active.values()].find(
      (item) => item.runId === runId,
    );
    if (!execution) return false;
    void this.refresh(execution).catch((error) => this.deps.onError(error));
    return true;
  }
  private refresh(execution: Execution): Promise<void> {
    if (this.state.detaching) return execution.pending ?? Promise.resolve();
    if (
      !execution.runId ||
      !execution.ready ||
      this.state.active.get(execution.id) !== execution
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
      } while (
        execution.again &&
        this.state.active.get(execution.id) === execution
      );
    })().finally(() => {
      execution.pending = undefined;
      if (
        !this.state.stopping &&
        this.state.active.get(execution.id) === execution
      ) {
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
    if (
      run.actorUserId !== execution.userId ||
      run.subject.kind !== 'conversation' ||
      run.subject.id !== execution.id
    )
      throw forbidden('This run does not belong to the conversation.');
    // Synchronization commits first. Independent notices are delivered by durable business rereads.
    const row = await owned(this.deps, execution.userId, execution.id);
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
    if (this.state.active.get(execution.id) === execution)
      this.state.active.delete(execution.id);
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
  shutdown(): Promise<void> {
    this.state.stopping = true;
    return (this.shutdownTask ??= this.detach());
  }
  private async detach(): Promise<void> {
    // Admission may still be opening a stream or committing a Run. Drain it before detaching producers.
    await Promise.allSettled([...this.state.admissions]);
    this.state.detaching = true;
    for (const execution of this.state.active.values())
      clearTimeout(execution.timer);
    await Promise.allSettled(
      [...this.state.active.values()].map(
        (item) => item.pending ?? Promise.resolve(),
      ),
    );
    await Promise.allSettled(
      [...this.state.active.values()].map((item) =>
        this.deps.streams.close(item.id, item.writer),
      ),
    );
    this.state.active.clear();
    // Shared UIStreams belong to the service. Never close them, cancel or redispatch Runner work here.
  }
}
