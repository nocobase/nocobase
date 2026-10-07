import type {
  AIMessage as LangChainAIMessage,
  BaseMessageLike,
  HumanMessage,
  ToolMessage,
} from '@langchain/core/messages';
import type { BaseCheckpointSaver, Command } from '@langchain/langgraph';
import type { CreateAgentParams } from 'langchain';
import type { ZodType } from 'zod';
import type { LLMProvider } from '@nocobase/ai-employee';
import type { ToolsEntity } from '@nocobase/ai-employee';
import type { Logger } from '@nocobase/logging';
import type { ServiceResolver } from '@nocobase/service-provider';
import type {
  AgentContext,
  AgentThread,
  AIMessage,
  AIMessageInput,
  AIToolCall,
  AIToolMessage,
  UserDecision,
} from '@nocobase/ai-employee';
export type { AgentThread } from '@nocobase/ai-employee';
import type { LLMStreamCached } from '../manager/llm-stream-cached-manager.js';
export type AgentExecutionSource = 'main-agent' | 'sub-agent' | (string & {});
export type AgentExecutionMode = 'streaming' | 'invoking';
export type AgentOperation = 'stream' | 'invoke' | 'resume' | 'fork';

export interface CurrentConversation {
  sessionId: string;
  username?: string;
  from?: AgentExecutionSource;
  metadata?: Record<string, unknown>;
}

/**
 * What one call to an already-created agent supplies. Whatever is fixed for the
 * agent's lifetime is in `AgentState`, so a request cannot swap it.
 */
export interface AgentRequest {
  /** The message this operation forks from, where it forks from one. */
  messageId?: string;
  userMessages?: AIMessageInput[];
  userDecisions?: {
    interruptId?: string;
    decisions: UserDecision[];
  };
  /** Per-call channel for the middleware pipeline, such as `appendMessages`. */
  runtime?: Record<string, unknown>;
  writer?: (chunk: unknown) => void;
  signal?: AbortSignal;
}

/**
 * A request that may ask the final answer to match a schema. Only `invoke()`
 * accepts one, because only it reports the structured value back; `stream()`
 * reports the answer as content events and has nowhere to put it.
 */
export interface AgentInvokeRequest<TStructured = never> extends AgentRequest {
  responseFormat?: ZodType<TStructured>;
}

/**
 * A human-in-the-loop pause an `invoke()` stopped at. The paused tool calls
 * have already been recorded as `interrupted`, so a decision can be attached to
 * each and the execution resumed with `resumeInvoke()` or `resumeStream()`.
 */
export interface AgentInvokeInterrupt {
  id: string;
  actions: AgentInterruptAction[];
}

/**
 * What one `invoke()` produced, in this package's own message shape rather
 * than the underlying graph state. `structuredResponse` is present only when
 * the request supplied a `responseFormat`; `interrupt` only when the execution
 * paused for a human decision instead of finishing, in which case `message` is
 * the assistant turn that requested the paused tool calls.
 */
export interface AgentInvokeResult<TStructured = never> {
  message: AIMessageInput | null;
  structuredResponse?: TStructured;
  interrupt?: AgentInvokeInterrupt;
}

export interface AgentMessageIndex {
  lastHumanMessageIndex: number;
  lastAIMessageIndex: number;
  lastToolMessageIndex: number;
  lastMessageIndex: number;
}

export interface AgentGraphState {
  messageId?: string;
  lastMessageIndex: AgentMessageIndex;
  [key: string]: unknown;
}

export type PreparedAgentInput =
  Command | ({ messages: unknown[] } & Partial<AgentGraphState>) | null;

export interface ResolvedAgentLLM {
  readonly providerName: string;
  readonly llmService?: string;
  readonly model: string;
  readonly provider: LLMProvider;
}

export interface DiscoveredTools {
  readonly tools: ReadonlyMap<string, ToolsEntity>;
  activeTools(): Promise<ReadonlySet<string>>;
}

export type AgentMessageConversionContext = Pick<
  ResolvedAgentLLM,
  'providerName' | 'llmService' | 'model' | 'provider'
>;

/**
 * Inputs prepared for the infrastructure-owned pipeline. Deliberately has no
 * middleware field: only AgentService may create or order middleware.
 */
export interface PreparedAgentContext extends AgentMessageConversionContext {
  input: PreparedAgentInput;
  responseFormat?: ZodType<unknown>;
  systemPrompt?: CreateAgentParams['systemPrompt'];
  tools: CreateAgentParams['tools'];
  discoveredTools: DiscoveredTools;
  llm?: ResolvedAgentLLM;
  config: Record<string, any>;
  state?: AgentGraphState;
  thread?: AgentThread;
  checkpointer?: BaseCheckpointSaver | boolean;
  metadata: {
    currentConversation: CurrentConversation;
    [key: string]: unknown;
  };
}

export interface AgentFeatureOptions {
  contextEnrichment: boolean;
  skills: boolean;
  tools: boolean;
  toolInteraction: boolean;
  toolCallStatus: boolean;
  conversationPersistence: boolean;
  toolCallSanitizer: boolean;
  knowledgeBase: boolean;
  subAgents: boolean;
}

