import type {
  AIChatConversation,
  AIMessage,
  AIMessageInput,
  AIToolMessage,
  ToolsEntity,
} from '@nocobase/ai-employee';
import type {
  AgentInterruptAction,
  AgentThread,
  ConversationMessageStore,
  SavedAssistantMessage,
} from '../types.js';
import type { ConversationPersistence } from '../contracts/persistence.js';
import {
  EXECUTE_FRONTEND_TOOL_NAME,
  type FrontendToolManifest,
} from '../context/ai-employee/common/frontend-tool-contracts.js';
type NormalizedToolCallResult = {
  status: string;
  content: unknown;
};
type SourceMessageMetadata = {
  model?: unknown;
  provider?: unknown;
  llmService?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
function normalizeToolCallResult(result: unknown): NormalizedToolCallResult {
  if (typeof result !== 'object' || result === null) {
    return { status: 'success', content: result };
  }
  const value = result as Record<string, unknown>;
  return {
    status: typeof value.status === 'string' ? value.status : 'success',
    content: value.content ?? result,
  };
}
function sourceMessageMetadata(metadata: unknown): SourceMessageMetadata {
  if (typeof metadata !== 'object' || metadata === null) return {};
  const value = metadata as Record<string, unknown>;
  return {
    model: value.model,
    provider: value.provider,
    llmService: value.llmService,
  };
}

export interface ConversationMessageStoreOptions {
  readonly sessionId: string;
  readonly conversation: AIChatConversation;
  readonly persistence: ConversationPersistence;
  readonly getCurrentFrontendTools: () => Promise<
    readonly FrontendToolManifest[]
  >;
}

export class ConversationMessageStoreImpl implements ConversationMessageStore {
  private readonly sessionId: string;
  private readonly conversation: AIChatConversation;
  private readonly persistence: ConversationPersistence;
  private readonly getCurrentFrontendTools: () => Promise<
    readonly FrontendToolManifest[]
  >;
  public constructor(options: ConversationMessageStoreOptions) {
    this.sessionId = options.sessionId;
    this.conversation = options.conversation;
    this.persistence = options.persistence;
    this.getCurrentFrontendTools = options.getCurrentFrontendTools;
  }

  private withTransaction<T>(
    callback: (
      target: AIChatConversation,
      transaction?: Parameters<AIChatConversation['withTransaction']>[1],
    ) => Promise<T>,
  ): Promise<T> {
    return this.conversation.withTransaction(callback);
  }

  private get messages(): ConversationPersistence['messages'] {
    return this.persistence.messages;
  }

  private get toolMessages(): ConversationPersistence['toolMessages'] {
    return this.persistence.toolMessages;
  }

  public loadMessages(messageId?: string): Promise<AIMessage[]> {
    return this.conversation.listMessages({ messageId });
  }

  public saveUserMessages(
    messages: AIMessageInput[],
    messageId?: string,
    thread?: AgentThread,
  ): Promise<void> {
    return this.withTransaction(async (target) => {
      if (thread) await target.updateThread(thread.thread);
      if (messageId && (await target.getMessage(messageId))) {
        await target.removeMessages({ messageId });
      }
      if (messages.length) await target.addMessages(messages);
    });
  }

  public saveAssistantMessage(
    message: AIMessageInput,
    toolMap: ReadonlyMap<string, ToolsEntity>,
  ): Promise<SavedAssistantMessage> {
    return this.withTransaction(async (target, transaction) => {
      const saved = await target.addMessages(message);
      const toolCalls = saved.toolCalls ?? [];
      if (!toolCalls.length) {
        return { message: saved, initializedToolCalls: [] };
      }

      const now = new Date();
      let frontendToolsPromise:
        Promise<readonly FrontendToolManifest[]> | undefined;
      const getFrontendTools = () =>
        (frontendToolsPromise ??= this.getCurrentFrontendTools());
      const resolveAuto = async (
        tool: ToolsEntity | undefined,
        args: unknown,
      ): Promise<boolean> => {
        if (!tool) return false;
        if (tool.definition.name !== EXECUTE_FRONTEND_TOOL_NAME) {
          return tool.auto === true;
        }
        if (!isRecord(args) || typeof args.toolId !== 'string') return false;
        const frontendTools = await getFrontendTools();
        return (
          frontendTools.find((item) => item.id === args.toolId)?.permission ===
          'ALLOW'
        );
      };
      const initializedToolCalls = (await this.toolMessages.create(
        {
          values: await Promise.all(
            toolCalls.map(async (toolCall) => {
              const tool = toolMap.get(toolCall.name);
              const exists = Boolean(tool);
              // The id is the repository's to generate: a bigint from the application's id generator. A UUID
              // here is rejected by every database that checks the column type, which SQLite does not.
              return {
                sessionId: this.sessionId,
                messageId: saved.messageId,
                toolCallId: toolCall.id,
                toolName: toolCall.name,
                status: exists ? null : 'error',
                content: exists ? null : `Tool ${toolCall.name} not found`,
                invokeStatus: exists ? 'init' : 'done',
                invokeStartTime: exists ? null : now,
                invokeEndTime: exists ? null : now,
                auto: await resolveAuto(tool, toolCall.args),
                execution: tool?.execution ?? 'backend',
              };
            }),
          ),
        },
        { connection: transaction },
      )) as AIToolMessage[];

      return { message: saved, initializedToolCalls };
    });
  }

  public async saveToolMessages(
    sourceMessageId: string,
    messages: AIMessageInput[],
  ): Promise<void> {
    if (!messages.length) return;

    const toolCallIds = messages.map((message) => {
      const toolCallId = message.metadata?.toolCallId;
      if (typeof toolCallId !== 'string' || !toolCallId) {
        throw new Error('Tool message requires metadata.toolCallId');
      }
      return toolCallId;
    });

    await this.withTransaction(async (target, transaction) => {
      await target.addMessages(messages);
      await this.toolMessages.update(
        {
          values: { invokeStatus: 'confirmed' },
          filter: {
            sessionId: this.sessionId,
            messageId: sourceMessageId,
            toolCallId: { $in: toolCallIds },
          },
        },
        { connection: transaction },
      );
    });
  }

  public async updateMessage(
    messageId: string,
    patch: Partial<AIMessageInput>,
  ): Promise<void> {
    const message = await this.messages.findOne({
      filter: { sessionId: this.sessionId, messageId },
    });
    if (!message) return;
    const metadataPatch = patch.metadata;
    const currentResponseMetadata = isRecord(
      message.metadata?.response_metadata,
    )
      ? message.metadata.response_metadata
      : {};
    const responseMetadataPatch = isRecord(metadataPatch?.response_metadata)
      ? metadataPatch.response_metadata
      : undefined;
    const metadata = metadataPatch
      ? {
          ...message.metadata,
          ...metadataPatch,
          ...(responseMetadataPatch
            ? {
                response_metadata: {
                  ...currentResponseMetadata,
                  ...responseMetadataPatch,
                },
              }
            : {}),
        }
      : undefined;
    await this.messages.update({
      values: { ...patch, ...(metadata ? { metadata } : {}) },
      filter: { sessionId: this.sessionId, messageId },
    });
  }

  public currentThread(): Promise<AgentThread> {
    return this.conversation.currentThread();
  }

  public updateToolInterrupted(
    sessionId: string,
    messageId: string,
    toolCallId: string,
    interruptId: string,
    interruptAction: AgentInterruptAction,
  ): Promise<number> {
    return this.withTransaction(async (_target, transaction) => {
      const updated = await this.toolMessages.update(
        {
          values: {
            invokeStatus: 'interrupted',
            interruptActionOrder: interruptAction.order,
            interruptAction,
          },
          filter: { sessionId, messageId, toolCallId, invokeStatus: 'init' },
        },
        { connection: transaction },
      );
      if (!updated) return updated;

      const message = await this.messages.findOne(
        { filter: { messageId, sessionId } },
        { connection: transaction },
      );
      if (!message) return updated;

      await this.messages.update(
        {
          values: { metadata: { ...(message.metadata ?? {}), interruptId } },
          filter: { messageId, sessionId },
        },
        { connection: transaction },
      );
      return updated;
    });
  }

  public updateToolPending(
    messageId: string,
    toolCallId: string,
  ): Promise<number> {
    return this.toolMessages.update({
      values: { invokeStatus: 'pending', invokeStartTime: new Date() },
      filter: {
        sessionId: this.sessionId,
        messageId,
        toolCallId,
        invokeStatus: { $in: ['init', 'waiting'] },
      },
    });
  }

  public updateToolDone(
    messageId: string,
    toolCallId: string,
    result: unknown,
  ): Promise<number> {
    const normalized = normalizeToolCallResult(result);
    return this.toolMessages.update({
      values: {
        invokeStatus: 'done',
        invokeEndTime: new Date(),
        status: normalized.status,
        content: normalized.content,
      },
      filter: {
        sessionId: this.sessionId,
        messageId,
        toolCallId,
        invokeStatus: 'pending',
      },
    });
  }

  public updateToolError(
    messageId: string,
    toolCallId: string,
    error: unknown,
  ): Promise<number> {
    return this.updateToolDone(messageId, toolCallId, {
      status: 'error',
      content: error instanceof Error ? error.message : error,
    });
  }

  public cancelToolCall(): Promise<AIMessageInput[] | undefined> {
    return this.cancelPendingToolCalls();
  }

  public getToolCallResult(
    messageId: string,
    toolCallId: string,
  ): Promise<AIToolMessage | null> {
    return this.toolMessages.findOne({
      filter: { sessionId: this.sessionId, messageId, toolCallId },
    });
  }

  public async listToolCallResult(
    messageId: string,
    toolCallIds: string[],
  ): Promise<Map<string, AIToolMessage>> {
    const list: AIToolMessage[] = await this.toolMessages.find({
      filter: {
        sessionId: this.sessionId,
        messageId,
        toolCallId: { $in: toolCallIds },
      },
    });
    const result = new Map<string, AIToolMessage>();
    for (const item of list) {
      if (item.toolCallId) result.set(item.toolCallId, item);
    }
    return result;
  }

  private async cancelPendingToolCalls(): Promise<
    AIMessageInput[] | undefined
  > {
    const reason =
      'The user ignored the application for tools usage and will continued to ask questions';
    const historyMessages = await this.messages.find({
      filter: { sessionId: this.sessionId },
      sort: ['-messageId'],
    });
    const [sourceMessage] = historyMessages;
    if (!sourceMessage?.toolCalls?.length) return undefined;

    const messageId = sourceMessage.messageId;
    const toolMessages = await this.toolMessages.find({
      filter: {
        sessionId: this.sessionId,
        messageId,
        invokeStatus: { $ne: 'confirmed' },
      },
    });
    if (!toolMessages.length) return undefined;

    const toolCallMap = new Map(
      sourceMessage.toolCalls.map((toolCall) => [toolCall.id, toolCall]),
    );
    const metadata = sourceMessageMetadata(sourceMessage.metadata);
    const now = new Date();
    return this.withTransaction(async (_target, transaction) => {
      for (const toolMessage of toolMessages) {
        await this.toolMessages.update(
          {
            values: {
              invokeStatus: 'confirmed',
              status: 'success',
              content: reason,
              invokeStartTime: toolMessage.invokeStartTime ?? now,
              invokeEndTime: toolMessage.invokeEndTime ?? now,
            },
            filter: {
              id: toolMessage.id,
              sessionId: this.sessionId,
              invokeStatus: toolMessage.invokeStatus,
            },
          },
          { connection: transaction },
        );
      }
      return this.messages.create(
        {
          // messageId is a bigint the repository generates, as for every other message.
          values: toolMessages.map((toolMessage) => ({
            sessionId: this.sessionId,
            role: 'tool',
            content: { type: 'text', content: reason },
            metadata: {
              model: metadata.model,
              provider: metadata.provider,
              llmService: metadata.llmService,
              toolCall: toolMessage.toolCallId
                ? toolCallMap.get(toolMessage.toolCallId)
                : undefined,
              toolCallId: toolMessage.toolCallId,
              sourceMessageId: messageId,
              autoCall: toolMessage.auto,
            },
          })),
        },
        { connection: transaction },
      );
    });
  }
}
