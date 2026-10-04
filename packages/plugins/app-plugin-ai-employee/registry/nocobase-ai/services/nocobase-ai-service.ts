import {
  resolveAppUrl,
  type ApiClient,
  type ApiRequestOptions,
} from '@nocobase/app-client';
import type {
  AIChatMessage,
  AIConversation,
  AIEmployee,
  AIModel,
} from '../providers/types.js';
import type { AIService, CreateAIConversationOptions } from './types.js';
import type { UpdateToolCallDecisionOptions } from './types.js';
import {
  getToolCallState,
  getToolProviderMetadata,
  type NocoBaseToolCall,
} from '../providers/stream-event-utils.js';
import { toText } from '../shared/text.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const parseToolInput = (value: unknown) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const toAttachment = (
  value: unknown,
  index: number,
  resolveUrl: (value: string) => string,
) => {
  if (!isRecord(value)) return undefined;
  const filename = value.filename ?? value.name ?? value.title;
  if (typeof filename !== 'string') return undefined;
  return {
    ...value,
    uid: toText(value.id ?? value.uid, `${filename}-${index}`),
    filename,
    status: 'done' as const,
    size: typeof value.size === 'number' ? value.size : undefined,
    mimetype:
      typeof value.mimetype === 'string'
        ? value.mimetype
        : typeof value.type === 'string'
          ? value.type
          : undefined,
    url: typeof value.url === 'string' ? resolveUrl(value.url) : undefined,
    preview:
      typeof value.preview === 'string' ? resolveUrl(value.preview) : undefined,
  };
};

const toHistoryMessage = (
  value: unknown,
  index: number,
  resolveUrl: (value: string) => string,
): AIChatMessage => {
  const message = isRecord(value) ? value : {};
  const content = isRecord(message.content) ? message.content : {};
  const rawServerMessageId = content.messageId ?? message.messageId;
  const serverMessageId =
    typeof rawServerMessageId === 'number' ||
    (typeof rawServerMessageId === 'string' && /^\d+$/.test(rawServerMessageId))
      ? String(rawServerMessageId)
      : undefined;
  const messageId = serverMessageId ?? toText(message.key, `history-${index}`);
  const text =
    typeof content.content === 'string'
      ? content.content
      : typeof message.content === 'string'
        ? message.content
        : '';
  const attachments = Array.isArray(content.attachments)
    ? content.attachments
        .map((attachment, attachmentIndex) =>
          toAttachment(attachment, attachmentIndex, resolveUrl),
        )
        .filter((attachment) => attachment !== undefined)
    : [];
  const parts: AIChatMessage['parts'] = [];
  const reasoning = isRecord(content.reasoning) ? content.reasoning : undefined;
  if (typeof reasoning?.content === 'string' && reasoning.content) {
    parts.push({ type: 'reasoning', text: reasoning.content, state: 'done' });
  }
  if (text) parts.push({ type: 'text', text, state: 'done' });
  const toolCalls = Array.isArray(content.tool_calls)
    ? content.tool_calls
    : Array.isArray(message.toolCalls)
      ? message.toolCalls
      : [];
  for (const rawToolCall of toolCalls) {
    if (!isRecord(rawToolCall)) continue;
    const toolCallId = toText(rawToolCall.id, `tool-${crypto.randomUUID()}`);
    const toolName = toText(rawToolCall.name, 'tool');
    const toolCall = rawToolCall as NocoBaseToolCall;
    const { failed, completed } = getToolCallState(toolCall);
    const callProviderMetadata = getToolProviderMetadata(toolCall);
    parts.push(
      failed
        ? {
            type: 'dynamic-tool',
            toolCallId,
            toolName,
            state: 'output-error',
            input: parseToolInput(rawToolCall.args ?? {}),
            errorText: toText(rawToolCall.content, 'Tool call failed'),
            callProviderMetadata,
          }
        : completed
          ? {
              type: 'dynamic-tool',
              toolCallId,
              toolName,
              state: 'output-available',
              input: parseToolInput(rawToolCall.args ?? {}),
              output: rawToolCall.content,
              callProviderMetadata,
            }
          : {
              type: 'dynamic-tool',
              toolCallId,
              toolName,
              state: 'input-available',
              input: parseToolInput(rawToolCall.args ?? {}),
              callProviderMetadata,
            },
    );
  }
  const subAgentConversations = Array.isArray(content.subAgentConversations)
    ? content.subAgentConversations
    : [];
  for (const [
    conversationIndex,
    rawConversation,
  ] of subAgentConversations.entries()) {
    if (!isRecord(rawConversation)) continue;
    const rawMessages = Array.isArray(rawConversation.messages)
      ? rawConversation.messages
      : [];
    const messages = rawMessages.map((item, messageIndex) =>
      toHistoryMessage(item, messageIndex, resolveUrl),
    );
    const username =
      typeof rawConversation.username === 'string'
        ? rawConversation.username
        : (messages.find((item) => item.metadata?.employeeUsername)?.metadata
            ?.employeeUsername ?? 'sub-agent');
    const sessionId = toText(
      rawConversation.sessionId,
      `sub-agent-history-${index}-${conversationIndex}`,
    );
    parts.push({
      type: 'data-subAgent',
      id: sessionId,
      data: {
        sessionId,
        username,
        status:
          rawConversation.status === 'completed' ? 'completed' : 'pending',
        messages,
      },
    });
  }
  for (const attachment of attachments) {
    if (!attachment.url && !attachment.preview) continue;
    parts.push({
      type: 'file',
      mediaType: attachment.mimetype ?? 'application/octet-stream',
      filename: attachment.filename,
      url: attachment.url ?? attachment.preview ?? '',
    });
  }
  const rawRole = toText(message.role, 'assistant');
  const role =
    rawRole === 'user' || rawRole === 'system' ? rawRole : 'assistant';
  return {
    id: messageId,
    role,
    metadata: {
      ...(serverMessageId ? { serverMessageId } : {}),
      ...(rawRole !== 'user' && rawRole !== 'system'
        ? { employeeUsername: rawRole }
        : {}),
      createdAt:
        typeof message.createdAt === 'string' ? message.createdAt : undefined,
      attachments,
      workContext: Array.isArray(content.workContext)
        ? content.workContext
        : undefined,
    },
    parts,
  };
};

