/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SendFnType, BaseNotificationChannel } from '@nocobase/plugin-notification-manager';
import { InAppMessageFormValues } from '../types';
import { InAppMessagesDefinition as MessagesDefinition } from '../types';
import { parseUserSelectionConf } from './parseUserSelectionConf';
import defineMyInAppMessages from './defineMyInAppMessages';
import defineMyInAppChannels from './defineMyInAppChannels';

export default class InAppNotificationChannel extends BaseNotificationChannel {
  async load() {
    this.app.db.on(`${MessagesDefinition.name}.afterCreate`, this.onMessageCreated);
    this.app.db.on(`${MessagesDefinition.name}.afterBulkCreate`, this.onMessageCreated);
    this.app.db.on(`${MessagesDefinition.name}.afterUpdate`, this.onMessageUpdated);
    this.app.db.on(`${MessagesDefinition.name}.afterBulkUpdate`, this.onMessageUpdated);
    this.defineActions();
  }

  onMessageCreated = async (model, options) => {
    const models = Array.isArray(model) ? model : [model];
    for (const m of models) {
      const userId = m.userId;
      this.app.emit('ws:sendToUser', {
        userId,
        message: {
          type: 'in-app-message:created',
          payload: m.toJSON(),
        },
      });
    }
  };

  onMessageUpdated = async (model, options) => {
    const models = Array.isArray(model) ? model : [model];
    for (const m of models) {
      const userId = m.userId;
      this.app.emit('ws:sendToUser', {
        userId,
        message: {
          type: 'in-app-message:updated',
          payload: m.toJSON(),
        },
      });
    }
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

    const MessageModel = this.app.db.getModel(MessagesDefinition.name);
    await MessageModel.bulkCreate(
      userIds.map((userId) => ({
        title,
        content,
        status: 'unread',
        userId,
        channelName: channel.name,
        receiveTimestamp: Date.now(),
        options,
      })),
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
