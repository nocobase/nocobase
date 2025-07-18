import { Transaction } from '@nocobase/database';

export interface AiChatConversation extends TransactionSupported<AiChatConversation> {
  getSessionId(): string;
  addMessages(messages: AiMessageInput): Promise<AiMessage>;
  addMessages(messages: AiMessageInput[]): Promise<AiMessage[]>;
  removeMessages(options: AiMessageRemoveOptions): Promise<void>;
  getMessage(messageId: string): Promise<AiMessage | null>;
  listMessages(query?: AiMessageQuery): Promise<AiMessage[]>;
  getChatContext(options?: AiChatContextOptions): Promise<AiChatContext>;
}

export interface TransactionSupported<T> {
  withTransaction<R>(
    runnable: (instance: T, transaction: Transaction) => Promise<R>,
    transaction?: Transaction,
  ): Promise<R>;
}

export type AiChatContext = {
  messages: {
    role: 'user' | 'assistant' | 'tool';
    content: any;
    tool_call_id?: string;
    tool_calls?: AiToolCall[];
  }[];
  tools: any[];
};

export type AiMessage = {
  messageId: string;
  sessionId: string;
  role: string;
  content: AiMessageContent;
  toolCalls?: AiToolCall[];
  attachments?: unknown[];
  workContext?: unknown[];
  metadata?: AiMessageMetadata;
};

export type AiMessageContent = {
  type: string;
  content: unknown;
};

export type AiToolCall = {
  id: string;
  name: string;
  type: string;
  args: unknown;
};

export type AiMessageMetadata = {
  model: string;
  provider: string;
  usage_metadata?: any;
  toolCall?: AiToolCall;
  autoCallTools?: string[];
  autoCall?: boolean;
  interrupted?: boolean;

  [key: string]: unknown;
};

export type AiMessageInput = Omit<AiMessage, 'messageId' | 'sessionId'>;

export type AiMessageQuery = {
  messageId?: string;
};

export type AiMessageRemoveOptions = {
  messageId?: string;
};

export type AiChatContextOptions = {
  systemPrompt?: string;
  tools?: any[];
} & AiMessageQuery;
