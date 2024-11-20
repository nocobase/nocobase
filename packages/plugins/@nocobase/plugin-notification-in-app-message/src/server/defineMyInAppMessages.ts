/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/server';
import { Op, Sequelize } from 'sequelize';
import { PassThrough } from 'stream';
import { InAppMessagesDefinition as MessagesDefinition } from '../types';
import { ChannelsCollectionDefinition as ChannelsDefinition } from '@nocobase/plugin-notification-manager';
export default function defineMyInAppMessages({
  app,
  addClient,
  removeClient,
  getClient,
}: {
  app: Application;
  addClient: any;
  removeClient: any;
  getClient?: any;
}) {
  const countTotalUnreadMessages = async (userId: string) => {
    const messagesRepo = app.db.getRepository(MessagesDefinition.name);
    const channelsCollection = app.db.getCollection(ChannelsDefinition.name);
    const channelsTableName = channelsCollection.getRealTableName(true);
    const channelsFieldName = {
      name: channelsCollection.getRealFieldName(ChannelsDefinition.fieldNameMap.name, true),
    };

    const count = await messagesRepo.count({
      logging: console.log,
      // @ts-ignore
      where: {
        userId,
        status: 'unread',
        channelName: {
          [Op.in]: Sequelize.literal(`(select ${channelsFieldName.name} from ${channelsTableName})`),
        },
      },
    });
    return count;
  };

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
          const stream = new PassThrough();
          ctx.status = 200;
          ctx.body = stream;
          addClient(userId, clientId, stream);
          stream.on('close', () => {
            removeClient(userId, clientId);
          });
          stream.on('error', () => {
            removeClient(userId, clientId);
          });
          await next();
        },
      },
      count: {
        handler: async (ctx) => {
          try {
            const userId = ctx.state.currentUser.id;
            const count = await countTotalUnreadMessages(userId);
            ctx.body = { count };
          } catch (error) {
            console.error(error);
          }
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
    },
  });
}
