import { createHash } from 'node:crypto';
import type {
  BackgroundOnlineAgent,
  RealtimeOnlineAgent,
  OnlineAgentBackend,
} from '../contracts.js';
import {
  runnerMessages,
  runnerToolParts,
  runnerUIPage,
  runnerMessageId,
  runnerPlan,
  type RunnerToolPart,
} from './projection.js';
import type { UIStreamChannel } from '../transport/streams.js';
import type { AppUIMessage } from '../../../../shared/online-agent.js';
import { isDeepStrictEqual } from 'node:util';
import type { ModelMessage } from 'ai';
import type { Run } from '../../../../shared/runs.js';
import { outputBlock, type RunEvent } from '@nocobase/agent-protocol';
import type { ModelRef } from '../../../../shared/models.js';
import {
  conversationsRepo,
  findConversation,
  lockConversation,
  messagesRepo,
  toMessage,
} from '../../../core/conversations/conversation.store.js';
import { openRunsOnEach } from '../../../core/runs/index.js';
import {
  eventsRepo,
  findRunRecord,
  toRun,
} from '../../../core/runs/run.store.js';
import {
  conflict,
  forbidden,
  invalid,
  notFound,
} from '../../../kernel/errors.js';
import { asJson, jsonObject } from '../../../kernel/values.js';
import type {
  OnlineAgentConfig,
  OnlineAgentContext,
  OnlineAgentOptions,
  OnlineAgentRealtimeOptions,
  OnlineAgentSendOptions,
  NativeApproval,
  NativeHistoryQuery,
  OnlineAgentBoundary,
  OnlineAgentConfiguration,
  OnlineAgentInitialConfiguration,
} from '../types.js';
import { unsupportedCapability } from '../errors.js';
import { runnerBinding } from '../persistence/state.js';
import type {
  Execution,
  RunnerDependencies,
  RunnerState,
  RunnerSessionHost,
} from './types.js';

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
    config.model?.length ||
    config.tool.length ||
    (config.skill?.length ?? 0) > 0 ||
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
    projectId: _projectId,
    selectedModel: _selectedModel,
    ...pending
  } = options;
  return Object.keys(pending).length ? pending : undefined;
}

/** The response without its turn footer, which history shows once the run has ended; it is never streamed. */
function withoutTurn(
  message: AppUIMessage | undefined,
): AppUIMessage | undefined {
  if (!message) return message;
  const kept = message.parts.flatMap((part, index) =>
    part.type === 'data-turn' ? [] : [index],
  );
  if (kept.length === message.parts.length) return message;
  return {
    ...message,
    parts: kept.map((index) => message.parts[index]),
    metadata: {
      ...message.metadata!,
      sourceRecords: (message.metadata?.sourceRecords ?? []).filter(
        (source) => !source.partId.startsWith('turn:'),
      ),
    },
  };
}

/** The text of the one user message Runner chat takes per send. */
function userText(
  messages: ModelMessage[],
  input: OnlineAgentSendOptions | undefined,
): string {
  if (input?.selectedModel)
    throw unsupportedCapability('runner', 'native models');
  if (messages.length !== 1 || messages[0].role !== 'user')
    throw invalid('Runner chat accepts one user message per turn.');
  if (messages[0].providerOptions !== undefined)
    throw unsupportedCapability('runner', 'provider-specific message options');
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
  return typeof content === 'string'
    ? content
    : content.map((part) => (part.type === 'text' ? part.text : '')).join('');
}

