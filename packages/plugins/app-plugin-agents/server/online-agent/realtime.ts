import type { RealtimeOnlineAgent } from './agent.js';
import type { ResolvedPageContext } from '../../shared/conversations.js';
import type { ModelRef } from '../../shared/models.js';
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
  ): Promise<RealtimeOnlineAgent>;
  configure(
    context: OnlineAgentContext,
    id: string,
    config: OnlineAgentConfig,
    expectedConfig: OnlineAgentConfig,
  ): Promise<void>;
  shutdown(): Promise<void>;
}
