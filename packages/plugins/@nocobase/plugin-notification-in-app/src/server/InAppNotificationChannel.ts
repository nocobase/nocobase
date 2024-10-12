/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/server';
import { SendFnType, BaseNotificationChannel } from '@nocobase/plugin-notification-manager';
import { InAppMessageFormValues } from '../types';
import { PassThrough } from 'stream';
import { InAppMessagesDefinition as MessagesDefinition, ChannelsDefinition } from '../types';
import { parseUserSelectionConf } from './parseUserSelectionConf';
import defineMyInAppMessages from './defineMyInAppMessages';
import defineMyInAppChannels from './defineMyInAppChannels';

type UserID = string;
type ClientID = string;
export default class InAppNotificationChannel extends BaseNotificationChannel {
  userClientsMap: Record<UserID, Record<ClientID, PassThrough>>;

  constructor(protected app: Application) {
    super(app);
    this.userClientsMap = {};
  }

  async load() {
    this.onMessageCreatedOrUpdated();
    this.defineActions();
  }
  onMessageCreatedOrUpdated = async () => {
    this.app.db.on(`${MessagesDefinition.name}.afterUpdate`, async (model, options) => {
      const userId = model.userId;
      this.sendDataToUser(userId, { type: 'message:updated', data: model.dataValues });
    });
    this.app.db.on(`${MessagesDefinition.name}.afterCreate`, async (model, options) => {
      const userId = model.userId;
      this.sendDataToUser(userId, { type: 'message:created', data: model.dataValues });
    });
  };

  addClient = (userId: UserID, clientId: ClientID, stream: PassThrough) => {
    if (!this.userClientsMap[userId]) {
      this.userClientsMap[userId] = {};
    }
    this.userClientsMap[userId][clientId] = stream;
  };
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
    const channelsRepo = this.app.db.getRepository(ChannelsDefinition.name);
    const messagesRepo = this.app.db.getRepository(MessagesDefinition.name);
    let channel = await channelsRepo.findOne({ filter: { senderId, userId } });
    if (!channel) {
      channel = await channelsRepo.create({ values: { senderId, userId, title: senderName } });
    }
    const message = await messagesRepo.create({
      values: {
        content,
        title,
        chatId: channel.id,
        senderName,
        status,
        userId,
        receiveTimestamp: receiveTimestamp ?? Date.now(),
        options,
      },
    });
    await channelsRepo.update({ values: { latestMsgId: message.id }, filterByTk: channel.id });
    return message;
  };

  send: SendFnType<InAppMessageFormValues> = async (params) => {
    const { message } = params;
    const { content, receivers: userSelectionConfig, title, senderId, senderName, options = {} } = message;
    const userRepo = this.app.db.getRepository('users');
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
  // async mock() {
  //   const messagesRepo = this.app.db.getRepository(MessagesDefinition.name);
  //   const channelsRepo = this.app.db.getRepository(ChannelsDefinition.name);
  //   const channels = await MockChannels({ channelsRepo }, { totalNum: 1, userId: 1 });
  //   for (const channel of channels) {
  //     await MockMessages(
  //       { messagesRepo, channelsRepo },
  //       { unreadNum: 50, readNum: 50, chatId: channel.id, startTimeStamp: Date.now(), userId: 1 },
  //     );
  //   }
  //   // add 100 read channels
  //   const readChannels = await MockChannels({ channelsRepo }, { totalNum: 100, userId: 1 });
  //   for (const channel of readChannels) {
  //     await MockMessages(
  //       { messagesRepo, channelsRepo },

  //       { unreadNum: 1, readNum: 1, chatId: channel.id, startTimeStamp: Date.now(), userId: 1 },
  //     );
  //   }
  // }

  defineActions() {
    defineMyInAppMessages({ app: this.app, addClient: this.addClient });
    defineMyInAppChannels({ app: this.app });
    this.app.acl.allow('myInAppMessages', '*', 'loggedIn');
    this.app.acl.allow('myInAppChannels', '*', 'loggedIn');
    this.app.acl.allow('notificationInAppMessages', '*', 'loggedIn');
  }
}
