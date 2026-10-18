import type { ResolvedPageContext } from '../../shared/conversations.js';
import type { ModelRef } from '../../shared/models.js';
import type { OnlineAgentOptions } from './config.js';
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
