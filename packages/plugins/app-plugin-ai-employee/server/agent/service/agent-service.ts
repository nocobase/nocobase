import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type { LLMResult } from '@langchain/core/outputs';
import { concat } from '@langchain/core/utils/stream';
import { Command, getConfig, isGraphInterrupt } from '@langchain/langgraph';
import { createAgent } from 'langchain';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import { buildAgentTools } from '@nocobase/ai-employee';
import type {
  AIMessage,
  AIMessageInput,
  LLMProvider,
  ToolsEntity,
} from '@nocobase/ai-employee';
import type { AIMessage as LangChainAIMessage } from '@langchain/core/messages';
import type {
  AgentGraphState,
  AgentContextProvider,
  AgentThread,
  AgentInterruptAction,
  AgentInvokeInterrupt,
  AgentInvokeRequest,
  AgentInvokeResult,
  AgentOperation,
  AgentProviders,
  AgentRequest,
  AgentStreamEvent,
  CurrentConversation,
  PreparedAgentContext,
  ResolvedAgentLLM,
} from '../types.js';
import { AgentServiceError } from '../types.js';
import { normalizeAgentError, toConfigurationError } from '../errors.js';
import { buildStandardAgentMiddleware } from '../middleware/pipeline.js';
import { RELEASED_THREAD } from '../checkpoint/cleaner.js';

const mergeSignals = (
  internal: AbortSignal,
  external?: AbortSignal,
): AbortSignal => {
  if (!external) return internal;
  if (typeof AbortSignal.any === 'function')
    return AbortSignal.any([internal, external]);
  const controller = new AbortController();
  const abort = (signal: AbortSignal) => controller.abort(signal.reason);
  if (internal.aborted) abort(internal);
  else
    internal.addEventListener('abort', () => abort(internal), { once: true });
  if (external.aborted) abort(external);
  else
    external.addEventListener('abort', () => abort(external), { once: true });
  return controller.signal;
};

type InterruptActionRequest = {
  name: string;
  description?: string;
};

type InterruptReviewConfig = {
  actionName: string;
  allowedDecisions?: string[];
};

type InterruptValue = {
  actionRequests?: InterruptActionRequest[];
  reviewConfigs?: InterruptReviewConfig[];
};

type Interrupt = {
  id?: string;
  value?: InterruptValue;
};

/** An interrupt action recorded against a persisted tool call. */
type RecordedInterruptAction = {
  action: AgentInterruptAction;
  toolCall: { id: string; name: string };
  conversation: CurrentConversation;
  messageId: string;
};

/**
 * The interrupt a root graph reports from `invoke()`. A root graph returns it
 * in the state under `__interrupt__` rather than throwing; only a graph nested
 * in another graph's node throws `GraphInterrupt`, for its parent to handle.
 */
const readInvokeInterrupt = (result: unknown): Interrupt | undefined => {
  const interrupts = (result as { __interrupt__?: unknown } | null)
    ?.__interrupt__;
  return Array.isArray(interrupts)
    ? (interrupts[0] as Interrupt | undefined)
    : undefined;
};

const toInterruptActions = (interrupt: Interrupt): AgentInterruptAction[] => {
  const actions = interrupt.value?.actionRequests ?? [];
  const configs = new Map<string, InterruptReviewConfig>(
    (interrupt.value?.reviewConfigs ?? []).map(
      (item: InterruptReviewConfig) => [item.actionName, item],
    ),
  );
  return actions.flatMap((action: InterruptActionRequest, order: number) => {
    try {
      const payload: unknown = action.description
        ? JSON.parse(action.description)
        : {};
      if (payload === null || typeof payload !== 'object') return [];
      const value = payload as Record<string, unknown>;
      const toolCallId = value.toolCallId;
      const toolCallName = value.toolCallName;
      const sessionId = value.sessionId;
      return [
        {
          order,
          description: action.description,
          allowedDecisions: configs.get(action.name)?.allowedDecisions,
          toolCall:
            typeof toolCallId === 'string' && typeof toolCallName === 'string'
              ? { id: toolCallId, name: toolCallName }
              : undefined,
          currentConversation:
            typeof sessionId === 'string'
              ? {
                  sessionId,
                  from: typeof value.from === 'string' ? value.from : undefined,
                  username:
                    typeof value.username === 'string'
                      ? value.username
                      : undefined,
                }
              : undefined,
        },
      ];
    } catch {
      return [];
    }
  });
};

