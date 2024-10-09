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
import { InAppMessagesDefinition as MessagesDefinition, ChannelsDefinition as ChannelsDefinition } from '../types';
import { Op, Sequelize } from 'sequelize';
import { randomUUID } from 'crypto';
import { uid } from '@nocobase/utils';
import { parseUserSelectionConf } from './parseUserSelectionConf';

type UserID = string;
type ClientID = string;
export default class NotificationServer extends NotificationServerBase {
  userClientsMap: Record<UserID, Record<ClientID, PassThrough>>;
  plugin: PluginNotificationInAppServer;

  constructor({ plugin }: { plugin: PluginNotificationInAppServer }) {
    super();
    this.userClientsMap = {};
    this.plugin = plugin;
    this.onMessageCreatedOrUpdated();
  }
  onMessageCreatedOrUpdated = async () => {
    this.plugin.db.on(`${MessagesDefinition.name}.afterUpdate`, async (model, options) => {
      const userId = model.userId;
      this.sendDataToUser(userId, { type: 'message:updated', data: model.dataValues });
    });
    this.plugin.db.on(`${MessagesDefinition.name}.afterCreate`, async (model, options) => {
      const userId = model.userId;
      this.sendDataToUser(userId, { type: 'message:created', data: model.dataValues });
    });
  };

  addClient(userId: UserID, clientId: ClientID, stream: PassThrough) {
    if (!this.userClientsMap[userId]) {
      this.userClientsMap[userId] = {};
    }
    this.userClientsMap[userId][clientId] = stream;
  }
  sendDataToUser(userId: UserID, message: { type: string; data: any }) {
    const clients = this.userClientsMap[userId];
    if (clients) {
      for (const clientId in clients) {
        const stream = clients[clientId];
        stream.write(`data: ${JSON.stringify(message)}\n\n`);
      }
    }
  }

