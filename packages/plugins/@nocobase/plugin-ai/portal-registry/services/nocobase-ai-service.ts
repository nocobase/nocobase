import { nocobaseClient, type NocoBaseClient } from "@/lib/nocobase/client";
import type {
  AIChatMessage,
  AIConversation,
  AIEmployee,
  AIModel,
} from "../providers/types";
import type {
  AIConversationActiveState,
  AIService,
  CreateAIConversationOptions,
} from "./types";
import type { UpdateToolCallDecisionOptions } from "./types";
import {
  getToolCallState,
  getToolProviderMetadata,
  type NocoBaseToolCall,
} from "../providers/stream-event-utils";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const parseToolInput = (value: unknown) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const toAttachment = (
  value: unknown,
  index: number,
  resolveUrl: (value: string) => string
) => {
  if (!isRecord(value)) return undefined;
  const filename = value.filename ?? value.name ?? value.title;
  if (typeof filename !== "string") return undefined;
  return {
    ...value,
    uid: String(value.id ?? value.uid ?? `${filename}-${index}`),
    filename,
    status: "done" as const,
    size: typeof value.size === "number" ? value.size : undefined,
    mimetype:
      typeof value.mimetype === "string"
        ? value.mimetype
        : typeof value.type === "string"
        ? value.type
        : undefined,
    url: typeof value.url === "string" ? resolveUrl(value.url) : undefined,
    preview:
      typeof value.preview === "string" ? resolveUrl(value.preview) : undefined,
  };
};

const toHistoryMessage = (
  value: unknown,
  index: number,
  resolveUrl: (value: string) => string
): AIChatMessage => {
  const message = isRecord(value) ? value : {};
  const content = isRecord(message.content) ? message.content : {};
  const rawServerMessageId = content.messageId ?? message.messageId;
  const serverMessageId =
    typeof rawServerMessageId === "number" ||
    (typeof rawServerMessageId === "string" && /^\d+$/.test(rawServerMessageId))
      ? String(rawServerMessageId)
      : undefined;
  const messageId =
    serverMessageId ?? String(message.key ?? `history-${index}`);
  const text =
    typeof content.content === "string"
      ? content.content
      : typeof message.content === "string"
      ? message.content
      : "";
  const attachments = Array.isArray(content.attachments)
    ? content.attachments
        .map((attachment, attachmentIndex) =>
          toAttachment(attachment, attachmentIndex, resolveUrl)
        )
        .filter((attachment) => attachment !== undefined)
    : [];
  const parts: AIChatMessage["parts"] = [];
  const reasoning = isRecord(content.reasoning) ? content.reasoning : undefined;
  if (typeof reasoning?.content === "string" && reasoning.content) {
    parts.push({ type: "reasoning", text: reasoning.content, state: "done" });
  }
  if (text) parts.push({ type: "text", text, state: "done" });
  const toolCalls = Array.isArray(content.tool_calls)
    ? content.tool_calls
    : Array.isArray(message.toolCalls)
    ? message.toolCalls
    : [];
  for (const rawToolCall of toolCalls) {
    if (!isRecord(rawToolCall)) continue;
    const toolCallId = String(rawToolCall.id ?? `tool-${crypto.randomUUID()}`);
    const toolName = String(rawToolCall.name ?? "tool");
    const toolCall = rawToolCall as NocoBaseToolCall;
    const { failed, completed } = getToolCallState(toolCall);
    const callProviderMetadata = getToolProviderMetadata(toolCall);
    parts.push(
      failed
        ? {
            type: "dynamic-tool",
            toolCallId,
            toolName,
            state: "output-error",
            input: parseToolInput(rawToolCall.args ?? {}),
            errorText: String(rawToolCall.content ?? "Tool call failed"),
            callProviderMetadata,
          }
        : completed
        ? {
            type: "dynamic-tool",
            toolCallId,
            toolName,
            state: "output-available",
            input: parseToolInput(rawToolCall.args ?? {}),
            output: rawToolCall.content,
            callProviderMetadata,
          }
        : {
            type: "dynamic-tool",
            toolCallId,
            toolName,
            state: "input-available",
            input: parseToolInput(rawToolCall.args ?? {}),
            callProviderMetadata,
          }
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
      toHistoryMessage(item, messageIndex, resolveUrl)
    );
    const username =
      typeof rawConversation.username === "string"
        ? rawConversation.username
        : messages.find((item) => item.metadata?.employeeUsername)?.metadata
            ?.employeeUsername ?? "sub-agent";
    const sessionId = String(
      rawConversation.sessionId ??
        `sub-agent-history-${index}-${conversationIndex}`
    );
    parts.push({
      type: "data-subAgent",
      id: sessionId,
      data: {
        sessionId,
        username,
        status:
          rawConversation.status === "completed" ? "completed" : "pending",
        messages,
      },
    });
  }
  for (const attachment of attachments) {
    if (!attachment.url && !attachment.preview) continue;
    parts.push({
      type: "file",
      mediaType: attachment.mimetype ?? "application/octet-stream",
      filename: attachment.filename,
      url: attachment.url ?? attachment.preview ?? "",
    });
  }
  const rawRole = String(message.role ?? "assistant");
  const role =
    rawRole === "user" || rawRole === "system" ? rawRole : "assistant";
  return {
    id: messageId,
    role,
    metadata: {
      ...(serverMessageId ? { serverMessageId } : {}),
      ...(rawRole !== "user" && rawRole !== "system"
        ? { employeeUsername: rawRole }
        : {}),
      createdAt:
        typeof message.createdAt === "string" ? message.createdAt : undefined,
      attachments,
      workContext: Array.isArray(content.workContext)
        ? content.workContext
        : undefined,
    },
    parts,
  };
};

