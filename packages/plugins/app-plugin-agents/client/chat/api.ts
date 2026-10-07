/**
 * The browser API of the chat (`CHAT_ROUTES` in `shared/conversations`) and of the agent presets, typed with the
 * shared contract. One method per endpoint; answers are unwrapped from `{ data }` (a page of conversations or messages
 * is put back together from `{ data, meta }`); failures throw `ApiClientError`.
 */
import type { ApiClient } from '@nocobase/app-client';

import type { Agent } from '../../shared/agents.js';
import {
  chatPath,
  type ChatAgent,
  type ChatPreferences,
  type ChatPreferencesPatch,
  type ChatSettings,
  type ChatSettingsPatch,
  type ConversationDetail,
  type ConversationListQuery,
  type ConversationMessage,
  type ConversationPage,
  type ConversationSummary,
  type ConversationPatch,
  type CopyAgentRequest,
  type CreateConversationRequest,
  type MessageAttachment,
  type MessageListQuery,
  type MessagePage,
  type SendMessageRequest,
  type SendMessageResult,
} from '../../shared/conversations.js';
import { PRESETS_ROUTE, type AgentPreset } from '../../shared/presets.js';

type Query = Readonly<Record<string, string | number | boolean | undefined>>;

function tokenOf(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function clean(query: Query): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(query).filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== undefined && entry[1] !== '',
    ),
  );
}

export class ChatApi {
  private readonly api: ApiClient;

  public constructor(api: ApiClient) {
    this.api = api;
  }

  public async conversations(
    query: ConversationListQuery = {},
  ): Promise<ConversationPage> {
    const page = await this.page<ConversationSummary>(
      chatPath('conversations'),
      {
        q: query.q,
        archived:
          query.archived === undefined ? undefined : String(query.archived),
        agentId: query.agentId,
        source: query.source,
        pageToken: query.pageToken,
        pageSize: query.pageSize,
      },
    );
    return {
      items: page.data,
      nextCursor: tokenOf(page.meta.nextPageToken),
    };
  }

  public createConversation(
    request: CreateConversationRequest,
  ): Promise<ConversationDetail> {
    return this.send(chatPath('conversations'), 'POST', request);
  }

  public conversation(id: string): Promise<ConversationDetail> {
    return this.get(chatPath('conversation', id));
  }

  public updateConversation(
    id: string,
    patch: ConversationPatch,
  ): Promise<ConversationDetail> {
    return this.send(chatPath('conversation', id), 'PATCH', patch);
  }

  /** A page of messages; `nextCursor` asks for the older ones. */
  public async messages(
    id: string,
    query: MessageListQuery = {},
  ): Promise<MessagePage & { readonly nextCursor: string | null }> {
    const page = await this.page<ConversationMessage>(
      chatPath('messages', id),
      { ...query },
    );
    const nextCursor = tokenOf(page.meta.nextPageToken);
    return {
      items: page.data,
      hasMore: nextCursor !== null,
      lastSeq: Number(page.meta.lastSeq ?? 0),
      nextCursor,
    };
  }

  public sendMessage(
    id: string,
    request: SendMessageRequest,
  ): Promise<SendMessageResult> {
    return this.send(chatPath('messages', id), 'POST', request);
  }

  /** Uploads a file to send with a message; it is the caller's alone until sent (`attachmentIds`). */
  public async uploadAttachment(
    file: File,
    signal?: AbortSignal,
  ): Promise<MessageAttachment> {
    const form = new FormData();
    form.set('file', file);
    const { data } = await this.api.request<{
      readonly data: MessageAttachment;
    }>({
      path: chatPath('attachments'),
      method: 'POST',
      body: form,
      ...(signal ? { signal } : {}),
    });
    return data;
  }

  /** Discards an upload not sent yet. */
  public async discardAttachment(id: string): Promise<void> {
    await this.api.request({
      path: chatPath('attachment', id),
      method: 'DELETE',
    });
  }

  public markRead(id: string): Promise<ConversationDetail> {
    return this.send(chatPath('markRead', id), 'POST');
  }

  public stop(id: string): Promise<ConversationDetail> {
    return this.send(chatPath('stop', id), 'POST');
  }

  public fallback(id: string): Promise<ConversationDetail> {
    return this.send(chatPath('fallback', id), 'POST');
  }

  public restore(id: string): Promise<ConversationDetail> {
    return this.send(chatPath('restore', id), 'POST');
  }

  public async agents(): Promise<ChatAgent[]> {
    return (await this.page<ChatAgent>(chatPath('agents'))).data;
  }

  public copyAgent(agentId: string, request: CopyAgentRequest): Promise<Agent> {
    return this.send(chatPath('copyAgent', agentId), 'POST', request);
  }

  public preferences(): Promise<ChatPreferences> {
    return this.get(chatPath('preferences'));
  }

  public updatePreferences(
    patch: ChatPreferencesPatch,
  ): Promise<ChatPreferences> {
    return this.send(chatPath('preferences'), 'PATCH', patch);
  }

  public settings(): Promise<ChatSettings> {
    return this.get(chatPath('settings'));
  }

  public updateSettings(patch: ChatSettingsPatch): Promise<ChatSettings> {
    return this.send(chatPath('settings'), 'PATCH', patch);
  }

  public async presets(): Promise<AgentPreset[]> {
    return (await this.page<AgentPreset>(PRESETS_ROUTE)).data;
  }

  private page<T>(
    path: string,
    query?: Query,
  ): Promise<{
    readonly data: T[];
    readonly meta: Readonly<Record<string, unknown>>;
  }> {
    return this.read(path, query);
  }

  private async get<T>(path: string, query?: Query): Promise<T> {
    return (await this.read<{ readonly data: T }>(path, query)).data;
  }

  private read<T>(path: string, query?: Query): Promise<T> {
    const values = query ? clean(query) : {};
    return this.api.request<T>({
      path,
      ...(Object.keys(values).length > 0 ? { query: values } : {}),
    });
  }

  private async send<T>(
    path: string,
    method: 'POST' | 'PATCH' | 'PUT',
    json?: unknown,
  ): Promise<T> {
    const { data } = await this.api.request<{ readonly data: T }>({
      path,
      method,
      ...(json === undefined ? {} : { json }),
    });
    return data;
  }
}