/** The most parts one streamed response carries: its text and reasoning blocks and its tool calls. */
const MAX_STREAM_PARTS = 256;

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
    return runnerMessages(
      deps.tx,
      rows.map((row) => toMessage(row, deps.basePath())),
    );
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
  async resend(): Promise<number> {
    throw unsupportedCapability('runner', 'message resend');
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
  async queue(
    messages: ModelMessage[],
    input?: OnlineAgentSendOptions,
  ): Promise<number> {
    const { deps, state } = this.host;
    if (state.stopping) throw conflict('OnlineAgent is stopping.');
    const text = userText(messages, input);
    credentials(this.context);
    if (input?.overrides || input?.agentId)
      throw invalid('Queued messages keep the configuration of the work.');
    // A first message still being admitted is the work this one joins.
    while (state.admitting.has(this.sessionId))
      await Promise.allSettled([...state.admissions]);
    const before = await owned(deps, this.context.user.id, this.sessionId);
    const current = runnerBinding(before.metadata)?.config;
    if (!current)
      throw invalid('This is not a Runner OnlineAgent conversation.');
    if (current.agentId !== this.agentId)
      throw conflict(
        'This conversation now uses another agent; restore it before queueing.',
      );
    const accepted = await deps.conversations.sendRealtime(
      this.context.user.id,
      this.sessionId,
      {
        content: text,
        attachmentIds: input?.attachmentIds?.[0],
        clientId: input?.clientId,
      },
      {
        config: current,
        expectedConfig: current,
        workContext: input?.workContext,
        business: this.context.business,
        queue: true,
      },
    );
    const execution = state.active.get(this.sessionId);
    if (execution)
      void this.host.refresh(execution).catch((error) => deps.onError(error));
    return accepted.seq;
  }
  private async submit(
    messages: ModelMessage[],
    input?: OnlineAgentSendOptions,
  ): Promise<number> {
    const { deps, state } = this.host;
    credentials(this.context);
    const text = userText(messages, input);
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
    const resolved = requested
      ? await deps.configurator.resolve(
          this.context,
          requested,
          current,
          this.boundary === 'http',
        )
      : current;
    if (resolved.agentId !== this.agentId)
      throw conflict('Start a new conversation to choose another agent.');
    const config = input?.agentId
      ? { ...resolved, agentId: input.agentId }
      : resolved;
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
      textLengths: new Map(),
      previewDigests: new Map(),
      previewParts: new Map(),
      toolStates: new Map(),
      stepSeq: 0,
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
          agentId: input?.agentId,
          effort: input?.effort,
          content: text,
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
    this.agentId = config.agentId;
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

  /** A configuration change must not race an admission or unfinished stream finalization. */
  busy(sessionId: string): boolean {
    return (
      this.state.admitting.has(sessionId) || this.state.active.has(sessionId)
    );
  }
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
        projectId: options.projectId,
        title: options.title,
        showInChatList: options.showInChatList,
        effort: options.effort,
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
  async configuration(
    context: OnlineAgentContext,
    id: string,
  ): Promise<OnlineAgentConfiguration> {
    const row = await owned(this.deps, context.user.id, id);
    const config = runnerBinding(row.metadata)?.config;
    if (!config)
      throw invalid('This is not a Runner OnlineAgent conversation.');
    credentials(context);
    return { ...config, selectedModel: null };
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
    const { selectedModel: _selectedModel, ...expectedConfig } = current;
    const session = this.session(context, id, expectedConfig);
    if (this.state.admitting.has(id) || (await session.status()) === 'running')
      throw conflict('This conversation is busy.');
    const config = await this.deps.configurator.resolve(
      context,
      options,
      expectedConfig,
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
  /** Notifications wake a persisted read; they never supply authoritative text. */
  notify(runId: string): boolean {
    const execution = [...this.state.active.values()].find(
      (item) => item.runId === runId,
    );
    if (!execution) return false;
    void this.refresh(execution).catch((error) => this.deps.onError(error));
    return true;
  }
  /** Ephemeral previews are authorized/redacted by reports; history still comes only from completed snapshots. */
  output(runId: string, event: RunEvent): void {
    const execution = [...this.state.active.values()].find(
      (item) => item.runId === runId,
    );
    const output = outputBlock(event.meta);
    if (
      !execution?.ready ||
      !output ||
      (event.type !== 'text' && event.type !== 'thinking')
    )
      return;
    const id = `output:${output.blockId}`;
    if (execution.published.has(id)) return;
    const type = event.type === 'thinking' ? 'reasoning' : 'text';
    this.ensureStarted(execution);
    if (!execution.previewParts.has(id)) {
      if (execution.previewParts.size >= MAX_STREAM_PARTS) return;
      execution.previewParts.set(id, {
        index: execution.previewParts.size,
        type,
      });
      execution.writer.write({
        type: type === 'text' ? 'text-start' : 'reasoning-start',
        id,
      });
      execution.textLengths.set(id, 0);
      execution.previewDigests.set(id, createHash('sha256'));
    }
    this.writeSources(execution);
    let content = event.content ?? '';
    if (output.phase === 'end' && event.content !== undefined) {
      const length = this.prefixLength(execution, id, content);
      if (length === undefined) return;
      content = content.slice(length);
    }
    if (content) {
      execution.writer.write({
        type: type === 'text' ? 'text-delta' : 'reasoning-delta',
        id,
        delta: content,
      });
      execution.previewDigests.get(id)?.update(content);
      execution.textLengths.set(
        id,
        (execution.textLengths.get(id) ?? 0) + content.length,
      );
    }
    if (output.phase === 'end') {
      execution.writer.write({
        type: type === 'text' ? 'text-end' : 'reasoning-end',
        id,
      });
      execution.published.add(id);
      execution.previewDigests.delete(id);
    }
  }
  /** Check the actual prefix, without retaining response text or treating its length as evidence. */
  private prefixLength(
    execution: Execution,
    id: string,
    canonical: string,
  ): number | undefined {
    const length = execution.textLengths.get(id) ?? 0;
    const digest = execution.previewDigests.get(id);
    if (
      digest &&
      (length > canonical.length ||
        digest.copy().digest('hex') !==
          createHash('sha256').update(canonical.slice(0, length)).digest('hex'))
    ) {
      for (const [partId, part] of execution.previewParts)
        if (!execution.published.has(partId) && part.type !== 'tool') {
          execution.writer.write({
            type: part.type === 'text' ? 'text-end' : 'reasoning-end',
            id: partId,
          });
          execution.published.add(partId);
        }
      execution.previewDigests.clear();
      // Preview is best effort. Finish normally so the existing onFinish history refresh
      // replaces it with committed content, without turning a successful run into a UI error.
      return undefined;
    }
    return length;
  }
  /** The run's tool calls and results saved since the last read, as tool parts of the response, in order. */
  private async liveTools(execution: Execution): Promise<void> {
    const events = await eventsRepo(this.deps.tx.read()).findMany({
      filter: (f) =>
        f.and([
          f.string('runId').eq(execution.runId!),
          f.or([
            f.string('type').eq('toolUse'),
            f.string('type').eq('toolResult'),
            f.and([
              f.string('type').eq('status'),
              f.text('content').eq('plan'),
            ]),
          ]),
          f.number('seq').gt(execution.stepSeq),
        ]),
      sort: (s) => s.field('seq').asc(),
      limit: 200,
    });
    if (events.length === 0) return;
    execution.stepSeq = Number(events.at(-1)!.seq);
    // The agent's plan, as it last reported it, replaces the one shown.
    const plan = runnerPlan(events.filter((event) => event.type === 'status'));
    const planId = `plan:${execution.runId!}`;
    if (
      plan &&
      (execution.previewParts.has(planId) ||
        execution.previewParts.size < MAX_STREAM_PARTS)
    ) {
      this.ensureStarted(execution);
      if (!execution.previewParts.has(planId))
        execution.previewParts.set(planId, {
          index: execution.previewParts.size,
          type: 'tool',
        });
      execution.writer.write({
        type: 'data-plan',
        id: planId,
        data: plan.plan,
      });
      execution.published.add(planId);
      this.writeSources(execution);
    }
    // A result whose call was read earlier still needs the call's input: read the calls of these results too.
    const earlier = events
      .filter((event) => event.type === 'toolResult')
      .map((event) => jsonObject(event.meta).toolUseId)
      .filter(
        (id): id is string =>
          typeof id === 'string' && execution.toolStates.has(`tool:${id}`),
      );
    const calls = earlier.length
      ? await eventsRepo(this.deps.tx.read()).findMany({
          filter: (f) =>
            f.and([
              f.string('runId').eq(execution.runId!),
              f.string('type').eq('toolUse'),
              f.or(
                earlier.map((id) => f.json('meta').path(['toolUseId']).eq(id)),
              ),
            ]),
          sort: (s) => s.field('seq').asc(),
          limit: earlier.length,
        })
      : [];
    const parts = runnerToolParts([
      ...calls.filter((call) =>
        earlier.includes(String(jsonObject(call.meta).toolUseId)),
      ),
      ...events,
    ]);
    let wrote = false;
    for (const [id, { part }] of parts)
      wrote = this.writeTool(execution, id, part) || wrote;
    if (wrote) this.writeSources(execution);
  }
  /**
   * Before the response has output, says where it stands (`data-phase`): waiting for a runner, starting the agent, or
   * the agent thinking. The page shows it in place of a blank response; output replaces it.
   */
  private async livePhase(execution: Execution, run: Run): Promise<void> {
    if (execution.phase === 'done') return;
    if ([...execution.previewParts.keys()].some((id) => id !== 'phase')) {
      execution.phase = 'done';
      return;
    }
    let phase: NonNullable<Execution['phase']> =
      run.status === 'queued' ? 'waiting' : 'starting';
    if (run.status === 'running' && execution.phase !== 'thinking') {
      const started = await eventsRepo(this.deps.tx.read()).findOne({
        filter: (f) =>
          f.and([
            f.string('runId').eq(run.id),
            f.string('type').eq('status'),
            f.text('content').eq('started'),
          ]),
      });
      if (started) phase = 'thinking';
    } else if (execution.phase === 'thinking') phase = 'thinking';
    if (phase === execution.phase) return;
    this.ensureStarted(execution);
    if (!execution.previewParts.has('phase'))
      execution.previewParts.set('phase', {
        index: execution.previewParts.size,
        type: 'tool',
      });
    execution.published.add('phase');
    execution.writer.write({
      type: 'data-phase',
      id: 'phase',
      data: { phase },
    });
    execution.phase = phase;
    this.writeSources(execution);
  }
  /** Writes what of a tool part the stream has not had; true when something was written. */
  private writeTool(
    execution: Execution,
    id: string,
    part: RunnerToolPart,
  ): boolean {
    let state = execution.toolStates.get(id);
    if (state === 'done') return false;
    let wrote = false;
    if (!state) {
      if (execution.previewParts.size >= MAX_STREAM_PARTS) return false;
      this.ensureStarted(execution);
      execution.previewParts.set(id, {
        index: execution.previewParts.size,
        type: 'tool',
      });
      execution.writer.write({
        type: 'tool-input-available',
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        input: part.input,
        dynamic: true,
      });
      state = 'input';
      execution.toolStates.set(id, state);
      wrote = true;
    }
    if (part.state === 'output-available' || part.state === 'output-error') {
      execution.writer.write(
        part.state === 'output-available'
          ? {
              type: 'tool-output-available',
              toolCallId: part.toolCallId,
              output: part.output,
              dynamic: true,
            }
          : {
              type: 'tool-output-error',
              toolCallId: part.toolCallId,
              errorText: part.errorText,
              dynamic: true,
            },
      );
      execution.toolStates.set(id, 'done');
      execution.published.add(id);
      wrote = true;
    }
    return wrote;
  }
  private ensureStarted(execution: Execution): void {
    if (execution.started) return;
    execution.writer.write({
      type: 'start',
      messageId: runnerMessageId(execution.runId!),
      messageMetadata: {
        conversationId: execution.id,
        revision: 0,
        createdAt: this.deps.now(),
        executionId: execution.runId!,
        turnId: execution.runId!,
      },
    });
    execution.started = true;
  }
  /** Where each part of the response streamed so far stands, so the page keeps them in order. */
  private writeSources(execution: Execution): void {
    const runId = execution.runId!;
    execution.writer.write({
      type: 'message-metadata',
      messageMetadata: {
        ...execution.snapshot?.metadata,
        revision: execution.snapshot?.metadata?.revision ?? 0,
        conversationId: execution.id,
        createdAt: execution.snapshot?.metadata?.createdAt ?? this.deps.now(),
        sourceRecords: [...execution.previewParts].map(([partId, part]) => ({
          recordId: partId,
          partId,
          partIndex: part.index,
          seq: execution.cursor + 1,
          createdAt: this.deps.now(),
          ...(partId.startsWith('output:')
            ? {
                output: {
                  blockId: partId.slice(7),
                  phase: execution.published.has(partId)
                    ? ('end' as const)
                    : ('delta' as const),
                },
              }
            : {}),
        })),
        executionId: runId,
        turnId: runId,
      },
    });
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
    // A reclaimed attempt can be queued again without finishing the conversation stream.
    if (run.status === 'queued' || run.status === 'dispatched')
      for (const [id, part] of execution.previewParts)
        if (
          id.startsWith('output:') &&
          part.type !== 'tool' &&
          !execution.published.has(id)
        ) {
          execution.writer.write({
            type: part.type === 'text' ? 'text-end' : 'reasoning-end',
            id,
          });
          execution.published.add(id);
          execution.previewDigests.delete(id);
        }
    await this.liveTools(execution);
    await this.livePhase(execution, run);
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
      const message = withoutTurn(
        (
          await runnerMessages(
            this.deps.tx,
            records.map((record) => toMessage(record, this.deps.basePath())),
          )
        )[0],
      );
      if (message) {
        const sourceParts = new Map(
          message.metadata!.sourceRecords!.map((source) => [
            source.partId,
            message.parts[source.partIndex],
          ]),
        );
        const canonicalSources = [...message.metadata!.sourceRecords!];
        for (const source of message.metadata!.sourceRecords!) {
          let part = execution.previewParts.get(source.partId);
          if (!part) {
            const type = sourceParts.get(source.partId)?.type;
            part = {
              index: execution.previewParts.size,
              type:
                type === 'reasoning'
                  ? 'reasoning'
                  : type === 'dynamic-tool' || type?.startsWith('data-')
                    ? 'tool'
                    : 'text',
            };
            execution.previewParts.set(source.partId, part);
          }
          source.partIndex = part.index;
        }
        const canonical = new Set(
          message.metadata!.sourceRecords!.map((source) => source.partId),
        );
        for (const [partId, part] of execution.previewParts)
          if (!canonical.has(partId))
            message.metadata!.sourceRecords!.push({
              recordId: partId,
              partId,
              partIndex: part.index,
              seq: execution.cursor + 1,
              createdAt: this.deps.now(),
              ...(partId.startsWith('output:')
                ? {
                    output: {
                      blockId: partId.slice(7),
                      phase: execution.published.has(partId)
                        ? ('end' as const)
                        : ('delta' as const),
                    },
                  }
                : {}),
            });
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
        for (const source of canonicalSources) {
          if (execution.published.has(source.partId)) continue;
          const part = sourceParts.get(source.partId)!;
          if (part.type === 'text' || part.type === 'reasoning') {
            const length = this.prefixLength(
              execution,
              source.partId,
              part.text,
            );
            if (length === undefined) continue;
            if (!execution.textLengths.has(source.partId))
              execution.writer.write({
                type: part.type === 'text' ? 'text-start' : 'reasoning-start',
                id: source.partId,
              });
            const delta = part.text.slice(length ?? 0);
            if (delta)
              execution.writer.write({
                type: part.type === 'text' ? 'text-delta' : 'reasoning-delta',
                id: source.partId,
                delta,
              });
            execution.textLengths.set(source.partId, part.text.length);
            if (part.state !== 'streaming') {
              execution.writer.write({
                type: part.type === 'text' ? 'text-end' : 'reasoning-end',
                id: source.partId,
              });
              execution.published.add(source.partId);
              execution.previewDigests.delete(source.partId);
            }
          } else if (part.type === 'dynamic-tool') {
            this.writeTool(execution, source.partId, part);
            continue;
          } else if (part.type === 'file')
            execution.writer.write({
              type: 'file',
              url: part.url,
              mediaType: part.mediaType,
              ...(part.filename ? { filename: part.filename } : {}),
            });
          if (part.type !== 'text' && part.type !== 'reasoning')
            execution.published.add(source.partId);
        }
        execution.snapshot = message;
      }
      execution.cursor = Number(row.lastSeq);
    }
    if (!this.terminal(run)) return;
    for (const [id, part] of execution.previewParts)
      if (!execution.published.has(id) && part.type !== 'tool') {
        execution.writer.write({
          type: part.type === 'text' ? 'text-end' : 'reasoning-end',
          id,
        });
        execution.published.add(id);
      }
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
      // A later run (one the application woke) closes on its own.
      if (!binding?.closingRunId || binding.closingRunId !== runId) return;
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