/**
 * Asks the provider to describe a failure. An error handler must not raise one
 * of its own: a provider that does not implement this would otherwise replace
 * the failure being reported with a TypeError.
 */
const describeProviderError = (
  provider: LLMProvider | undefined,
  error: unknown,
): string | undefined =>
  typeof provider?.parseResponseError === 'function'
    ? provider.parseResponseError(error)
    : undefined;

const isLangChainAIMessage = (value: unknown): value is LangChainAIMessage => {
  const candidate = value as { getType?: () => string } | null;
  return (
    typeof candidate?.getType === 'function' && candidate.getType() === 'ai'
  );
};

type ResponseMetadata = Record<string, unknown>;

class ExecutionResponseMetadata {
  private readonly metadata = new Map<string, ResponseMetadata>();
  private disposed = false;

  public collect(id: unknown, data: unknown): void {
    if (this.disposed || !id || !data || typeof data !== 'object') return;
    this.metadata.set(String(id), data as ResponseMetadata);
  }

  public take(id: string): ResponseMetadata | undefined {
    const data = this.metadata.get(id);
    this.metadata.delete(id);
    return data;
  }

  public dispose(): void {
    this.disposed = true;
    this.metadata.clear();
  }
}

class ResponseMetadataCollector extends BaseCallbackHandler {
  public name = 'ResponseMetadataCollector';

  public constructor(
    private readonly provider: LLMProvider,
    private readonly metadata: ExecutionResponseMetadata,
  ) {
    super();
  }

  public handleLLMEnd(output: LLMResult): void {
    const [id, data] = this.provider.parseResponseMetadata(output);
    this.metadata.collect(id, data);
  }
}

export class AgentService {
  private activeController?: AbortController;

  constructor(private readonly providers: AgentProviders) {}
  private get agentContext(): AgentContextProvider {
    return this.providers.context;
  }

  abort(reason?: unknown): void {
    if (!this.activeController?.signal.aborted)
      this.activeController?.abort(reason);
  }

  /** Resolves pending persisted tool calls before starting a new user turn. */
  cancelToolCall(): Promise<AIMessageInput[] | undefined> {
    return this.providers.conversation.messages.cancelToolCall();
  }

  stream(request: AgentRequest = {}): AsyncGenerator<AgentStreamEvent> {
    return this.executeStream('stream', request);
  }
  resumeStream(request: AgentRequest): AsyncGenerator<AgentStreamEvent> {
    return this.executeStream('resume', request);
  }
  forkStream(request: AgentRequest): AsyncGenerator<AgentStreamEvent> {
    return this.executeStream('fork', request);
  }
  invoke<TStructured = never>(
    request: AgentInvokeRequest<TStructured> = {},
  ): Promise<AgentInvokeResult<TStructured>> {
    return this.executeInvoke('invoke', request);
  }
  resumeInvoke<TStructured = never>(
    request: AgentInvokeRequest<TStructured>,
  ): Promise<AgentInvokeResult<TStructured>> {
    return this.executeInvoke('resume', request);
  }
  forkInvoke<TStructured = never>(
    request: AgentInvokeRequest<TStructured>,
  ): Promise<AgentInvokeResult<TStructured>> {
    return this.executeInvoke('fork', request);
  }

  private resolveLLM(): Promise<ResolvedAgentLLM> {
    return this.agentContext.resolveLLM();
  }

  private shouldFork(
    operation: AgentOperation,
    request: AgentRequest,
  ): boolean {
    return operation === 'fork' || Boolean(request.messageId);
  }

