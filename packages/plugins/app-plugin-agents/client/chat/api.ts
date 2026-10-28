/**
 * The browser API of the chat (`CHAT_ROUTES` in `shared/conversations`), typed with the shared contract. One method per endpoint; answers are unwrapped from `{ data }` (a page of conversations or messages
 * is put back together from `{ data, meta }`); failures throw `ApiClientError`.
 */
import type { OnlineAgentResendOptions } from '../../shared/resend.js';
import { DefaultChatTransport, UI_MESSAGE_STREAM_HEADERS } from 'ai';
import type {
  AppUIMessage,
  AppUIToolApprovalInput,
} from '../../shared/online-agent.js';
import type { UIMessagePage } from './message-model.js';
import { ApiClientError, type ApiClient } from '@nocobase/app-client';

import {
  chatPath,
  type ChatAgent,
  type OnlineChatConfigSnapshot,
  type ChatPreferences,
  type ChatPreferencesPatch,
  type ChatSettings,
  type ChatSettingsPatch,
  type ConversationDetail,
  type ConversationListQuery,
  type ConversationPage,
  type ConversationSummary,
  type ConversationPatch,
  type CreateConversationRequest,
  type MessageAttachment,
  type MessageListQuery,
  type ConversationUsage,
  type PageContext,
} from '../../shared/conversations.js';

