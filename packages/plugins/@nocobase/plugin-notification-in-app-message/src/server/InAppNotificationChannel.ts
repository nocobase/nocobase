/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SendFnType, BaseNotificationChannel } from '@nocobase/plugin-notification-manager';
import { v4 as uuidv4 } from 'uuid';
import { InAppMessageFormValues } from '../types';
import { InAppMessagesDefinition as MessagesDefinition } from '../types';
import { parseUserSelectionConf } from './parseUserSelectionConf';
import defineMyInAppMessages from './defineMyInAppMessages';
import defineMyInAppChannels from './defineMyInAppChannels';

export default class InAppNotificationChannel extends BaseNotificationChannel {
  private getMessagePayload(message: any) {
    return typeof message?.toJSON === 'function' ? message.toJSON() : message;
  }

  private emitMessageEvents(type: 'created' | 'updated', messages: any[]) {
    for (const message of messages) {
      this.app.emit('ws:sendToUser', {
        userId: message.userId,
        message: {
          type: `in-app-message:${type}`,
          payload: message,
        },
      });
    }
  }

  private scheduleMessageEvents(type: 'created', messages: any[]) {
    if (!messages.length) {
      return;
    }

    setImmediate(() => {
      try {
        this.emitMessageEvents(type, messages);
      } catch (error) {
        this.app.logger.error(`failed to emit in-app message events: ${error.message}`, {
          error,
          type,
          count: messages.length,
        });
      }
    });
  }

  async load() {
    this.app.db.on(`${MessagesDefinition.name}.afterCreate`, this.onMessageCreated);
    this.app.db.on(`${MessagesDefinition.name}.afterBulkCreate`, this.onMessageCreated);
    this.app.db.on(`${MessagesDefinition.name}.afterUpdate`, this.onMessageUpdated);
    this.app.db.on(`${MessagesDefinition.name}.afterBulkUpdate`, this.onMessageUpdated);
    this.defineActions();
  }

  onMessageCreated = async (model, options) => {
    const messages = (Array.isArray(model) ? model : [model]).map((item) => this.getMessagePayload(item));
    this.emitMessageEvents('created', messages);
  };

  onMessageUpdated = async (model, options) => {
    const messages = (Array.isArray(model) ? model : [model]).map((item) => this.getMessagePayload(item));
    this.emitMessageEvents('updated', messages);
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

    const uniqueUserIds = [...new Set(userIds)];
    if (!uniqueUserIds.length) {
      return { status: 'success', message };
    }

    const receiveTimestamp = Date.now();
    const messages = uniqueUserIds.map((userId) => ({
      id: uuidv4(),
      title,
      content,
      status: 'unread',
      userId,
      channelName: channel.name,
      receiveTimestamp,
      options,
    }));

    const MessageModel = this.app.db.getModel(MessagesDefinition.name);
    await MessageModel.bulkCreate(messages, {
      hooks: false,
      validate: false,
      returning: false,
    });
    this.scheduleMessageEvents('created', messages);
    return { status: 'success', message };
  };

  defineActions() {
    defineMyInAppMessages(this.app);
    defineMyInAppChannels(this.app);
    this.app.acl.allow('myInAppMessages', '*', 'loggedIn');
    this.app.acl.allow('myInAppChannels', '*', 'loggedIn');
    this.app.acl.allow('notificationInAppMessages', 'updateMyOwn', 'loggedIn');
  }
}