  private async forkThread(
    current: AgentThread | undefined,
    llmProvider: LLMProvider,
  ): Promise<AgentThread | undefined> {
    if (!current) return undefined;
    for (let attempt = 0; attempt < 4; attempt++) {
      const thread = current.thread + attempt + 1;
      const candidate: AgentThread = {
        sessionId: current.sessionId,
        thread,
        threadId: `${current.sessionId}:${thread}`,
      };
      if (!this.providers.checkpointer) return candidate;
      const agent = createAgent({
        model: llmProvider.createModel() as any,
        tools: [],
        checkpointer: this.providers.checkpointer as BaseCheckpointSaver,
      });
      const snapshot = await agent.graph.getState({
        configurable: { thread_id: candidate.threadId },
      });
      if (!snapshot.config.configurable?.checkpoint_id) return candidate;
    }
    throw new Error('Fail to create new agent thread');
  }

  private buildInitialState(messages: AIMessage[]): AgentGraphState {
    const assistantRole = this.agentContext.currentConversation().username;
    const toolMessage = messages
      .slice()
      .reverse()
      .find((message) => message.toolCalls?.length);
    return {
      messageId: toolMessage?.messageId,
      lastMessageIndex: {
        lastHumanMessageIndex: messages.filter(
          (message) => message.role === 'user',
        ).length,
        lastAIMessageIndex: messages.filter((message) =>
          assistantRole
            ? message.role === assistantRole
            : message.role !== 'user' &&
              message.role !== 'tool' &&
              message.role !== 'system',
        ).length,
        lastToolMessageIndex: messages.filter(
          (message) => message.role === 'tool',
        ).length,
        lastMessageIndex: messages.length,
      },
    };
  }

  private useCheckpointer(): boolean {
    return Boolean(this.providers.checkpointer);
  }

  /**
   * Whether this run starts on a conversation the checkpoint cleanup released,
   * whose context now lives only in its stored messages. A resume or a
   * decision continues a paused run, which only its checkpoint can do, so
   * neither ever starts over from the messages.
   */
  private isReleasedThread(
    operation: AgentOperation,
    request: AgentRequest,
    thread: AgentThread | undefined,
  ): boolean {
    if (!this.providers.restoresReleasedThreads || !this.useCheckpointer())
      return false;
    if (operation === 'resume' || request.userDecisions?.decisions?.length)
      return false;
    return thread?.thread === RELEASED_THREAD;
  }
  private async prepare(
    operation: AgentOperation,
    request: AgentInvokeRequest<unknown>,
    llm: ResolvedAgentLLM,
    responseMetadataCollector?: BaseCallbackHandler,
  ): Promise<PreparedAgentContext> {
    const { conversation, features } = this.providers;
    const context = this.agentContext;
    let thread = await conversation.messages.currentThread();
    const history = request.messageId
      ? await conversation.messages.loadMessages(request.messageId)
      : this.isReleasedThread(operation, request, thread)
        ? await conversation.messages.loadMessages()
        : [];
    // A released conversation continues from its stored messages on a fresh
    // thread. One with nothing stored runs exactly as it would have.
    const restoring = !request.messageId && history.length > 0;
    const shouldLoadHistory = Boolean(request.messageId) || restoring;
    const allMessages = [...history, ...(request.userMessages ?? [])];
    const formatted = await this.providers.converters.formatMessages(
      allMessages,
      llm,
    );
    const formattedSystemPrompt = formatted
      .filter((message: any) => message?.role === 'system')
      .map((message: any) => message.content)
      .filter(Boolean)
      .join('\n');
    const messages = formatted.filter(
      (message: any) => message?.role !== 'system',
    );
    const importantPrompt =
      context.agentContext.state.important === 'GraphRecursionError'
        ? `<Important>You have already called tools multiple times and gathered sufficient information.\nFirst, provide a summary based on the existing information. Do not call additional tools.\nIf information is missing, clearly state it in the summary.</Important>`
        : undefined;
    const systemPrompt = features.contextEnrichment
      ? [
          await context.getSystemPrompt(allMessages),
          importantPrompt,
          formattedSystemPrompt,
        ]
          .filter(Boolean)
          .join('\n\n') || undefined
      : [importantPrompt, formattedSystemPrompt].filter(Boolean).join('\n\n') ||
        undefined;
    const discoveredTools = features.tools
      ? await context.discoveredTools()
      : {
          tools: new Map<string, ToolsEntity>(),
          activeTools: () => Promise.resolve(new Set<string>()),
        };
    const resolvedTools = llm.provider.resolveTools(
      buildAgentTools([...discoveredTools.tools.values()], {
        agentContext: context.agentContext,
        container: this.providers.container,
      }),
    );
    if (this.shouldFork(operation, request) || restoring) {
      thread = await this.forkThread(thread, llm.provider);
    }
    const state = shouldLoadHistory
      ? this.buildInitialState(history)
      : undefined;
    const input = request.userDecisions?.decisions?.length
      ? new Command({
          resume: request.userDecisions.interruptId
            ? {
                [request.userDecisions.interruptId]: {
                  decisions: request.userDecisions.decisions,
                },
              }
            : { decisions: request.userDecisions.decisions },
        })
      : messages.length
        ? { messages, ...(state ?? {}) }
        : null;
    // A tool's context is bound when the tool is built, never read back out of
    // the invocation config, so `agentContext` on a request reaches nothing.
    const { agentContext: _requestAgentContext, ...requestRuntime } =
      request.runtime ?? {};
    const config = {
      context: {
        ...requestRuntime,
        agentRequest: request,
        decisions: request.userDecisions,
      },
      recursionLimit: 200,
      configurable:
        this.useCheckpointer() && thread
          ? { thread_id: thread.threadId }
          : undefined,
      writer: request.writer,
      signal: request.signal,
      ...(responseMetadataCollector
        ? { callbacks: [responseMetadataCollector] }
        : {}),
      metadata: { currentConversation: context.currentConversation() },
    };
    if (!config.configurable) delete config.configurable;
    return {
      input,
      responseFormat: request.responseFormat,
      systemPrompt,
      tools: resolvedTools,
      discoveredTools,
      llm,
      config,
      state,
      thread,
      checkpointer: this.useCheckpointer()
        ? this.providers.checkpointer
        : undefined,
      metadata: {
        currentConversation: context.currentConversation(),
        messageId: request.messageId,
      },
      providerName: llm.providerName,
      llmService: llm.llmService,
      model: llm.model,
      provider: llm.provider,
    };
  }

