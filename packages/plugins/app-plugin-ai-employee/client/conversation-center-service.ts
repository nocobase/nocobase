import type { ApiClient } from '@nocobase/app-client';
import {
  aiPath,
  requestAI,
  requestAIList,
  type AIRequestQuery,
} from './api-client.js';
import { toAIChatHistoryMessages } from '../registry/nocobase-ai/services/nocobase-ai-service.js';
import type { AIChatMessage } from '../registry/nocobase-ai/providers/types.js';

/** The number of conversations the conversation center shows on each page. */
export const CONVERSATION_CENTER_PAGE_SIZE = 30;

export interface ConversationUser {
  id: string;
  name: string | null;
  username: string | null;
}

export interface ConversationEmployee {
  username: string;
  nickname: string | null;
  avatar: string | null;
}

export interface ManagedConversation {
  sessionId: string;
  title?: string;
  userId?: string;
  scope?: string;
  aiEmployeeUsername?: string;
  category?: string;
  from?: string;
  updatedAt?: string;
  /** `null` when the user no longer exists. */
  user?: ConversationUser | null;
  /** `null` when the employee no longer exists. */
  aiEmployee?: ConversationEmployee | null;
}

export interface ConversationCenterPage {
  rows: ManagedConversation[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ConversationHistoryPage {
  messages: AIChatMessage[];
  hasMore: boolean;
  cursor?: string | null;
}

export interface ManagedConversationFilters {
  /** Matches part of the title. */
  keyword?: string;
  userId?: string;
  aiEmployeeUsername?: string;
}

export async function listManagedConversations(
  api: ApiClient,
  options: ManagedConversationFilters & {
    page: number;
    pageSize?: number;
    signal?: AbortSignal;
  },
): Promise<ConversationCenterPage> {
  const pageSize = options.pageSize ?? CONVERSATION_CENTER_PAGE_SIZE;
  const { data, meta } = await requestAIList<ManagedConversation>(
    api,
    aiPath('aiEmployee', 'managedConversations'),
    {
      query: withoutEmpty({
        q: options.keyword,
        userId: options.userId,
        aiEmployeeUsername: options.aiEmployeeUsername,
        page: options.page,
        pageSize,
      }),
      signal: options.signal,
    },
  );
  const count = meta?.total ?? data.length;
  const size = meta?.pageSize ?? pageSize;
  return {
    rows: data,
    count,
    page: meta?.page ?? options.page,
    pageSize: size,
    totalPages: Math.ceil(count / size),
  };
}

/** Users who own a conversation, matched by part of their name or username, or the one user `userId` names. */
export function listConversationUsers(
  api: ApiClient,
  options: { keyword?: string; userId?: string; signal?: AbortSignal } = {},
): Promise<ConversationUser[]> {
  return requestAI<ConversationUser[]>(
    api,
    aiPath('aiEmployee', 'conversationOwners'),
    {
      // The first page of matches: the picker narrows by typing rather than paging further.
      query: withoutEmpty({ q: options.keyword, userId: options.userId }),
      signal: options.signal,
    },
  );
}

/**
 * Every employee a conversation can name, deprecated ones included, from the employee list the AI employee settings
 * page reads. A conversation outlives the employee's deprecation, so the filter has to offer it too.
 */
export async function listConversationEmployees(
  api: ApiClient,
  signal?: AbortSignal,
): Promise<ConversationEmployee[]> {
  const employees = await requestAI<Array<Partial<ConversationEmployee>>>(
    api,
    aiPath('aiEmployees'),
    { signal },
  );
  return employees
    .filter(
      (
        employee,
      ): employee is Partial<ConversationEmployee> & {
        username: string;
      } => typeof employee.username === 'string',
    )
    .map((employee) => ({
      username: employee.username,
      nickname: employee.nickname ?? null,
      avatar: employee.avatar ?? null,
    }));
}

export async function getManagedConversationMessages(
  api: ApiClient,
  sessionId: string,
  options: { cursor?: string; signal?: AbortSignal } = {},
): Promise<ConversationHistoryPage> {
  const { data, meta } = await requestAIList<unknown>(
    api,
    aiPath('aiEmployee', 'managedConversations', sessionId, 'messages'),
    { query: { pageToken: options.cursor }, signal: options.signal },
  );
  return {
    messages: toAIChatHistoryMessages(data),
    hasMore: Boolean(meta?.nextPageToken),
    cursor: meta?.nextPageToken ?? null,
  };
}

function withoutEmpty(
  query: Record<string, string | number | undefined>,
): AIRequestQuery {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  );
}
