/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseNotificationChannel, SendFnType } from '@nocobase/plugin-notification-manager';
import { Application } from '@nocobase/server';
import { PassThrough } from 'stream';
import { InAppMessageFormValues, InAppMessagesDefinition as MessagesDefinition } from '../types';
import defineMyInAppChannels from './defineMyInAppChannels';
import defineMyInAppMessages from './defineMyInAppMessages';
import { parseUserSelectionConf } from './parseUserSelectionConf';

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
  getClient = (userId: UserID, clientId: ClientID) => {
    return this.userClientsMap[userId]?.[clientId];
  };
  removeClient = (userId: UserID, clientId: ClientID) => {
    if (this.userClientsMap[userId]) {
      delete this.userClientsMap[userId][clientId];
    }
  };
  sendDataToUser(userId: UserID, message: { type: string; data: any }) {
    const clients = this.userClientsMap[userId];
    if (clients) {
      for (const clientId in clients) {
        const stream = clients[clientId];
        stream.write(
          `data: ${encodeURIComponent(
            JSON.stringify({
              type: message.type,
              data: {
                ...message.data,
                title: message.data.title || '',
                content: message.data.content || '',
              },
            }),
          )}\n\n`,
        );
      }
    }
  }

  saveMessageToDB = async ({
    content,
    contentType,
    status,
    userId,
    title,
    channelName,
    receiveTimestamp,
    options = {},
  }: {
    content: string;
    userId: number;
    contentType: 'text' | 'HTML';
    title: string;
    channelName: string;
    status: 'read' | 'unread';
    receiveTimestamp?: number;
    options?: Record<string, any>;
  }): Promise<any> => {
    const messagesRepo = this.app.db.getRepository(MessagesDefinition.name);
    const message = await messagesRepo.create({
      values: {
        content,
        title,
        channelName,
        contentType,
        status,
        userId,
        receiveTimestamp: receiveTimestamp ?? Date.now(),
        options,
      },
    });
    return message;
  };

  send: SendFnType<InAppMessageFormValues> = async (params) => {
    const { channel, message, receivers } = params;
    let userIds: number[];
    const { content, contentType, title, options = {} } = message;
    const userRepo = this.app.db.getRepository('users');
    if (receivers?.type === 'userId') {
      userIds = receivers.value;
    } else {
      userIds = (await parseUserSelectionConf(message.receivers, userRepo)).map((i) => parseInt(i));
    }
    await Promise.all(
      userIds.map(async (userId) => {
        await this.saveMessageToDB({
          title,
          content,
          status: 'unread',
          userId,
          contentType,
          channelName: channel.name,
          options,
        });
      }),
    );
    return { status: 'success', message };
  };

  defineActions() {
    defineMyInAppMessages({
      app: this.app,
      addClient: this.addClient,
      removeClient: this.removeClient,
      getClient: this.getClient,
    });
    defineMyInAppChannels({ app: this.app });
    this.app.acl.allow('myInAppMessages', '*', 'loggedIn');
    this.app.acl.allow('myInAppChannels', '*', 'loggedIn');
    this.app.acl.allow('notificationInAppMessages', '*', 'loggedIn');
  }
}
