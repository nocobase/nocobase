/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/server';
import { PassThrough } from 'stream';
import { InAppMessagesDefinition as MessagesDefinition, ChannelsDefinition as ChannelsDefinition } from '../types';

export default function defineMyInAppMessages({ app }: { app: Application }) {
  app.resourceManager.define({
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
          const messages = app.db.getRepository(MessagesDefinition.name);
          const count = await messages.count({ filter: { userId, status: 'unread' } });
          ctx.body = { count };
        },
      },
      list: {
        handler: async (ctx) => {
          const userId = ctx.state.currentUser.id;
          const messagesRepo = app.db.getRepository(MessagesDefinition.name);
          const { filter = {} } = ctx.action?.params ?? {};
          const messageList = await messagesRepo.find({
            limit: 20,
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
          const messages = app.db.getRepository(MessagesDefinition.name);
          const count = await messages.count({ filter: { userId, status: 'unread' } });
          ctx.body = { count };
        },
      },
    },
  });
}