  private create(prepared: PreparedAgentContext) {
    return createAgent({
      model: prepared.provider.createModel(),
      tools: prepared.tools,
      middleware: buildStandardAgentMiddleware(this.providers, prepared),
      systemPrompt: prepared.systemPrompt,
      ...(prepared.responseFormat
        ? { responseFormat: prepared.responseFormat as never }
        : {}),
      ...(prepared.checkpointer ? { checkpointer: prepared.checkpointer } : {}),
    });
  }

  private begin(request: AgentRequest) {
    const controller = new AbortController();
    const signal = mergeSignals(controller.signal, request.signal);
    const token = Symbol('agent-execution');
    this.activeController = controller;
    this.providers.conversation.abort.registerAbortHandle(token, {
      signal,
      abort: (reason) => controller.abort(reason),
    });
    return { controller, signal, token };
  }

  private end(token: symbol, controller: AbortController): void {
    this.providers.conversation.abort.unregisterAbortHandle(token);
    if (this.activeController === controller) this.activeController = undefined;
  }

  /**
   * Reads one execution's answer out of the graph state. The state also holds
   * the keys this package's own middleware contributes; they stay internal, so
   * a middleware added later is not a change to what a caller receives.
   */
  private async toInvokeResult<TStructured>(
    result: unknown,
    prepared: PreparedAgentContext,
    interrupt?: AgentInvokeInterrupt,
  ): Promise<AgentInvokeResult<TStructured>> {
    const state = (result ?? {}) as {
      messages?: unknown;
      structuredResponse?: TStructured;
    };
    const messages = Array.isArray(state.messages) ? state.messages : [];
    const answer = messages.filter(isLangChainAIMessage).at(-1);
    const message = answer
      ? await this.providers.converters.assistant.convert(answer, prepared)
      : null;
    return {
      message,
      ...('structuredResponse' in state
        ? { structuredResponse: state.structuredResponse as TStructured }
        : {}),
      ...(interrupt ? { interrupt } : {}),
    };
  }

