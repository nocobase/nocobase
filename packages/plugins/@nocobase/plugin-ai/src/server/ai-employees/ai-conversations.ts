/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import PluginAIServer from '../plugin';
import { AIMessage, AIToolCall, AIToolMessage } from '../types';
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
  userId: string;
  aiEmployee: { username: string };
  title?: string;
  options?: AIConversationsOptions;
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

  async create({ userId, aiEmployee, title, options = {} }: CreateAIConversationParams) {
    return await this.aiConversationsRepo.create({
      values: {
        userId,
        title,
        aiEmployee,
        options,
        thread: 1,
      },
    });
  }

  async update({ userId, sessionId, title, options: inputOptions }: UpdateAIConversationParams) {
    const conversation = await this.aiConversationsRepo.findOne({
      filter: {
        sessionId,
        userId,
      },
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

  async getMessages({
    userId,
    sessionId,
    cursor,
    paginate = true,
  }: GetAIConversationMessagesParams): Promise<GetAIConversationMessagesResult> {
    const conversation = await this.aiConversationsRepo.findOne({
      filter: {
        sessionId,
        userId,
      },
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

    const toolCallIds = data
      .filter((row: ParsedMessageRow) => row?.toolCalls?.length ?? 0 > 0)
      .flatMap((row: ParsedMessageRow) => row.toolCalls)
      .map((toolCall: AIToolCall) => toolCall.id);
    const toolMessages = await this.aiConversationsRepo.find({
      filter: {
        sessionId,
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

    return {
      rows: data.map((row: ParsedMessageRow) => {
        if (row?.toolCalls?.length ?? 0 > 0) {
          for (const toolCall of row.toolCalls) {
            const tool = toolsMap.get(toolCall.name);
            const toolMessage = toolMessageMap.get(toolMessageKey(row.messageId, toolCall.id));
            toolCall.invokeStatus = toolMessage?.invokeStatus;
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
      }),
      ...(paginate && {
        hasMore,
        cursor: newCursor,
      }),
    };
  }

  private get aiConversationsRepo() {
    return this.plugin.db.getRepository('aiConversations');
  }
}
