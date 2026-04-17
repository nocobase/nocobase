/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, Op, Transaction } from '@nocobase/database';
import PluginAIServer from '../plugin';
import { AIMessage, AIToolCall, AIToolMessage, SubAgentConversationMetadata, UserDecision } from '../types';
import { parseResponseMessage } from '../utils';

export type AIConversationsOptions = {
  systemMessage?: unknown;
  skillSettings?: unknown;
  conversationSettings?: unknown;
  [key: string]: unknown;
};

export type AIConversationFilterParams = {
  filter: {
    userId: string;
  };
};

export type CreateAIConversationParams = {
  userId?: string;
  aiEmployee: { username: string };
  title?: string;
  options?: AIConversationsOptions;
  from?: 'main-agent' | 'sub-agent';
  transaction?: Transaction;
  category?: 'chat' | 'task';
};

export type UpdateAIConversationParams = {
  userId: string;
  sessionId: string;
  title?: string;
  options?: AIConversationsOptions;
};

export type GetAIConversationMessagesParams = {
  userId: string;
  sessionId: string;
  cursor?: string;
  paginate?: boolean;
};

export type ParsedMessageRow = AIMessage & Model;

export type GetAIConversationMessagesResult = {
  rows: any[];
  hasMore?: boolean;
  cursor?: string | null;
};

export class AIConversationsManager {
  constructor(protected plugin: PluginAIServer) {}

  async create({
    userId,
    aiEmployee,
    title,
    options = {},
    from = 'main-agent',
    transaction,
    category = 'chat',
  }: CreateAIConversationParams) {
    return await this.aiConversationsRepo.create({
      values: {
        userId,
        title,
        aiEmployee,
        options,
        thread: 1,
        from,
        category,
      },
      transaction,
    });
  }

  async update({ userId, sessionId, title, options: inputOptions }: UpdateAIConversationParams) {
    const conversation = await this.getConversation({
      sessionId,
      userId,
    });

    if (!conversation) {
      throw new Error('invalid sessionId');
    }

    const { systemMessage, skillSettings, conversationSettings } = inputOptions ?? {};
    const options = conversation.options ?? {};
    if (systemMessage) {
      options['systemMessage'] = systemMessage;
    }
    if (skillSettings) {
      options['skillSettings'] = skillSettings;
    }
    if (conversationSettings) {
      options['conversationSettings'] = conversationSettings;
    }
    const values: Record<string, unknown> = { options };
    if (title) {
      values.title = title;
    }

    return await this.aiConversationsRepo.update({
      filter: {
        userId,
        sessionId,
      },
      values,
    });
  }

  async getConversation({ sessionId, userId }: { sessionId: string; userId?: string }) {
    const conversation = await this.aiConversationsRepo.findOne({
      filter: {
        sessionId,
      },
    });

    if (!userId) {
      return conversation;
    }

    if (!conversation) {
      return null;
    }

    let ownershipCheck = await this.aiConversationsRepo.count({
      filter: {
        sessionId,
        userId,
      },
    });
    if (ownershipCheck === 0) {
      ownershipCheck = await this.plugin.db.getRepository('aiWorkflowTasks').count({
        filter: {
          sessionId,
          'users.id': userId,
        },
      });
    }

    if (ownershipCheck) {
      return conversation;
    } else {
      return null;
    }
  }

