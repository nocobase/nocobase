import type { ApiClient } from '@nocobase/app-client';
import { requestAIAction } from './api-client.js';
import { toAIChatHistoryMessages } from '../registry/nocobase-ai/services/nocobase-ai-service.js';
import type { AIChatMessage } from '../registry/nocobase-ai/providers/types.js';

export interface ManagedConversation {
  sessionId: string;
  title?: string;
  userId?: string;
  scope?: string;
  aiEmployeeUsername?: string;
  category?: string;
  from?: string;
  updatedAt?: string;
}

export interface ConversationCenterPage {
  rows: ManagedConversation[];
  count: number;
  page: number;
  pageSize: number;
}

export interface ConversationHistoryPage {
  messages: AIChatMessage[];
  hasMore: boolean;
  cursor?: string | null;
}

export function listManagedConversations(
  api: ApiClient,
  options: { keyword: string; page: number; signal?: AbortSignal },
): Promise<ConversationCenterPage> {
  return requestAIAction(api, 'aiConversations', 'listAll', {
    query: { keyword: options.keyword, page: options.page, pageSize: 30 },
    signal: options.signal,
  });
}

export async function getManagedConversationMessages(
  api: ApiClient,
  sessionId: string,
  options: { cursor?: string; signal?: AbortSignal } = {},
): Promise<ConversationHistoryPage> {
  const result = await requestAIAction<{
    rows: unknown[];
    hasMore?: boolean;
    cursor?: string | null;
  }>(api, 'aiConversations', 'getAllMessages', {
    query: { sessionId, cursor: options.cursor },
    signal: options.signal,
  });
  return {
    messages: toAIChatHistoryMessages(result.rows),
    hasMore: result.hasMore === true,
    cursor: result.cursor,
  };
}