  /**
   * Marks the tool calls an interrupt paused as `interrupted` and records the
   * interrupt on their assistant message. A reviewer's decision attaches only
   * to an `interrupted` tool call, and a resume rebuilds its Command from the
   * recorded `interruptId`, so an interrupt left unrecorded cannot be answered.
   * An action is skipped when its conversation has no saved assistant message
   * to record it against.
   */
  private async recordInterrupt(
    interruptId: string,
    actions: readonly AgentInterruptAction[],
    messageIdFor: (sessionId: string) => string | undefined,
  ): Promise<RecordedInterruptAction[]> {
    const recorded: RecordedInterruptAction[] = [];
    for (const action of actions) {
      const { toolCall, currentConversation } = action;
      if (!toolCall || !currentConversation) continue;
      const messageId = messageIdFor(currentConversation.sessionId);
      if (!messageId) continue;
      await this.providers.conversation.messages.updateToolInterrupted(
        currentConversation.sessionId,
        messageId,
        toolCall.id,
        interruptId,
        action,
      );
      recorded.push({
        action,
        toolCall,
        conversation: currentConversation,
        messageId,
      });
    }
    return recorded;
  }

  private async executeInvoke<TStructured>(
    operation: AgentOperation,
    request: AgentInvokeRequest<TStructured>,
  ): Promise<AgentInvokeResult<TStructured>> {
    const { conversation } = this.providers;
    const identity = this.agentContext.currentConversation();
    const { controller, signal, token } = this.begin(request);
    let activeProvider: LLMProvider | undefined;
    // An interrupt names the conversation it paused but not the message, and a
    // sub-agent's saved messages are reported only through the writer, so the
    // writer is observed. Events still reach whoever would have received them:
    // the caller's writer, or, without one, the enclosing graph's.
    const messageIds = new Map<string, string>();
    const forward =
      request.writer ??
      (getConfig() as { writer?: (chunk: unknown) => void } | undefined)
        ?.writer;
    const writer = (chunk: unknown): void => {
      const event = chunk as {
        action?: unknown;
        body?: { messageId?: unknown };
        currentConversation?: { sessionId?: unknown };
      } | null;
      const messageId = event?.body?.messageId;
      if (event?.action === 'AfterAIMessageSaved' && messageId) {
        const sessionId = event.currentConversation?.sessionId;
        messageIds.set(
          typeof sessionId === 'string' ? sessionId : identity.sessionId,
          String(messageId),
        );
      }
      forward?.(chunk);
    };
    await conversation.event.beforeExecution('invoking');
    try {
      const llm = await this.resolveLLM().catch((error: unknown) => {
        throw toConfigurationError(error);
      });
      activeProvider = llm.provider;
      const prepared = await this.prepare(
        operation,
        { ...request, signal, writer },
        llm,
      );
      const result = await this.create(prepared).invoke(
        prepared.input as any,
        { ...prepared.config, signal } as any,
      );
      const interrupt = readInvokeInterrupt(result);
      if (!interrupt?.id)
        return await this.toInvokeResult<TStructured>(result, prepared);
      const actions = toInterruptActions(interrupt);
      // The graph state carries the message this execution last saved, which is
      // the one a resume re-enters when it saves nothing new.
      const stateMessageId = (result as { messageId?: unknown }).messageId;
      await this.recordInterrupt(
        interrupt.id,
        actions,
        (sessionId) =>
          messageIds.get(sessionId) ??
          (sessionId === identity.sessionId && stateMessageId
            ? String(stateMessageId)
            : undefined),
      );
      return await this.toInvokeResult<TStructured>(result, prepared, {
        id: interrupt.id,
        actions,
      });
    } catch (error) {
      // A graph nested in another graph's node throws its interrupt instead of
      // returning it; the enclosing execution records it.
      if (isGraphInterrupt(error)) throw error;
      if (signal.aborted)
        throw new AgentServiceError('ABORTED', 'Agent execution aborted', {
          cause: error,
          aborted: true,
        });
      throw normalizeAgentError(
        error,
        describeProviderError(activeProvider, error),
      );
    } finally {
      this.end(token, controller);
      await conversation.event.afterExecution('invoking', {
        aborted: signal.aborted,
      });
    }
  }

