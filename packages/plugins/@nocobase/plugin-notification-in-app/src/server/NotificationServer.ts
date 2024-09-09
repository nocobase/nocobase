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
import { FindAttributeOptions, ModelStatic, Op, Sequelize } from 'sequelize';

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

  send: SendFnType<InAppMessageFormValues> = async (options) => {
    const { message } = options;
    const { content, receivers } = message;
    const { title, senderId } = content.config;
    const chats = this.plugin.app.db.getRepository(ChatsDefinition.name);
    const messages = this.plugin.app.db.getRepository(InAppMessagesDefinition.name);

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
        let chat = await chats.findOne({ filter: { senderId, userId } });
        if (!chat) {
          chat = await chats.create({ values: { senderId, userId, title } });
        }
        await messages.create({ values: { content: content.body, userId, status: 'unread', title, chatId: chat.id } });
      }),
    );
    return { status: 'success', receivers, content: content.body, title };
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
            const groupId = ctx.action.params.groupId;
            const messageList = await messagesRepo.find({
              filter: {
                chatId: groupId,
                userId: ctx.state.currentUser.id,
              },
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
            const chatsRepo = this.plugin.app.db.getRepository(ChatsDefinition.name);
            try {
              const chats = await chatsRepo.find({
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
                                  SELECT MAX(messages.createdAt)
                                  FROM ${InAppMessagesDefinition.name} AS messages
                                  WHERE
                                      messages.chatId = ${ChatsDefinition.name}.id
                              )`),
                      'lastMsgReceivedTime',
                    ],
                  ],
                },
              });
              ctx.body = { chats };
            } catch (error) {
              console.error(error);
            }
          },
        },
      },
    });
  }
}