  saveMessageToDB = async ({
    content,
    senderName,
    senderId,
    status,
    userId,
    title,
    receiveTimestamp,
    options = {},
  }: {
    content: string;
    senderName: string;
    senderId: string;
    userId: string;
    title: string;
    status: 'read' | 'unread';
    receiveTimestamp?: number;
    options?: Record<string, any>;
  }): Promise<any> => {
    const chatsRepo = this.plugin.app.db.getRepository(ChannelsDefinition.name);
    const messagesRepo = this.plugin.app.db.getRepository(MessagesDefinition.name);
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
        options,
      },
    });
    await chatsRepo.update({ values: { latestMsgId: message.id }, filterByTk: chat.id });
    return message;
  };

  send: SendFnType<InAppMessageFormValues> = async (params) => {
    const { message } = params;
    const { content, receivers: userSelectionConfig, title, senderId, senderName, options = {} } = message;
    const userRepo = this.plugin.app.db.getRepository('users');
    const receivers = await parseUserSelectionConf(userSelectionConfig, userRepo);

    await Promise.all(
      receivers.map(async (userId) => {
        const message = await this.saveMessageToDB({
          title,
          content,
          senderName,
          senderId,
          status: 'unread',
          userId,
          options,
        });
      }),
    );
    return { status: 'success', message };
  };

  defineActions() {
    this.plugin.app.resourceManager.define({
      name: 'myInAppMessages',
      actions: {
        sse: {
          handler: async (ctx, next) => {
            const userId = ctx.state.currentUser.id;
            const clientId = ctx.action?.params?.id;
            if (!clientId) return;
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
            const messages = this.plugin.app.db.getRepository(MessagesDefinition.name);
            const count = await messages.count({ filter: { userId, status: 'unread' } });
            ctx.body = { count };
          },
        },
        list: {
          handler: async (ctx) => {
            const userId = ctx.state.currentUser.id;
            const messagesRepo = this.plugin.app.db.getRepository(MessagesDefinition.name);
            const { filter = {} } = ctx.action?.params ?? {};
            const messageList = await messagesRepo.find({
              limit: 20,
              logging: console.log,
              ...(ctx.action?.params ?? {}),
              filter: {
                ...filter,
                userId,
              },
              sort: '-receiveTimestamp',
            });
            ctx.body = { messages: messageList };
          },
        },
        update: {
          handler: async (ctx) => {
            const userId = ctx.state.currentUser.id;
            const messages = this.plugin.app.db.getRepository(MessagesDefinition.name);
            const count = await messages.count({ filter: { userId, status: 'unread' } });
            ctx.body = { count };
          },
        },
      },
    });

    this.plugin.app.resourceManager.define({
      name: 'myInAppChats',
      actions: {
        list: {
          handler: async (ctx) => {
            const { filter = {}, limit = 30 } = ctx.action?.params ?? {};
            const messagesCollection = this.plugin.app.db.getCollection(MessagesDefinition.name);
            const messagesTableName = messagesCollection.getRealTableName(true);
            const channelsCollection = this.plugin.app.db.getCollection(ChannelsDefinition.name);
            const channelsTableAliasName = this.plugin.app.db.sequelize
              .getQueryInterface()
              .quoteIdentifier(channelsCollection.name);
            const userId = ctx.state.currentUser.id;
            const conditions: any[] = [];
            if (userId) conditions.push({ userId });
            if (filter?.latestMsgReceiveTimestamp?.$lt) {
              conditions.push(Sequelize.literal(`latestMsgReceiveTimestamp < ${filter.latestMsgReceiveTimestamp.$lt}`));
            }
            if (filter?.id) conditions.push({ id: filter.id });

            const channelsRepo = this.plugin.app.db.getRepository(ChannelsDefinition.name);
            try {
              const messagesFieldName = {
                channelId: messagesCollection.getRealFieldName(MessagesDefinition.fieldNameMap.chatId, true),
                status: messagesCollection.getRealFieldName(MessagesDefinition.fieldNameMap.status, true),
                receiveTimestamp: messagesCollection.getRealFieldName(
                  MessagesDefinition.fieldNameMap.receiveTimestamp,
                  true,
                ),
                title: messagesCollection.getRealFieldName(MessagesDefinition.fieldNameMap.title, true),
              };
              const channelsRes = channelsRepo.find({
                logging: console.log,
                limit,
                filter,
                attributes: {
                  include: [
                    [
                      Sequelize.literal(`(
                                  SELECT COUNT(*)
                                  FROM ${messagesTableName} AS messages
                                  WHERE
                                      messages.${messagesFieldName.channelId} = ${channelsTableAliasName}.id
                              )`),
                      'totalMsgCnt',
                    ],
                    [
                      Sequelize.literal(`(
                                  SELECT COUNT(*)
                                  FROM ${messagesTableName} AS messages
                                  WHERE
                                      messages.${messagesFieldName.channelId} = ${channelsTableAliasName}.id
                                      AND
                                      messages.${messagesFieldName.status} = 'unread'
                              )`),
                      'unreadMsgCnt',
                    ],
                    [
                      Sequelize.literal(`(
                                  SELECT messages.${messagesFieldName.receiveTimestamp}
                                  FROM ${messagesTableName} AS messages
                                  WHERE
                                      messages.${messagesFieldName.channelId} = ${channelsTableAliasName}.id
                                  ORDER BY messages.${messagesFieldName.receiveTimestamp} DESC
                                  LIMIT 1
                              )`),
                      'latestMsgReceiveTimestamp',
                    ],
                    [
                      Sequelize.literal(`(
                        SELECT messages.${messagesFieldName.title}
                                FROM ${messagesTableName} AS messages
                                WHERE
                                    messages.${messagesFieldName.channelId} = ${channelsTableAliasName}.id
                                ORDER BY messages.${messagesFieldName.receiveTimestamp} DESC
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

              const countRes = channelsRepo.count({
                logging: console.log,
                filter: {
                  userId,
                },
              });

              const [channels, count] = await Promise.all([channelsRes, countRes]);
              ctx.body = { rows: channels, count };
            } catch (error) {
              console.error(error);
            }
          },
        },
      },
    });

    // this.plugin.app.acl.registerSnippet({
    //   name: 'pm.notification',
    //   actions: ['myInAppMessages:*', 'myInAppChats:*', 'notificationInAppMessages:*'],
    // });
    this.plugin.app.acl.allow('myInAppMessages', '*', 'loggedIn');
    this.plugin.app.acl.allow('myInAppChats', '*', 'loggedIn');
    this.plugin.app.acl.allow('notificationInAppMessages', '*', 'loggedIn');
  }
}