import type { ModelService } from '../../shared/models.js';

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

  public configuration(
    id: string,
    signal?: AbortSignal,
  ): Promise<OnlineChatConfigSnapshot> {
    return this.get(chatPath('config', id), undefined, signal);
  }
  public configure(
    id: string,
    config: NonNullable<CreateConversationRequest['config']>,
    selectedModel?: CreateConversationRequest['selectedModel'],
  ): Promise<OnlineChatConfigSnapshot> {
    return this.send(chatPath('config', id), 'PATCH', {
      config,
      selectedModel,
    });
  }
  /** Use the host's authenticated HTTP boundary; framing, parsing and replay remain the SDK's. */
  public transport(
    id: string,
    accepted: (clientId: string) => void,
    resent?: (options: OnlineAgentResendOptions) => Promise<void>,
    reconnecting?: () => (available: boolean) => void,
  ): DefaultChatTransport<AppUIMessage> {
    return new DefaultChatTransport<AppUIMessage>({
      api: chatPath('messages', id),
      prepareSendMessagesRequest: ({ messages, body }) => {
        if (body?.resendInput)
          return {
            api: `${chatPath('conversation', id)}/resend`,
            body: body.resendInput as OnlineAgentResendOptions,
          };
        if (body?.approvalInput)
          return {
            api: `${chatPath('conversation', id)}/approval`,
            body: body.approvalInput as AppUIToolApprovalInput,
          };
        const current = messages.at(-1)!;
        return {
          body: {
            ...body,
            message: {
              id: current.id,
              role: 'user',
              parts: current.parts.filter((part) => part.type === 'text'),
            },
          },
        };
      },
      prepareReconnectToStreamRequest: () => ({ api: chatPath('events', id) }),
      fetch: async (input, init) => {
        const recovered = init?.method === 'GET' ? reconnecting?.() : undefined;
        try {
          const body =
            typeof init?.body === 'string'
              ? (JSON.parse(init.body) as Record<string, unknown>)
              : undefined;
          const stream = await this.api.stream({
            path:
              typeof input === 'string'
                ? input
                : input instanceof URL
                  ? input.toString()
                  : input.url,
            method: init?.method === 'POST' ? 'POST' : 'GET',
            ...(body ? { json: body } : {}),
            ...(init?.signal ? { signal: init.signal } : {}),
          });
          recovered?.(true);
          const path =
            typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.toString()
                : input.url;
          if (init?.method === 'POST' && path.endsWith('/resend')) {
            try {
              await resent?.(body as OnlineAgentResendOptions);
            } catch (error) {
              await stream.cancel().catch(() => {});
              throw error;
            }
          }
          if (
            init?.method === 'POST' &&
            body?.message &&
            typeof body.message === 'object' &&
            'id' in body.message &&
            typeof body.message.id === 'string'
          )
            accepted(body.message.id);
          return new Response(stream, { headers: UI_MESSAGE_STREAM_HEADERS });
        } catch (error) {
          if (error instanceof ApiClientError && error.status === 204) {
            recovered?.(false);
            return new Response(null, { status: 204 });
          }
          throw error;
        }
      },
    });
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
        mode: query.mode,
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
  ): Promise<UIMessagePage> {
    const page = await this.page<AppUIMessage>(chatPath('messages', id), {
      ...query,
    });
    const nextCursor = tokenOf(page.meta.nextPageToken);
    return {
      items: page.data,
      hasMore: nextCursor !== null,
      lastSeq: Number(page.meta.lastSeq ?? 0),
      nextCursor,
      ...(typeof page.meta.nextAfter === 'number'
        ? { nextAfter: page.meta.nextAfter }
        : {}),
    };
  }

  public finalize(id: string): Promise<ConversationDetail> {
    return this.send(`${chatPath('conversation', id)}/finalize`, 'POST', {});
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

  /**
   * One message while the agent works on the conversation: it joins that work (steered into the running turn, or
   * taken as the next one). Answers the saved message, `metadata.queue` `queued` until the agent takes it; refused
   * (`409`) when the agent is not working, when it is sent as usual instead.
   */
  public queue(
    id: string,
    input: {
      readonly clientId: string;
      readonly content: string;
      readonly context?: PageContext;
      readonly attachmentIds?: readonly string[];
    },
  ): Promise<AppUIMessage> {
    return this.send(chatPath('queue', id), 'POST', {
      message: {
        id: input.clientId,
        role: 'user',
        parts: [{ type: 'text', text: input.content }],
      },
      ...(input.context ? { context: input.context } : {}),
      ...(input.attachmentIds?.length
        ? { attachmentIds: input.attachmentIds }
        : {}),
    });
  }

  /** Deletes the conversation for good, with its messages and files. */
  public async deleteConversation(id: string): Promise<void> {
    await this.api.request({
      path: chatPath('conversation', id),
      method: 'DELETE',
    });
  }

  /** Takes back a queued message its runner has not taken (`409` once it has). */
  public async withdraw(id: string, messageId: string): Promise<void> {
    await this.api.request({
      path: `${chatPath('messages', id)}/${encodeURIComponent(messageId)}/withdraw`,
      method: 'POST',
      json: {},
    });
  }

  /** Tokens, context window and cost over the conversation's runs, as far as their tools report them. */
  public usage(id: string, signal?: AbortSignal): Promise<ConversationUsage> {
    return this.get(chatPath('usage', id), undefined, signal);
  }

  /** Requests cancellation. Only execution.status=idle confirms termination and synchronized history. */
  public stop(id: string): Promise<ConversationDetail> {
    return this.send(chatPath('stop', id), 'POST');
  }

  public async agents(): Promise<ChatAgent[]> {
    return (await this.page<ChatAgent>(chatPath('agents'))).data;
  }

  /** The public catalog of enabled chat models, never the service-management resource. */
  public models(signal?: AbortSignal): Promise<ModelService[]> {
    return this.get('agents/models', { kind: 'chat' }, signal);
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

  private page<T>(
    path: string,
    query?: Query,
  ): Promise<{
    readonly data: T[];
    readonly meta: Readonly<Record<string, unknown>>;
  }> {
    return this.read(path, query);
  }

  private async get<T>(
    path: string,
    query?: Query,
    signal?: AbortSignal,
  ): Promise<T> {
    return (await this.read<{ readonly data: T }>(path, query, signal)).data;
  }

  private read<T>(
    path: string,
    query?: Query,
    signal?: AbortSignal,
  ): Promise<T> {
    const values = query ? clean(query) : {};
    return this.api.request<T>({
      path,
      ...(Object.keys(values).length > 0 ? { query: values } : {}),
      ...(signal ? { signal } : {}),
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