export const DEFAULT_AGENT_FEATURES: AgentFeatureOptions = {
  contextEnrichment: true,
  skills: true,
  tools: true,
  toolInteraction: true,
  toolCallStatus: true,
  conversationPersistence: true,
  toolCallSanitizer: true,
  knowledgeBase: true,
  subAgents: true,
};

export const STANDARD_AGENT_MIDDLEWARE_ORDER = [
  'ContextEnrichmentMiddleware',
  'SkillToolBindingMiddleware',
  'ToolInteractionMiddleware',
  'ToolCallStatusMiddleware',
  'ConversationMiddleware',
  'ToolCallSanitizerMiddleware',
] as const;

export interface AgentToolCallStatus {
  toolCall: Partial<AIToolCall> & Pick<AIToolCall, 'id' | 'name'>;
  invokeStatus:
    | 'init'
    | 'pending'
    | 'done'
    | 'error'
    | 'confirmed'
    | 'interrupted'
    | 'waiting'
    | 'cancelled';
  status?: string | null;
  invokeStartTime?: Date | string | null;
  invokeEndTime?: Date | string | null;
  content?: unknown;
  interruptAction?: AgentInterruptAction;
}

export type AgentStreamEvent =
  | { type: 'stream_start'; conversation: CurrentConversation }
  | { type: 'stream_end'; conversation: CurrentConversation }
  | {
      type: 'content';
      conversation: CurrentConversation;
      content: unknown;
    }
  | {
      type: 'reasoning';
      conversation: CurrentConversation;
      action: 'start' | 'content' | 'stop';
      content?: unknown;
    }
  | {
      type: 'web_search';
      conversation: CurrentConversation;
      body: unknown;
    }
  | {
      type: 'tool_call_chunks';
      conversation: CurrentConversation;
      chunks: unknown[];
    }
  | {
      type: 'tool_calls';
      conversation: CurrentConversation;
      toolCalls: AIToolCall[];
    }
  | {
      type: 'tool_call_status';
      conversation: CurrentConversation;
      status: AgentToolCallStatus;
    }
  | {
      type: 'interrupt_requested';
      conversation: CurrentConversation;
      interruptId: string;
      actions: AgentInterruptAction[];
    }
  | {
      type: 'interrupt_resolved';
      conversation: CurrentConversation;
      interruptId?: string;
    }
  | {
      type: 'message_persisted';
      conversation: CurrentConversation;
      messageId?: string;
      role: string;
    }
  | { type: 'new_message'; conversation: CurrentConversation }
  | { type: 'sub_agent_started'; conversation: CurrentConversation }
  | { type: 'sub_agent_completed'; conversation: CurrentConversation };

export type AgentServiceErrorCode =
  /** The model, LLM service, or provider is not configured or not resolvable. */
  | 'CONFIGURATION_ERROR'
  | 'MODEL_RESPONSE_ERROR'
  | 'GRAPH_RECURSION_ERROR'
  | 'EMPTY_RESPONSE'
  | 'PROVIDER_ERROR'
  | 'PERSISTENCE_ERROR'
  | 'ABORTED';

export interface AgentServiceErrorOptions {
  cause?: unknown;
  aborted?: boolean;
  retryable?: boolean;
}

export class AgentServiceError extends Error {
  readonly code: AgentServiceErrorCode;
  readonly cause?: unknown;
  readonly aborted: boolean;
  readonly retryable: boolean;

  constructor(
    code: AgentServiceErrorCode,
    message: string,
    options: AgentServiceErrorOptions = {},
  ) {
    super(message);
    this.name = 'AgentServiceError';
    this.code = code;
    this.cause = options.cause;
    this.aborted = options.aborted ?? code === 'ABORTED';
    this.retryable = options.retryable ?? false;
  }

  /**
   * The deepest message in the cause chain, falling back to this error's own.
   * A consumer reporting the failure reads this instead of walking `cause`.
   */
  get rootMessage(): string {
    let current: unknown = this.cause;
    let message = this.message;
    const seen = new Set<unknown>();
    while (current && typeof current === 'object' && !seen.has(current)) {
      seen.add(current);
      const candidate = (current as { message?: unknown }).message;
      if (typeof candidate === 'string' && candidate) message = candidate;
      current = (current as { cause?: unknown }).cause;
    }
    return message;
  }
}

export interface AgentInterruptPayload {
  actionRequests: { name: string; args: unknown; description: string }[];
  reviewConfigs: { actionName: string; allowedDecisions: string[] }[];
}

export interface AgentInterruptAction {
  order: number;
  description?: string;
  allowedDecisions?: string[];
  toolCall?: { id: string; name: string };
  currentConversation?: CurrentConversation;
}

export interface SavedAssistantMessage {
  message: AIMessage;
  initializedToolCalls: AIToolMessage[];
}

