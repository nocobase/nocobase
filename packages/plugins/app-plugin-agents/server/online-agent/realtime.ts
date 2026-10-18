import type { ModelMessage } from 'ai';
import type { ResolvedPageContext } from '../../shared/conversations.js';
import type { ModelRef } from '../../shared/models.js';
import type { AppUIMessage } from '../../shared/online-agent.js';
import type { NativeUIChunk } from './native.js';
import type { NativeApproval } from './native-store.js';
import type { NativeHistoryQuery, NativeHistoryPage } from './native-store.js';
import type {
  OnlineAgentOptions,
  OnlineAgentConfig,
  OnlineAgentContext,
} from './config.js';

export type OnlineAgentSendOptions = {
  attachmentIds?: string[][];
  clientId?: string;
  messageId?: string;
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
  history(): Promise<AppUIMessage[]>;
  approve?(input: NativeApproval): Promise<number>;
  messages(query: NativeHistoryQuery): Promise<NativeHistoryPage>;
  send(
    messages: ModelMessage[],
    input?: OnlineAgentSendOptions,
  ): Promise<number>;
  receive(): Promise<ReadableStream<NativeUIChunk> | null>;
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
