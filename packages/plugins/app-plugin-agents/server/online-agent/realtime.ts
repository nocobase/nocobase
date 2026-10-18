import type { ModelMessage } from 'ai';
import type {
  ConversationMessage,
  ResolvedPageContext,
} from '../../shared/conversations.js';
import type { ModelRef } from '../../shared/models.js';
import type { OnlineAgentStreamEvent } from '../../shared/online-agent.js';
import type {
  OnlineAgentOptions,
  OnlineAgentConfig,
  OnlineAgentContext,
} from './config.js';

export type OnlineAgentSendOptions = {
  attachmentIds?: string[][];
  clientId?: string;
  workContext?: ResolvedPageContext;
  overrides?: OnlineAgentOptions;
  selectedModel?: ModelRef;
};
export type OnlineAgentRealtimeOptions = OnlineAgentOptions & {
  sessionId?: string;
  selectedModel?: ModelRef;
  source?: string;
  title?: string;
  showInChatList?: boolean;
};

/** The conversation capability shared by native and Runner execution. */
export interface OnlineAgentRealtimeSession {
  readonly sessionId: string;
  readonly backend: 'native' | 'runner';
  status(): Promise<'running' | 'idle'>;
  history(): Promise<ConversationMessage[]>;
  send(
    messages: ModelMessage[],
    input?: OnlineAgentSendOptions,
  ): Promise<number>;
  receive(): Promise<ReadableStream<OnlineAgentStreamEvent> | null>;
  abort(): Promise<void>;
  retryFinalization(): Promise<void>;
}

export interface OnlineAgentRunnerBackend {
  configuration(
    context: OnlineAgentContext,
    id: string,
  ): Promise<OnlineAgentConfig | null>;
  open(
    context: OnlineAgentContext,
    config: OnlineAgentConfig,
    options: OnlineAgentRealtimeOptions,
    expectedConfig?: OnlineAgentConfig,
  ): Promise<OnlineAgentRealtimeSession>;
  configure(
    context: OnlineAgentContext,
    id: string,
    config: OnlineAgentConfig,
    expectedConfig: OnlineAgentConfig,
  ): Promise<void>;
  shutdown(): Promise<void>;
}

export interface OnlineAgentRealtimeService {
  realtime(
    context: OnlineAgentContext,
    options?: OnlineAgentRealtimeOptions,
    boundary?: 'http',
  ): Promise<OnlineAgentRealtimeSession>;
  configuration(
    context: OnlineAgentContext,
    id: string,
  ): Promise<OnlineAgentConfig & { selectedModel: ModelRef | null }>;
  configure(
    context: OnlineAgentContext,
    id: string,
    options: OnlineAgentOptions,
    selectedModel?: ModelRef,
    boundary?: 'http',
  ): Promise<OnlineAgentConfig & { selectedModel: ModelRef | null }>;
  chatAgents(
    userId: string,
  ): Promise<import('../../shared/conversations.js').ChatAgent[]>;
}

/** Application runtime; native background execution remains a separate capability. */
export interface OnlineAgentRuntime extends OnlineAgentRealtimeService {
  /** Internal server boot hook, before accepting requests. */
  recoverAtStartup(): Promise<void>;
  readonly configurer: import('./config.js').OnlineAgentConfigurer;
  background(
    context: OnlineAgentContext,
    options?: Omit<OnlineAgentRealtimeOptions, 'showInChatList'>,
  ): Promise<import('./service.js').OnlineAgent>;
  shutdown(): Promise<void>;
}