export interface ConversationMessageStore {
  loadMessages(messageId?: string): Promise<AIMessage[]>;
  saveUserMessages(
    messages: AIMessageInput[],
    messageId?: string,
    thread?: AgentThread,
  ): Promise<void>;
  saveAssistantMessage(
    message: AIMessageInput,
    toolMap: ReadonlyMap<string, ToolsEntity>,
  ): Promise<SavedAssistantMessage>;
  saveToolMessages(
    sourceMessageId: string,
    messages: AIMessageInput[],
  ): Promise<void>;
  updateMessage(
    messageId: string,
    patch: Partial<AIMessageInput>,
  ): Promise<void>;
  currentThread(): Promise<AgentThread | undefined>;
  updateToolInterrupted(
    sessionId: string,
    messageId: string,
    toolCallId: string,
    interruptId: string,
    interruptAction: AgentInterruptAction,
  ): Promise<number>;
  updateToolPending(messageId: string, toolCallId: string): Promise<number>;
  updateToolDone(
    messageId: string,
    toolCallId: string,
    result: unknown,
  ): Promise<number>;
  updateToolError(
    messageId: string,
    toolCallId: string,
    error: unknown,
  ): Promise<number>;
  cancelToolCall(): Promise<AIMessageInput[] | undefined>;
  getToolCallResult(
    messageId: string,
    toolCallId: string,
  ): Promise<AIToolMessage | null>;
  listToolCallResult(
    messageId: string,
    toolCallIds: string[],
  ): Promise<Map<string, AIToolMessage>>;
}

export interface AgentEventHandler {
  beforeExecution(mode: AgentExecutionMode): Promise<void>;
  afterExecution(
    mode: AgentExecutionMode,
    options?: { aborted?: boolean },
  ): Promise<void>;
}

export interface AgentAbortController {
  registerAbortHandle(token: symbol, handle: AgentAbortHandle): void;
  unregisterAbortHandle(token: symbol): void;
}

export interface ConversationProvider {
  messages: ConversationMessageStore;
  streamCache: LLMStreamCached;
  event: AgentEventHandler;
  abort: AgentAbortController;
}

export interface AgentContextProvider {
  currentConversation(): CurrentConversation;
  /**
   * The LLM this agent runs on. It follows from the agent's own state and the
   * employee's model policy, never from the request being served.
   */
  resolveLLM(): Promise<ResolvedAgentLLM>;
  getSystemPrompt(
    messages: readonly AIMessageInput[],
  ): Promise<string | undefined>;
  discoveredTools(): Promise<DiscoveredTools>;
  /**
   * The context every discovered tool receives when it executes. It is fixed
   * when the AgentService is created and is never taken from a request, so a
   * caller cannot swap the actor, session, or services a tool runs with.
   */
  readonly agentContext: AgentContext;
}

export interface ChatMessageConverter<TSource, TResult> {
  convert(
    source: TSource,
    context: AgentMessageConversionContext,
  ): TResult | Promise<TResult>;
}

export interface ChatMessageConverters {
  formatMessages(
    messages: readonly AIMessageInput[],
    context: AgentMessageConversionContext,
  ): Promise<readonly BaseMessageLike[]>;
  readonly assistant: ChatMessageConverter<
    LangChainAIMessage,
    AIMessageInput | null
  >;
  readonly human: ChatMessageConverter<HumanMessage, AIMessageInput | null>;
  readonly tool: ChatMessageConverter<ToolMessage, AIMessageInput>;
}

export interface AgentAbortHandle {
  readonly signal: AbortSignal;
  abort(reason?: unknown): void;
}

export interface AgentProviders {
  conversation: ConversationProvider;
  context: AgentContextProvider;
  converters: ChatMessageConverters;
  checkpointer?: BaseCheckpointSaver | boolean;
  /**
   * Whether a run on a released conversation, one whose checkpoints the
   * cleanup deleted, replays its stored messages onto a fresh thread. Only
   * conversations kept in the plugin's own tables, with their checkpoints
   * there too, are ever released.
   */
  restoresReleasedThreads?: boolean;
  logger: Logger;
  features: AgentFeatureOptions;
  /**
   * Resolves the container tokens a tool declared. Absent only where no tool
   * declares anything, such as a service assembled directly in a test.
   */
  container?: ServiceResolver;
}

export interface CreateAgentProvidersOptions {
  conversation: ConversationProvider;
  context: AgentContextProvider;
  converters?: ChatMessageConverters;
  logger?: Logger;
  features?: Partial<AgentFeatureOptions>;
  checkpointer?: BaseCheckpointSaver | boolean;
  restoresReleasedThreads?: boolean;
  container?: ServiceResolver;
}
export type AIEmployeeProviderOptions = {
  username?: string;
  modelRef?: {
    provider?: string;
    llmService?: string;
    model: string;
  };
  from?: AgentExecutionSource;
};

export type CreateAIEmployeeProviders = (
  options: AIEmployeeProviderOptions,
) => Promise<AgentProviders> | AgentProviders;

/** Compatibility names for the agent-internal implementation modules. */
export type AgentConversation = CurrentConversation;
export type AgentExecutionRequest = AgentRequest & {
  executionMode?: 'stream' | 'invoke';
};
export type AgentServiceEvent = AgentStreamEvent;
export type PreparedAgentExecution = PreparedAgentContext & {
  conversation: AgentConversation;
  providerContext?: unknown;
  checkpointer?: unknown;
};
