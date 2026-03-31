/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint';
import { Op } from '@nocobase/database';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';

export type AIConversationsType = {
  sessionId: string;
  thread: number;
};

export class CheckpointCleaner {
  constructor(
    private readonly provideCollectionManager: () => { collectionManager: SequelizeCollectionManager },
    private readonly checkpointSaver: BaseCheckpointSaver,
  ) {}

  async cleanOutdated(expiredAt: Date) {
    const outdatedConversations = await this.aiConversationsModel.findAll({
      attributes: ['sessionId', 'thread'],
      where: {
        updatedAt: {
          [Op.lt]: expiredAt,
        },
        thread: {
          [Op.ne]: 0,
        },
      },
      raw: true,
    });

    if (!outdatedConversations.length) {
      return;
    }

    const sessionIds = outdatedConversations.map((conversation) => conversation.sessionId);
    const latestMessageRefs = await this.aiMessagesModel.findAll({
      attributes: ['sessionId', [this.sequelize.fn('MAX', this.sequelize.col('messageId')), 'messageId']],
      where: {
        sessionId: {
          [Op.in]: sessionIds,
        },
      },
      group: ['sessionId'],
      raw: true,
    });

    if (!latestMessageRefs.length) {
      return;
    }

    const latestMessageIds = latestMessageRefs.map((row) => row.messageId);
    const latestMessages = await this.aiMessagesModel.findAll({
      attributes: ['sessionId', 'updatedAt', 'toolCalls'],
      where: {
        messageId: {
          [Op.in]: latestMessageIds,
        },
      },
      raw: true,
    });

    const latestMessageMap = new Map(latestMessages.map((message) => [message.sessionId, message]));
    const conversationsToClean: AIConversationsType[] = [];
    for (const conversation of outdatedConversations) {
      const latestMessage = latestMessageMap.get(conversation.sessionId);
      if (!latestMessage) {
        continue;
      }
      const latestMessageAt = latestMessage.updatedAt ? new Date(latestMessage.updatedAt) : undefined;
      const hasToolCalls = Array.isArray(latestMessage.toolCalls)
        ? latestMessage.toolCalls.length > 0
        : !!latestMessage.toolCalls;
      if (latestMessageAt && latestMessageAt < expiredAt && !hasToolCalls) {
        conversationsToClean.push(conversation as unknown as AIConversationsType);
      }
    }

    if (!conversationsToClean.length) {
      return;
    }

    await this.clean(conversationsToClean);
  }

  async clean(conversations: AIConversationsType[]): Promise<void> {
    if (!conversations?.length) {
      return;
    }
    const threadIds = this.getThreadIds(conversations);
    await this.aiConversationsModel.update(
      { thread: 0 },
      {
        where: {
          sessionId: {
            [Op.in]: conversations.map((x) => x.sessionId),
          },
        },
      },
    );
    for (const threadId of threadIds) {
      await this.checkpointSaver.deleteThread(threadId);
    }
  }

  private getThreadIds(conversations: AIConversationsType[]): string[] {
    const threadIds = [];
    for (const conversation of conversations) {
      for (let i = conversation.thread; i > 0; i--) {
        threadIds.push(`${conversation.sessionId}:${i}`);
      }
    }
    return threadIds;
  }

  private get aiConversationsModel() {
    return this.collectionManager.getCollection('aiConversations').model;
  }

  private get aiMessagesModel() {
    return this.collectionManager.getCollection('aiMessages').model;
  }

  private get sequelize() {
    return this.collectionManager.db.sequelize;
  }

  private get collectionManager() {
    return this.provideCollectionManager().collectionManager;
  }
}
