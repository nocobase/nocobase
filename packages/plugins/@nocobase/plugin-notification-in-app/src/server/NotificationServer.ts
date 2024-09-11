/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SendFnType, NotificationServerBase } from '@nocobase/plugin-notification-manager';
import { InAppMessageFormValues } from '../types';
import { PassThrough } from 'stream';
import PluginNotificationInAppServer from './plugin';
import { InAppMessagesDefinition, ChatsDefinition } from '../types';
import { FindAttributeOptions, ModelStatic, Op, Sequelize, WhereOptions } from 'sequelize';
import { randomUUID } from 'crypto';
import { uid } from '@nocobase/utils';

type UserID = string;
type ClientID = string;
export default class NotificationServer extends NotificationServerBase {
  userClientsMap: Record<UserID, Record<ClientID, PassThrough>>;
  plugin: PluginNotificationInAppServer;

  constructor({ plugin }: { plugin: PluginNotificationInAppServer }) {
    super();
    this.userClientsMap = {};
    this.plugin = plugin;
  }

  addClient(userId: UserID, clientId: ClientID, stream: PassThrough) {
    if (!this.userClientsMap[userId]) {
      this.userClientsMap[userId] = {};
    }
    this.userClientsMap[userId][clientId] = stream;
  }

  saveMessageToDB = async ({
    content,
    senderName,
    senderId,
    status,
    userId,
    title,
    receiveTimestamp,
  }: {
    content: string;
    senderName: string;
    senderId: string;
    userId: string;
    title: string;
    status: 'read' | 'unread';
    receiveTimestamp?: number;
  }): Promise<boolean> => {
    const chatsRepo = this.plugin.app.db.getRepository(ChatsDefinition.name);
    const messagesRepo = this.plugin.app.db.getRepository(InAppMessagesDefinition.name);
    let chat = await chatsRepo.findOne({ filter: { senderId, userId } });
    if (!chat) {
      chat = await chatsRepo.create({ values: { senderId, userId, title: senderName } });
    }
    const message = await messagesRepo.create({
      values: {
        content,
        title,
        chatId: chat.id,
        senderName,
        status,
        userId,
        receiveTimestamp: receiveTimestamp ?? Date.now(),
      },
    });
    await chatsRepo.update({ values: { latestMsgId: message.id }, filterByTk: chat.id });
    return true;
  };

  send: SendFnType<InAppMessageFormValues> = async (options) => {
    const { message } = options;
    const { content, receivers } = message;
    const { title, senderId } = content.config;

    await Promise.all(
      receivers.map(async (userId) => {
        const clients = this.userClientsMap[userId];
        if (clients) {
          for (const clientId in clients) {
            const stream = clients[clientId];
            const messageData = { content: content.body, title };
            stream.write(`data: ${JSON.stringify(messageData)}\n\n`);
          }
        }

        await this.saveMessageToDB({
          title,
          content: content.body,
          senderName: title,
          senderId,
          status: 'unread',
          userId,
        });
      }),
    );
    // 测试用
    await this.mockMessages();
    return { status: 'success', receivers, content: content.body, title };
  };

  mockMessages = async () => {
    function randomTimestamp() {
      return 1726026118768 - Math.floor(Math.random() * 1000 * 3600 * 24 * 180);
    }

    const writeMessages = async (i: number, userId: string, senderId: string, senderName: string) => {
      for (let j = 0; j < 100; j++) {
        const content = `${senderName}-content-${uid()}`;
        const title = `sender${i}-${uid()}`;
        if (i > 2 && j > 1) break;
        await this.saveMessageToDB({
          content,
          title,
          senderName,
          senderId,
          status: 'unread',
          userId,
          receiveTimestamp: i < 2 ? Date.now() : randomTimestamp(),
        });
      }
      return true;
    };

    for (let i = 0; i < 100; i++) {
      const senderId = randomUUID();
      const userId = '1';
      const senderName = `senderName${uid()}`;
      await writeMessages(i, userId, senderId, senderName);
    }
  };

  defineActions() {
    this.plugin.app.resourceManager.define({
      name: 'myInSiteMessages',
      actions: {
        sse: {
          handler: async (ctx, next) => {
            const userId = ctx.state.currentUser.id;
            const clientId = ctx.action.params.id;
            ctx.request.socket.setTimeout(0);
            ctx.req.socket.setNoDelay(true);
            ctx.req.socket.setKeepAlive(true);
            ctx.set({
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
            });

            ctx.status = 200;
            const stream = new PassThrough();
            ctx.body = stream;
            this.addClient(userId, clientId, stream);
            await next();
          },
        },
        count: {
          handler: async (ctx) => {
            const userId = ctx.state.currentUser.id;
            const status = ctx.action.params.status;
            const messages = this.plugin.app.db.getRepository(InAppMessagesDefinition.name);
            const count = await messages.count({ filter: { userId, status: 'unread' } });
            ctx.body = { count };
          },
        },
        list: {
          handler: async (ctx) => {
            const messagesRepo = this.plugin.app.db.getRepository(InAppMessagesDefinition.name);
            const { groupId, filter = {} } = ctx.action.params;
            const messageList = await messagesRepo.find({
              limit: 30,
              filter: {
                chatId: groupId,
                userId: ctx.state.currentUser.id,
                ...filter,
              },
              order: [['createdAt', 'DESC']],
            });
            ctx.body = { messages: messageList };
          },
        },
      },
    });
    this.plugin.app.resourceManager.define({
      name: 'myInSiteChats',
      actions: {
        list: {
          handler: async (ctx) => {
            const userId = ctx.state.currentUser.id;
            const { filter = {} } = ctx.action.params;
            const conditions = [];
            if (filter?.latestMsgReceiveTimestamp?.$lt) {
              conditions.push(Sequelize.literal(`latestMsgReceiveTimestamp < ${filter.latestMsgReceiveTimestamp.$lt}`));
            }

            const chatsRepo = this.plugin.app.db.getRepository(ChatsDefinition.name);
            try {
              const allChats = await chatsRepo.find({
                logging: console.log,
                limit: 30,
                filter,
                attributes: {
                  include: [
                    [
                      Sequelize.literal(`(
                                  SELECT COUNT(*)
                                  FROM ${InAppMessagesDefinition.name} AS messages
                                  WHERE
                                      messages.chatId = ${ChatsDefinition.name}.id
                                      AND
                                      messages.status = "unread"
                              )`),
                      'unreadMsgCnt',
                    ],
                    [
                      Sequelize.literal(`(
                                  SELECT messages.receiveTimestamp
                                  FROM ${InAppMessagesDefinition.name} AS messages
                                  WHERE
                                      messages.chatId = ${ChatsDefinition.name}.id
                                  ORDER BY messages.receiveTimestamp DESC
                                  LIMIT 1
                              )`),
                      'latestMsgReceiveTimestamp',
                    ],
                    [
                      Sequelize.literal(`(
                        SELECT messages.title
                                FROM ${InAppMessagesDefinition.name} AS messages
                                WHERE
                                    messages.chatId = ${ChatsDefinition.name}.id
                                ORDER BY messages.receiveTimestamp DESC
                                LIMIT 1
                    )`),
                      'latestMsgTitle',
                    ],
                  ],
                },
                sort: '-latestMsgReceiveTimestamp',
                where: {
                  [Op.and]: conditions,
                },
              });
              ctx.body = { chats: allChats };
            } catch (error) {
              console.error(error);
            }
          },
        },
      },
    });
  }
}
