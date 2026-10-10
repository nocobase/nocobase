/**
 * What the home page reads and sends, through the agents plugin's API (`CHAT_ROUTES`, `agents/models`,
 * `agents/dist/downloadTokens`): the agents the person may talk to, their recent conversations, whether any model
 * service offers a model, starting a conversation with its first message (its files and model), and a download token for the CLI install
 * prompt. Failures throw `ApiClientError`.
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
import type { OnlineModelEntry } from '@nocobase/app-plugin-agents/shared/agents';
import {
  chatPath,
  type ChatAgent,
  type ConversationDetail,
  type ConversationPage,
  type MessageAttachment,
  type SendMessageResult,
} from '@nocobase/app-plugin-agents/shared/conversations';
import type { ModelCatalog } from '@nocobase/app-plugin-agents/shared/models';
import type { DownloadToken } from '@nocobase/app-plugin-agents/shared/runners';
import { useMemo } from 'react';

/** The first message of a conversation started from the home page. */
export interface HomeStartInput {
  readonly content: string;
  readonly attachments: readonly MessageAttachment[];
  /** The entry of the online agent's `models` it answers with; null for its default. */
  readonly model: OnlineModelEntry | null;
}

/** Recent conversations listed under the composer. */
export const RECENT_LIMIT = 6;

export const homeKeys = {
  agents: ['studio', 'home', 'agents'] as const,
  recent: ['studio', 'home', 'recent'] as const,
  models: ['studio', 'home', 'models'] as const,
};

export class HomeApi {
  public constructor(private readonly api: ApiClient) {}

  public async agents(): Promise<ChatAgent[]> {
    const { data } = await this.api.request<{
      readonly data: ChatAgent[];
    }>({ path: chatPath('agents') });
    return data;
  }

  public async recent(): Promise<ConversationPage> {
    const { data, meta } = await this.api.request<{
      readonly data: ConversationPage['items'];
      readonly meta: { readonly nextPageToken?: string };
    }>({
      path: chatPath('conversations'),
      query: { pageSize: RECENT_LIMIT },
    });
    return { items: data, nextCursor: meta.nextPageToken ?? null };
  }

  public async models(): Promise<ModelCatalog> {
    const { data } = await this.api.request<{
      readonly data: ModelCatalog['services'];
    }>({ path: 'agents/models' });
    return { services: data };
  }

  /** A short-lived token that lets the install script download the nb-studio CLI. */
  public async downloadToken(): Promise<DownloadToken> {
    const { data } = await this.api.request<{ readonly data: DownloadToken }>({
      path: 'agents/dist/downloadTokens',
      method: 'POST',
    });
    return data;
  }

  /**
   * A new conversation with `agentId` (whose type is its mode for good), answering with `model` when an online agent
   * lists several, and its first message with the files uploaded for it (`useChatAttachments`).
   */
  public async start(
    agentId: string,
    { content, attachments, model }: HomeStartInput,
  ): Promise<SendMessageResult> {
    const { data: conversation } = await this.api.request<{
      readonly data: ConversationDetail;
    }>({
      path: chatPath('conversations'),
      method: 'POST',
      json: { agentId, ...(model ? { model } : {}) },
    });
    const { data } = await this.api.request<{
      readonly data: SendMessageResult;
    }>({
      path: chatPath('messages', conversation.id),
      method: 'POST',
      json: {
        content,
        ...(attachments.length > 0
          ? { attachmentIds: attachments.map((file) => file.id) }
          : {}),
      },
    });
    return data;
  }
}

export function useHomeApi(): HomeApi {
  const api = useApiClient();
  return useMemo(() => new HomeApi(api), [api]);
}
