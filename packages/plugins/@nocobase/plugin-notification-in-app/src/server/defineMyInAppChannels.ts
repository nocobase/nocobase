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
import { InAppMessagesDefinition as MessagesDefinition, ChannelsDefinition as ChannelsDefinition } from '../types';

export default function defineMyInAppChannels({ app }: { app: Application }) {
  app.resourceManager.define({
    name: 'myInAppChannels',
    actions: {
      list: {
        handler: async (ctx) => {
          const { filter = {}, limit = 30 } = ctx.action?.params ?? {};
          const messagesCollection = app.db.getCollection(MessagesDefinition.name);
          const messagesTableName = messagesCollection.getRealTableName(true);
          const channelsCollection = app.db.getCollection(ChannelsDefinition.name);
          const channelsTableAliasName = app.db.sequelize.getQueryInterface().quoteIdentifier(channelsCollection.name);
          const messagesFieldName = {
            channelId: messagesCollection.getRealFieldName(MessagesDefinition.fieldNameMap.chatId, true),
            status: messagesCollection.getRealFieldName(MessagesDefinition.fieldNameMap.status, true),
            receiveTimestamp: messagesCollection.getRealFieldName(
              MessagesDefinition.fieldNameMap.receiveTimestamp,
              true,
            ),
            title: messagesCollection.getRealFieldName(MessagesDefinition.fieldNameMap.title, true),
          };
          const userId = ctx.state.currentUser.id;
          const conditions: any[] = [];
          if (userId) conditions.push({ userId });
          if (filter?.latestMsgReceiveTimestamp?.$lt) {
            conditions.push(Sequelize.literal(`latestMsgReceiveTimestamp < ${filter.latestMsgReceiveTimestamp.$lt}`));
          }
          if (filter?.id) conditions.push({ id: filter.id });

          const filterChannelsByStatusSQL = ({ unreadCntOpt }) => {
            return Sequelize.literal(`(
              SELECT COUNT(*)
              FROM ${messagesTableName} AS messages
              WHERE
                  messages.${messagesFieldName.channelId} = ${channelsTableAliasName}.id
                  AND
                  messages.${messagesFieldName.status} = 'unread'
          ) ${unreadCntOpt} 0`);
          };
          if (filter?.status === 'read') {
            conditions.push(filterChannelsByStatusSQL({ unreadCntOpt: '=' }));
          } else if (filter?.status === 'unread') {
            conditions.push(filterChannelsByStatusSQL({ unreadCntOpt: '>' }));
          }

          const channelsRepo = app.db.getRepository(ChannelsDefinition.name);
          try {
            const [channels, count] = await channelsRepo.findAndCount({
              limit,
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
              //@ts-ignore
              where: {
                [Op.and]: conditions,
              },
            });
            ctx.body = { rows: channels, count };
          } catch (error) {
            console.error(error);
          }
        },
      },
    },
  });
}