export class NocoBaseAIService implements AIService {
  constructor(private readonly client: NocoBaseClient = nocobaseClient) {}

  async listEmployees() {
    const employees = await this.client.action<AIEmployee[]>(
      "aiEmployees",
      "listByUser"
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
    const services = await this.client.action<
      Array<{
        llmService: string;
        llmServiceTitle: string;
        enabledModels?: Array<{ label: string; value: string }>;
        supportWebSearch?: boolean;
        isToolConflict?: boolean;
      }>
    >("ai", "listAllEnabledModels");
    return services.flatMap((service) =>
      (service.enabledModels ?? []).map<AIModel>((model) => ({
        value: model.value,
        label: model.label,
        llmService: service.llmService,
        llmServiceTitle: service.llmServiceTitle,
        supportWebSearch: service.supportWebSearch,
        isToolConflict: service.isToolConflict,
      }))
    );
  }

  async updateEmployeeUserPrompt(username: string, prompt: string) {
    await this.client.action("aiEmployees", "updateUserPrompt", {
      body: { aiEmployee: username, prompt },
    });
  }

  async listConversations(keyword = "") {
    const normalizedKeyword = keyword.trim();
    const response = await this.client.action<
      { data?: unknown[]; rows?: unknown[] } | unknown[]
    >("aiConversations", "list", {
      query: {
        sort: "-createdAt",
        appends: "aiEmployee",
        page: 1,
        pageSize: 50,
        filter: normalizedKeyword
          ? JSON.stringify({ title: { $includes: normalizedKeyword } })
          : undefined,
      },
    });
    const rows = Array.isArray(response)
      ? response
      : response.data ?? response.rows ?? [];
    return rows.flatMap<AIConversation>((value) => {
      if (!isRecord(value) || typeof value.sessionId !== "string") return [];
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
            typeof value.title === "string" && value.title
              ? value.title
              : "New conversation",
          employeeUsername: String(
            employee?.username ?? value.aiEmployeeUsername ?? ""
          ),
          updatedAt:
            typeof value.updatedAt === "string"
              ? value.updatedAt
              : new Date().toISOString(),
          unread: value.read === false,
          model:
            typeof modelSettings?.model === "string"
              ? {
                  llmService:
                    typeof modelSettings.llmService === "string"
                      ? modelSettings.llmService
                      : undefined,
                  model: modelSettings.model,
                }
              : undefined,
        },
      ];
    });
  }

  async getConversationMessages(
    sessionId: string,
    options: { updateRead?: boolean } = {}
  ) {
    const response = await this.client.action<
      { data?: unknown[]; rows?: unknown[] } | unknown[]
    >("aiConversations", "getMessages", {
      query: {
        sessionId,
        paginate: false,
        updateRead: options.updateRead === true,
      },
      body: {},
    });
    const rows = Array.isArray(response)
      ? response
      : response.data ?? response.rows ?? [];
    return [...rows]
      .reverse()
      .filter((value) => {
        if (!isRecord(value)) return true;
        return value.role !== "tool" && value.role !== "system";
      })
      .map((value, index) =>
        toHistoryMessage(value, index, (url) => this.client.resolveUrl(url))
      );
  }

  async getConversationActiveState(sessionId: string) {
    const response = await this.client.action<{
      llmActiveState?: unknown;
    }>("aiConversations", "get", {
      query: { filter: JSON.stringify({ sessionId }) },
    });
    const state = response?.llmActiveState;
    return state === "idle" || state === "streaming" || state === "invoking"
      ? (state as AIConversationActiveState)
      : undefined;
  }

  async updateConversationTitle(sessionId: string, title: string) {
    await this.client.action("aiConversations", "update", {
      method: "PUT",
      query: { filterByTk: sessionId },
      body: { title },
    });
  }

  async destroyConversation(sessionId: string) {
    await this.client.action("aiConversations", "destroy", {
      method: "DELETE",
      query: { filterByTk: sessionId },
    });
  }

  async uploadFile(file: File, signal?: AbortSignal) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await this.client.action<Record<string, unknown>>(
      "aiFiles",
      "create",
      {
        body: formData,
        signal,
        unwrap: "deep-data",
      }
    );
    return {
      ...response,
      ...(typeof response.url === "string"
        ? { url: this.client.resolveUrl(response.url) }
        : {}),
      ...(typeof response.preview === "string"
        ? { preview: this.client.resolveUrl(response.preview) }
        : {}),
    };
  }

  async createConversation(options: CreateAIConversationOptions) {
    const response = await this.client.action<{ sessionId: string }>(
      "aiConversations",
      "create",
      {
        body: {
          aiEmployee: options.employee,
          systemMessage: options.systemMessage,
          skillSettings: options.skillSettings,
          modelSettings: {
            llmService: options.model.llmService,
            model: options.model.value,
          },
        },
      }
    );
    return response.sessionId;
  }

  sendMessagesStream(body: unknown, signal?: AbortSignal) {
    return this.client.stream("aiConversations:sendMessages", {
      body,
      signal,
    });
  }

  resendMessagesStream(body: unknown, signal?: AbortSignal) {
    return this.client.stream("aiConversations:resendMessages", {
      body,
      signal,
    });
  }

  async updateToolCallDecision(options: UpdateToolCallDecisionOptions) {
    const result = await this.client.action<{
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
    }>("aiConversations", "updateUserDecision", {
      body: options,
    });
    return {
      ...result,
      toolCalls: result.toolCalls.map((toolCall) => ({
        ...toolCall,
        args: parseToolInput(toolCall.args),
      })),
    };
  }

  resumeToolCallStream(body: unknown, signal?: AbortSignal) {
    return this.client.stream("aiConversations:resumeToolCall", {
      body,
      signal,
    });
  }

  resumeConversationStream(sessionId: string, signal?: AbortSignal) {
    return this.client.stream("aiConversations:resumeStream", {
      body: { sessionId },
      signal,
    });
  }
}

export const nocobaseAIService = new NocoBaseAIService();
