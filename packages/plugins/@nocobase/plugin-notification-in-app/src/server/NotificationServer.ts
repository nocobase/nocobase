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
import { InAppMessagesDefinition } from '../types';

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
    const { title } = content.config;
    for (const receiver of receivers) {
      const clients = this.userClientsMap[receiver];
      if (clients) {
        for (const clientId in clients) {
          const stream = clients[clientId];
          const messageData = { content: content.body, title };
          stream.write(`data: ${JSON.stringify(messageData)}\n\n`);
        }
      }
    }
    const messages = this.plugin.app.db.getRepository(InAppMessagesDefinition.name);
    const records = receivers.map((userId) => ({ content: content.body, userId, status: 'unread', title }));
    await messages.createMany({ records });
    return { status: 'success', receivers, content: content.body, title };
  };

  defineActions() {
    this.plugin.app.resourceManager.define({
      name: 'myInAppMessages',
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
      },
    });
  }
}
