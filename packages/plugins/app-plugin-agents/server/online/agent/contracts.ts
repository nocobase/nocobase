import type { OnlineAgentResendOptions } from '../../../shared/resend.js';
import type { JSONSchema7, ModelMessage, Schema } from 'ai';
import type { AppUIMessage } from '../../../shared/online-agent.js';
import type { ModelRef } from '../../../shared/models.js';
import type {
  OnlineAgentOptions,
  NativeApproval,
  NativeHistoryPage,
  NativeHistoryQuery,
  NativeUIChunk,
  OnlineAgentSendOptions,
  OnlineAgentJson,
  OnlineAgentResult,
  OnlineAgentConfig,
  OnlineAgentContext,
  OnlineAgentRealtimeOptions,
  OnlineAgentBoundary,
  OnlineAgentBackendKind,
  OnlineAgentConfiguration,
  OnlineAgentInitialConfiguration,
} from './types.js';
import type { NativeSessionStore } from './persistence/store.js';
import type { ResolvedPageContext } from '../../../shared/conversations.js';
import type { NativeOnlineAgent } from './native/execution.js';
import type { OnlineAgentUIStreams } from './transport/streams.js';
import type {
  OnlineAgentSession,
  OnlineAgentSessionIdentity,
} from './persistence/types.js';
import type { OnlineAgentExecution } from './native/types.js';

/** Public conversation capabilities; model replay always derives from the private original. */
export interface OnlineAgent {
  readonly sessionId: string;
  status(): Promise<'running' | 'idle'>;
  history(): Promise<AppUIMessage[]>;
  abort(): Promise<void>;
  retryFinalization(): Promise<void>;
}

export interface RealtimeOnlineAgent extends OnlineAgent {
  readonly backend: 'native' | 'runner';
  messages(query: NativeHistoryQuery): Promise<NativeHistoryPage>;
  send(
    messages: ModelMessage[],
    input?: OnlineAgentSendOptions,
  ): Promise<number>;
  resend(options?: OnlineAgentResendOptions): Promise<number>;
  receive(): Promise<ReadableStream<NativeUIChunk> | null>;
  approve(input: NativeApproval): Promise<number>;
}

export interface BackgroundOnlineAgent extends OnlineAgent {
  run(
    messages: ModelMessage[],
    schema: JSONSchema7,
    input?: { overrides?: OnlineAgentOptions; selectedModel?: ModelRef },
  ): Promise<void>;
  /** Wait for the execution admitted at invocation, including persistence and finalization. */
  get(): Promise<OnlineAgentJson>;
  /** A finite observation budget; timeout never cancels the execution. */
  try(options?: { wait?: number }): Promise<OnlineAgentResult>;
}
/** Execution-specific contract. Unsupported capabilities reject; they are never optional or redirected. */
export interface OnlineAgentBackend {
  readonly kind: OnlineAgentBackendKind;
  createRealtime(
    context: OnlineAgentContext,
    initial: OnlineAgentInitialConfiguration,
    options: OnlineAgentRealtimeOptions,
    boundary?: OnlineAgentBoundary,
  ): Promise<RealtimeOnlineAgent>;
  restoreRealtime(
    context: OnlineAgentContext,
    options: OnlineAgentRealtimeOptions & { sessionId: string },
    boundary?: OnlineAgentBoundary,
  ): Promise<RealtimeOnlineAgent>;
  createBackground(
    context: OnlineAgentContext,
    initial: OnlineAgentInitialConfiguration,
    options: OnlineAgentRealtimeOptions,
    boundary?: OnlineAgentBoundary,
  ): Promise<BackgroundOnlineAgent>;
  restoreBackground(
    context: OnlineAgentContext,
    options: OnlineAgentRealtimeOptions & { sessionId: string },
    boundary?: OnlineAgentBoundary,
  ): Promise<BackgroundOnlineAgent>;
  configuration(
    context: OnlineAgentContext,
    id: string,
  ): Promise<OnlineAgentConfiguration>;
  configure(
    context: OnlineAgentContext,
    id: string,
    options: OnlineAgentOptions,
    selectedModel?: ModelRef,
    boundary?: OnlineAgentBoundary,
  ): Promise<OnlineAgentConfiguration>;
  shutdown(): Promise<void>;
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
  identify(userId: string, id: string): Promise<OnlineAgentSessionIdentity>;
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

/** Internal execution capabilities, shared by all facades of the application's one service. */
export interface NativeSessionHost {
  sessions: OnlineAgentSessionManager;
  native: NativeOnlineAgent;
  uiStreams: OnlineAgentUIStreams;
  isActive(id: string): boolean;
  abort(
    context: OnlineAgentContext,
    id: string,
    kind: OnlineAgentSession['kind'],
  ): Promise<void>;
  retryFinalization(context: OnlineAgentContext, id: string): Promise<void>;
  start(
    context: OnlineAgentContext,
    id: string,
    messages: ModelMessage[],
    input?: OnlineAgentSendOptions & { boundary?: OnlineAgentBoundary },
    schema?: Schema<OnlineAgentJson>,
    onExecution?: (execution: OnlineAgentExecution) => void,
  ): Promise<number>;
  resend(
    context: OnlineAgentContext,
    id: string,
    options: OnlineAgentResendOptions,
    input: OnlineAgentSendOptions & { boundary?: OnlineAgentBoundary },
    onExecution?: (execution: OnlineAgentExecution) => void,
  ): Promise<number>;
  approve(
    context: OnlineAgentContext,
    id: string,
    input: NativeApproval,
    onExecution?: (execution: OnlineAgentExecution) => void,
  ): Promise<number>;
  observe(
    userId: string,
    id: string,
    wait?: number,
  ): Promise<OnlineAgentResult>;
}