  private async *executeStream(
    operation: AgentOperation,
    request: AgentRequest,
  ): AsyncGenerator<AgentStreamEvent> {
    const { conversation } = this.providers;
    const context = this.agentContext;
    const identity = context.currentConversation();
    const { controller, signal, token } = this.begin(request);
    const reasoning = new Set<string>();
    const messageIds = new Map<string, string>();
    let gathered: any;
    let sent = 0;
    let prepared: PreparedAgentContext | undefined;
    let activeProvider: LLMProvider | undefined;
    let responseMetadata: ExecutionResponseMetadata | undefined;
    let executionStarted = false;
    const stopReasoning = function* (
      target: typeof identity,
    ): Generator<AgentStreamEvent> {
      const key = `${target.sessionId}:${target.from ?? ''}:${target.username ?? ''}`;
      if (reasoning.delete(key))
        yield { type: 'reasoning', conversation: target, action: 'stop' };
    };
    try {
      await conversation.streamCache.clear();
      await conversation.event.beforeExecution('streaming');
      executionStarted = true;
      const llm = await this.resolveLLM().catch((error: unknown) => {
        throw toConfigurationError(error);
      });
      activeProvider = llm.provider;
      responseMetadata = new ExecutionResponseMetadata();
      const responseMetadataCollector = new ResponseMetadataCollector(
        llm.provider,
        responseMetadata,
      );
      prepared = await this.prepare(
        operation,
        { ...request, signal },
        llm,
        responseMetadataCollector,
      );
      const stream = await this.create(prepared).stream(
        prepared.input as any,
        {
          ...prepared.config,
          signal,
          streamMode: ['updates', 'messages', 'custom'],
        } as any,
      );
      yield { type: 'stream_start', conversation: identity };
      for await (const [mode, chunks] of stream as any) {
        if (mode === 'messages') {
          const [chunk, metadata = {}] = chunks ?? [];
          const current = metadata.currentConversation ?? identity;
          if (chunk?.type !== 'ai') continue;
          gathered = gathered === undefined ? chunk : concat(gathered, chunk);
          const reasoningContent = activeProvider.parseReasoningContent(
            chunk as any,
          );
          if (reasoningContent) {
            const key = `${current.sessionId}:${current.from ?? ''}:${current.username ?? ''}`;
            const first = !reasoning.has(key);
            reasoning.add(key);
            sent++;
            yield {
              type: 'reasoning',
              conversation: current,
              action: first ? 'start' : 'content',
              content: reasoningContent,
            };
          }
          const content = chunk.content
            ? activeProvider.parseResponseChunk(chunk.content)
            : null;
          if (content) {
            yield* stopReasoning(current);
            sent++;
            yield { type: 'content', conversation: current, content };
          }
          if (chunk.tool_call_chunks?.length) {
            yield* stopReasoning(current);
            sent++;
            yield {
              type: 'tool_call_chunks',
              conversation: current,
              chunks: chunk.tool_call_chunks,
            };
          }
          const webSearch = activeProvider.parseWebSearchAction(chunk as any);
          if (webSearch?.length) {
            yield* stopReasoning(current);
            sent++;
            yield {
              type: 'web_search',
              conversation: current,
              body: webSearch,
            };
          }
        } else if (mode === 'updates') {
          const interrupt = chunks?.__interrupt__?.[0];
          if (interrupt?.id) {
            const actions = toInterruptActions(interrupt);
            const recorded = await this.recordInterrupt(
              interrupt.id,
              actions,
              (sessionId) => messageIds.get(sessionId),
            );
            for (const {
              action,
              toolCall,
              conversation: target,
              messageId,
            } of recorded) {
              sent++;
              yield {
                type: 'tool_call_status',
                conversation: target,
                status: {
                  toolCall: { ...toolCall, messageId },
                  invokeStatus: 'interrupted',
                  interruptAction: action,
                },
              };
            }
            sent++;
            yield {
              type: 'interrupt_requested',
              conversation: identity,
              interruptId: interrupt.id,
              actions,
            };
          }
        } else if (mode === 'custom') {
          const current = chunks?.currentConversation ?? identity;
          if (chunks?.action === 'AfterAIMessageSaved') {
            if (chunks.body?.messageId)
              messageIds.set(current.sessionId, chunks.body.messageId);
            await conversation.streamCache.skipped();
            const metadata = chunks.body?.id
              ? responseMetadata.take(chunks.body.id)
              : undefined;
            if (metadata && chunks.body?.messageId)
              await conversation.messages.updateMessage(chunks.body.messageId, {
                metadata: { response_metadata: metadata },
              });
            yield {
              type: 'message_persisted',
              conversation: current,
              messageId: chunks.body?.messageId,
              role: 'assistant',
            };
          } else if (chunks?.action === 'initToolCalls') {
            yield* stopReasoning(current);
            sent++;
            yield {
              type: 'tool_calls',
              conversation: current,
              toolCalls: chunks.body?.toolCalls ?? chunks.body ?? [],
            };
          } else if (
            chunks?.action === 'beforeToolCall' ||
            chunks?.action === 'afterToolCall' ||
            chunks?.action === 'afterToolCallError'
          ) {
            const toolCall = chunks.body?.toolCall;
            sent++;
            const invokeStatus =
              chunks.action === 'beforeToolCall'
                ? 'pending'
                : chunks.action === 'afterToolCallError'
                  ? 'error'
                  : 'done';
            yield {
              type: 'tool_call_status',
              conversation: current,
              status: {
                toolCall,
                invokeStatus,
                ...chunks.body?.toolCallResult,
              },
            };
          } else if (chunks?.action === 'beforeSendToolMessage') {
            const { messageId, messages = [] } = chunks.body ?? {};
            const results = await conversation.messages.listToolCallResult(
              messageId,
              messages.map(
                (item: { metadata: { toolCallId: string } }) =>
                  item.metadata.toolCallId,
              ),
            );
            for (const { metadata } of messages) {
              const result = results.get(metadata.toolCallId);
              sent++;
              yield {
                type: 'tool_call_status',
                conversation: current,
                status: {
                  toolCall: {
                    messageId,
                    id: metadata.toolCallId,
                    name: metadata.toolName,
                  },
                  invokeStatus: 'confirmed',
                  status: result?.status,
                  content: result?.content,
                  invokeStartTime: result?.invokeStartTime,
                  invokeEndTime: result?.invokeEndTime,
                },
              };
            }
            sent++;
            yield { type: 'new_message', conversation: current };
          } else if (chunks?.action === 'beforeSubAgentInvoke') {
            sent++;
            yield { type: 'sub_agent_started', conversation: current };
          } else if (chunks?.action === 'afterSubAgentInvoke') {
            sent++;
            yield { type: 'sub_agent_completed', conversation: current };
          }
        }
      }
      for (const key of [...reasoning]) {
        reasoning.delete(key);
        yield { type: 'reasoning', conversation: identity, action: 'stop' };
      }
      if (!sent && !signal.aborted)
        throw new AgentServiceError('EMPTY_RESPONSE', 'Empty response', {
          retryable: true,
        });
      yield { type: 'stream_end', conversation: identity };
    } catch (error) {
      for (const key of [...reasoning]) {
        reasoning.delete(key);
        yield { type: 'reasoning', conversation: identity, action: 'stop' };
      }
      if (signal.aborted) {
        if (gathered && prepared) {
          const value = await this.providers.converters.assistant.convert(
            gathered,
            prepared,
          );
          if (value) {
            value.metadata = {
              ...(value.metadata ?? {}),
              interrupted: true,
            } as any;
            await conversation.messages.saveAssistantMessage(
              value,
              prepared.discoveredTools.tools,
            );
          }
        }
        throw new AgentServiceError('ABORTED', 'Agent execution aborted', {
          cause: error,
          aborted: true,
        });
      }
      throw normalizeAgentError(
        error,
        describeProviderError(activeProvider, error),
      );
    } finally {
      try {
        this.end(token, controller);
      } finally {
        try {
          if (executionStarted) {
            await conversation.event.afterExecution('streaming', {
              aborted: signal.aborted,
            });
          }
        } finally {
          try {
            await conversation.streamCache.clear();
          } finally {
            responseMetadata?.dispose();
          }
        }
      }
    }
  }
}

export const createAgentService = (providers: AgentProviders): AgentService =>
  new AgentService(providers);
