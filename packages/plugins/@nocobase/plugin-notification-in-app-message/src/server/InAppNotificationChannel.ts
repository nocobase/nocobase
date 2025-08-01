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
import { InAppMessagesDefinition as MessagesDefinition } from '../types';
import { parseUserSelectionConf } from './parseUserSelectionConf';
import defineMyInAppMessages from './defineMyInAppMessages';
import defineMyInAppChannels from './defineMyInAppChannels';

type UserID = string;
type ClientID = string;
export default class InAppNotificationChannel extends BaseNotificationChannel {
  // userClientsMap: Record<UserID, Record<ClientID, PassThrough>>;

  // constructor(protected app: Application) {
  //   super(app);
  //   this.userClientsMap = {};
  // }

  async load() {
    this.app.db.on(`${MessagesDefinition.name}.afterSave`, this.onMessageCreatedOrUpdated);
    this.defineActions();
  }

  onMessageCreatedOrUpdated = async (model, options) => {
    const userId = model.userId;
    this.app.emit('ws:sendToTag', {
      tagKey: 'userId',
      tagValue: userId,
      message: {
        type: 'in-app-message:updated',
        payload: model.toJSON(),
      },
    });
  };

  saveMessageToDB = async ({
    content,
    status,
    userId,
    title,
    channelName,
    receiveTimestamp,
    options = {},
  }: {
    content: string;
    userId: number;
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
    const { content, title, options = {} } = message;
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
          channelName: channel.name,
          options,
        });
      }),
    );
    return { status: 'success', message };
  };

  defineActions() {
    defineMyInAppMessages(this.app);
    defineMyInAppChannels(this.app);
    this.app.acl.allow('myInAppMessages', '*', 'loggedIn');
    this.app.acl.allow('myInAppChannels', '*', 'loggedIn');
    this.app.acl.allow('notificationInAppMessages', '*', 'loggedIn');
  }
}