type AIRequestOptions = {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly query?: Readonly<
    Record<string, string | number | boolean | null | undefined>
  >;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
};

/**
 * The path of an AI route under `/api`, each segment encoded. The employees are under `aiEmployees`; conversations,
 * files and models under `aiEmployee`.
 */
function aiPath(...segments: readonly string[]): string {
  return segments.map((segment) => encodeURIComponent(segment)).join('/');
}

function createRequestOptions(
  path: string,
  options: AIRequestOptions,
): ApiRequestOptions {
  const method =
    options.method ?? (options.body === undefined ? 'GET' : 'POST');
  const body = options.body;
  return {
    path,
    method,
    ...(options.query === undefined ? {} : { query: options.query }),
    ...(typeof FormData !== 'undefined' && body instanceof FormData
      ? { body }
      : body === undefined
        ? {}
        : { json: body }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  };
}

function resolveResourceUrl(value: string): string {
  if (!value || /^[a-z][a-z\d+.-]*:/i.test(value)) return value;
  return resolveAppUrl(value.replace(/^\/+/, ''));
}

/** Convert a newest-first server history page using the shared chat protocol. */
export function toAIChatHistoryMessages(
  rows: readonly unknown[],
): AIChatMessage[] {
  return [...rows]
    .reverse()
    .filter(
      (value) =>
        !isRecord(value) || (value.role !== 'tool' && value.role !== 'system'),
    )
    .map((value, index) => toHistoryMessage(value, index, resolveResourceUrl));
}

/** The body of a run request: everything but the conversation, which the path names. */
type RunBody = { readonly sessionId?: unknown } & Record<string, unknown>;

function runRequest(body: unknown): {
  sessionId: string;
  body: Record<string, unknown>;
} {
  const { sessionId, ...rest } = (isRecord(body) ? body : {}) as RunBody;
  if (typeof sessionId !== 'string' || !sessionId)
    throw new Error('A conversation is required to run a request.');
  return { sessionId, body: rest };
}

export class NocoBaseAIService implements AIService {
  constructor(private readonly client: ApiClient) {}

  /** Calls an AI route and returns its `data`. */
  private async aiRequest<T>(
    path: string,
    options: AIRequestOptions = {},
  ): Promise<T> {
    const payload = await this.client.request<{ data: T } | undefined>(
      createRequestOptions(path, options),
    );
    return payload?.data as T;
  }

  private aiStream(
    path: string,
    options: AIRequestOptions = {},
  ): Promise<ReadableStream<Uint8Array>> {
    return this.client.stream(createRequestOptions(path, options));
  }

  private runStream(
    verb: 'send' | 'resend' | 'resumeToolCall',
    body: unknown,
    signal?: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>> {
    const request = runRequest(body);
    return this.aiStream(
      aiPath('aiEmployee', 'conversations', request.sessionId, verb),
      { method: 'POST', body: request.body, signal },
    );
  }

  async listEmployees() {
    const employees = await this.aiRequest<AIEmployee[]>(
      aiPath('aiEmployees', 'roster'),
    );
    return employees
      .filter((employee) => employee?.username)
      .map((employee) => ({
        ...employee,
        nickname: employee.nickname ?? employee.username,
        description: employee.description ?? employee.bio,
      }));
  }

  async listModels() {
    const services = await this.aiRequest<
      Array<{
        llmService: string;
        llmServiceTitle: string;
        enabledModels?: Array<{ label: string; value: string }>;
        supportWebSearch?: boolean;
        webSearchModels?: string[];
        isToolConflict?: boolean;
      }>
    >(aiPath('aiEmployee', 'models'));
    return services.flatMap((service) =>
      (service.enabledModels ?? []).map<AIModel>((model) => ({
        value: model.value,
        label: model.label,
        llmService: service.llmService,
        llmServiceTitle: service.llmServiceTitle,
        supportWebSearch:
          service.supportWebSearch === true &&
          (!service.webSearchModels?.length ||
            service.webSearchModels.includes(model.value)),
        isToolConflict: service.isToolConflict,
      })),
    );
  }

  async updateEmployeeUserPrompt(username: string, prompt: string) {
    await this.aiRequest(aiPath('aiEmployees', username, 'userPrompt'), {
      method: 'PUT',
      body: { prompt },
    });
  }

  async listConversations(keyword = '') {
    const normalizedKeyword = keyword.trim();
    const rows = await this.aiRequest<unknown[]>(
      aiPath('aiEmployee', 'conversations'),
      { query: { q: normalizedKeyword || undefined } },
    );
    return (Array.isArray(rows) ? rows : []).flatMap<AIConversation>(
      (value) => {
        if (!isRecord(value) || typeof value.sessionId !== 'string') return [];
        const employee = isRecord(value.aiEmployee)
          ? value.aiEmployee
          : undefined;
        const options = isRecord(value.options) ? value.options : undefined;
        const modelSettings = isRecord(options?.modelSettings)
          ? options.modelSettings
          : undefined;
        return [
          {
            id: value.sessionId,
            title:
              typeof value.title === 'string' && value.title
                ? value.title
                : 'New conversation',
            employeeUsername: toText(
              employee?.username ?? value.aiEmployeeUsername,
              '',
            ),
            updatedAt:
              typeof value.updatedAt === 'string'
                ? value.updatedAt
                : new Date().toISOString(),
            unread: value.read === false,
            model:
              typeof modelSettings?.model === 'string'
                ? {
                    llmService:
                      typeof modelSettings.llmService === 'string'
                        ? modelSettings.llmService
                        : undefined,
                    model: modelSettings.model,
                  }
                : undefined,
          },
        ];
      },
    );
  }

  async getConversationMessages(
    sessionId: string,
    options: { updateRead?: boolean } = {},
  ) {
    // The chat shows a conversation's recent history at once: one page of the largest size the route allows.
    const rows = await this.aiRequest<unknown[]>(
      aiPath('aiEmployee', 'conversations', sessionId, 'messages'),
      { query: { pageSize: 200 } },
    );
    if (options.updateRead === true) {
      await this.aiRequest(
        aiPath('aiEmployee', 'conversations', sessionId, 'markRead'),
        { method: 'POST' },
      );
    }
    return toAIChatHistoryMessages(Array.isArray(rows) ? rows : []);
  }

  async getConversationActiveState(sessionId: string) {
    const conversation = await this.aiRequest<{
      llmActiveState?: unknown;
    }>(aiPath('aiEmployee', 'conversations', sessionId));
    const state = conversation?.llmActiveState;
    return state === 'idle' || state === 'streaming' || state === 'invoking'
      ? state
      : undefined;
  }

  async updateConversationTitle(sessionId: string, title: string) {
    await this.aiRequest(aiPath('aiEmployee', 'conversations', sessionId), {
      method: 'PATCH',
      body: { title },
    });
  }

  async destroyConversation(sessionId: string) {
    await this.aiRequest(aiPath('aiEmployee', 'conversations', sessionId), {
      method: 'DELETE',
    });
  }

  async uploadFile(file: File, signal?: AbortSignal) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.aiRequest<Record<string, unknown>>(
      aiPath('aiEmployee', 'files'),
      { body: formData, signal },
    );
    return {
      ...response,
      ...(typeof response.url === 'string'
        ? { url: resolveResourceUrl(response.url) }
        : {}),
      ...(typeof response.preview === 'string'
        ? { preview: resolveResourceUrl(response.preview) }
        : {}),
    };
  }

  async createConversation(options: CreateAIConversationOptions) {
    const conversation = await this.aiRequest<{ sessionId: string }>(
      aiPath('aiEmployee', 'conversations'),
      {
        method: 'POST',
        body: {
          aiEmployee: { username: options.employee.username },
          systemMessage: options.systemMessage,
          skillSettings: options.skillSettings,
          modelSettings: {
            llmService: options.model.llmService,
            model: options.model.value,
          },
        },
      },
    );
    return conversation.sessionId;
  }

  sendMessagesStream(body: unknown, signal?: AbortSignal) {
    return this.runStream('send', body, signal);
  }

  resendMessagesStream(body: unknown, signal?: AbortSignal) {
    return this.runStream('resend', body, signal);
  }

  async updateToolCallDecision(options: UpdateToolCallDecisionOptions) {
    const result = await this.aiRequest<{
      updated: number;
      toolCalls: Array<{
        id: string;
        name: string;
        invokeStatus?: string;
        status?: string;
        auto?: boolean;
        execution?: string;
        willInterrupt?: boolean;
        args?: unknown;
      }>;
    }>(
      aiPath(
        'aiEmployee',
        'conversations',
        options.sessionId,
        'messages',
        options.messageId,
        'toolCalls',
        options.toolCallId,
        'userDecision',
      ),
      { method: 'PUT', body: options.userDecision },
    );
    return {
      ...result,
      toolCalls: result.toolCalls.map((toolCall) => ({
        ...toolCall,
        args: parseToolInput(toolCall.args),
      })),
    };
  }

  resumeToolCallStream(body: unknown, signal?: AbortSignal) {
    return this.runStream('resumeToolCall', body, signal);
  }

  resumeConversationStream(sessionId: string, signal?: AbortSignal) {
    return this.aiStream(
      aiPath('aiEmployee', 'conversations', sessionId, 'resumeStream'),
      { method: 'POST', signal },
    );
  }
}
