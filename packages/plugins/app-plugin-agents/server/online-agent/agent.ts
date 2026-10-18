import type { JSONSchema7, ModelMessage } from 'ai';
import type { AppUIMessage } from '../../shared/online-agent.js';
import type { ModelRef } from '../../shared/models.js';
import type { OnlineAgentOptions } from './config.js';
import type {
  NativeApproval,
  NativeHistoryPage,
  NativeHistoryQuery,
} from './native-store.js';
import type { NativeUIChunk } from './native.js';
import type { OnlineAgentSendOptions } from './realtime.js';
import type { OnlineAgentJson } from './codec.js';
import type { OnlineAgentResult } from './service.js';

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
  receive(): Promise<ReadableStream<NativeUIChunk> | null>;
  approve?(input: NativeApproval): Promise<number>;
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