  async getMessages({
    userId,
    sessionId,
    cursor,
    paginate = true,
  }: GetAIConversationMessagesParams): Promise<GetAIConversationMessagesResult> {
    const conversation = await this.getConversation({
      sessionId,
      userId,
    });

    if (!conversation) {
      throw new Error('invalid sessionId');
    }

    const pageSize = 10;
    const maxLimit = 200;
    const messageRepository = this.plugin.db.getRepository('aiConversations.messages', sessionId);
    const filter = {
      role: {
        $notIn: ['tool'],
      },
    };
    if (paginate && cursor) {
      filter['messageId'] = {
        $lt: cursor,
      };
    }
    const rows = await messageRepository.find({
      sort: ['-messageId'],
      limit: paginate ? pageSize + 1 : maxLimit,
      filter,
    });

    const hasMore = paginate && rows.length > pageSize;
    const data = hasMore ? rows.slice(0, -1) : rows;
    const newCursor = data.length ? data[data.length - 1].messageId : null;

    const subAgentConversations = data
      .filter((row: ParsedMessageRow) => row.metadata?.subAgentConversations?.length ?? 0 > 0)
      .flatMap((row: ParsedMessageRow) => row.metadata.subAgentConversations as SubAgentConversationMetadata[]);
    const subAgentConversationSessionIds = [...new Set(subAgentConversations.map((item) => item.sessionId))];
    const subAgentConversationMessages = subAgentConversationSessionIds.length
      ? await this.aiMessagesRepo.find({
          sort: ['messageId'],
          filter: {
            sessionId: {
              $in: subAgentConversationSessionIds,
            },
            role: {
              $notIn: ['tool'],
            },
          },
        })
      : [];
    const subAgentConversationMessageMap = new Map<string, any[]>();

    const toolCallIds = [
      ...data
        .filter((row: ParsedMessageRow) => row?.toolCalls?.length ?? 0 > 0)
        .flatMap((row: ParsedMessageRow) => row.toolCalls)
        .map((toolCall: AIToolCall) => toolCall.id),
      ...subAgentConversationMessages
        .filter((row: ParsedMessageRow) => row?.toolCalls?.length ?? 0 > 0)
        .flatMap((row: ParsedMessageRow) => row.toolCalls)
        .map((toolCall: AIToolCall) => toolCall.id),
    ];
    const toolMessages = await this.aiToolMessagesRepo.find({
      filter: {
        toolCallId: {
          $in: toolCallIds,
        },
      },
    });
    const toolMessageKey = (messageId: string, toolCallId: string) => `${messageId}:${toolCallId}`;
    const toolMessageMap = new Map<string, AIToolMessage>(
      toolMessages.map((toolMessage: AIToolMessage & Model) => [
        toolMessageKey(toolMessage.messageId, toolMessage.toolCallId),
        toolMessage,
      ]),
    );

    const toolsList = await this.plugin.aiManager.toolManager.listTools();
    const toolsMap = new Map(
      toolsList
        .map((group) => group.tools)
        .flat()
        .map((tool) => [tool.name, tool]),
    );

    const parseMessageRow = (row: ParsedMessageRow) => {
      if (row?.toolCalls?.length ?? 0 > 0) {
        for (const toolCall of row.toolCalls) {
          const tool = toolsMap.get(toolCall.name);
          const toolMessage = toolMessageMap.get(toolMessageKey(row.messageId, toolCall.id));
          toolCall.invokeStatus = toolMessage?.invokeStatus;
          toolCall.invokeStartTime = toolMessage?.invokeStartTime;
          toolCall.invokeEndTime = toolMessage?.invokeEndTime;
          toolCall.auto = toolMessage?.auto;
          toolCall.status = toolMessage?.status;
          toolCall.content = toolMessage?.content;
          toolCall.execution = tool?.execution;
          toolCall.willInterrupt = tool?.execution === 'frontend' || toolMessage?.auto === false;
          toolCall.defaultPermission = tool?.defaultPermission;
        }
      }

      const providerOptions = this.plugin.aiManager.llmProviders.get(row.metadata?.provider);
      if (!providerOptions) {
        return parseResponseMessage(row);
      }
      const Provider = providerOptions.provider;
      const provider = new Provider({
        app: this.plugin.app,
      });
      return provider.parseResponseMessage(row);
    };

    for (const row of subAgentConversationMessages as ParsedMessageRow[]) {
      const sessionMessages = subAgentConversationMessageMap.get(row.sessionId) ?? [];
      sessionMessages.push(parseMessageRow(row));
      sessionMessages.forEach((it) => (it.content.from = 'sub-agent'));
      subAgentConversationMessageMap.set(row.sessionId, sessionMessages);
    }

    return {
      rows: data.map((row: ParsedMessageRow) => {
        const parsedRow = parseMessageRow(row);
        const subAgentConversationItems = (row.metadata?.subAgentConversations as SubAgentConversationMetadata[]) ?? [];
        if (subAgentConversationItems.length) {
          parsedRow.content.subAgentConversations = subAgentConversationItems.map((item) => ({
            sessionId: item.sessionId,
            toolCallId: item.toolCallId,
            status: item.status,
            messages: subAgentConversationMessageMap.get(item.sessionId) ?? [],
          }));
        }
        parsedRow.content.from = 'main-agent';
        return parsedRow;
      }),
      ...(paginate && {
        hasMore,
        cursor: newCursor,
      }),
    };
  }

  async getUserDecisions(messageId: string): Promise<{ interruptId?: string; decisions: UserDecision[] } | undefined> {
    const allInterruptedToolCall = await this.aiToolMessagesRepo.find({
      filter: {
        messageId,
        interruptActionOrder: { [Op.not]: null },
      },
      order: [['interruptActionOrder', 'ASC']],
    });
    if (!allInterruptedToolCall.every((t) => t.invokeStatus === 'waiting')) {
      return;
    }

    const message = await this.aiMessagesRepo.findOne({
      filter: {
        messageId,
      },
    });
    const interruptId = message?.get('metadata')?.interruptId;
    return {
      interruptId,
      decisions: allInterruptedToolCall.map((item) => item.userDecision as UserDecision),
    };
  }

  async resolveSubAgentConversation(sessionId: string, toolCallId: string): Promise<SubAgentConversationMetadata> {
    if (!sessionId || !toolCallId) {
      return null;
    }
    const toolMessage = await this.aiToolMessagesRepo.findOne({
      filter: {
        sessionId,
        toolCallId,
      },
    });
    if (!toolMessage) {
      return null;
    }
    const aiMessage = await this.aiMessagesRepo.findOne({
      filter: {
        sessionId,
        messageId: toolMessage.messageId,
      },
    });
    if (!aiMessage) {
      return null;
    }
    if (!aiMessage.metadata?.subAgentConversations?.length) {
      return null;
    }
    const subAgentConversation = aiMessage.metadata.subAgentConversations.find((it) => it.toolCallId == toolCallId);
    if (!subAgentConversation) {
      return null;
    }
    return subAgentConversation;
  }

  private get aiConversationsRepo() {
    return this.plugin.db.getRepository('aiConversations');
  }

  private get aiMessagesRepo() {
    return this.plugin.db.getRepository('aiMessages');
  }

  private get aiToolMessagesRepo() {
    return this.plugin.db.getRepository('aiToolMessages');
  }
}
