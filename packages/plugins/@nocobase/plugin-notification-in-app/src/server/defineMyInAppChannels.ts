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
          const userFilter = userId ? { userId } : null;

          const latestMsgReceiveTimestampSQL = `(
                                SELECT messages.${messagesFieldName.receiveTimestamp}
                                FROM ${messagesTableName} AS messages
                                WHERE
                                    messages.${messagesFieldName.channelId} = ${channelsTableAliasName}.id
                                ORDER BY messages.${messagesFieldName.receiveTimestamp} DESC
                                LIMIT 1
                            )`;
          const latestMsgReceiveTSFilter = filter?.latestMsgReceiveTimestamp?.$lt
            ? Sequelize.literal(`${latestMsgReceiveTimestampSQL} < ${filter.latestMsgReceiveTimestamp.$lt}`)
            : null;
          const channelIdFilter = filter?.id ? { id: filter.id } : null;
          const unreadCntOptMap = {
            all: '>=',
            unread: '>',
            read: '=',
          };

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
          const channelStatusFilter =
            filter.status === 'all' || !filter.status
              ? null
              : filterChannelsByStatusSQL({ unreadCntOpt: unreadCntOptMap[filter.status] });

          const channelsRepo = app.db.getRepository(ChannelsDefinition.name);
          try {
            const channelsRes = channelsRepo.find({
              logging: console.log,
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
                  [Sequelize.literal(latestMsgReceiveTimestampSQL), 'latestMsgReceiveTimestamp'],
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
                [Op.and]: [userFilter, latestMsgReceiveTSFilter, channelIdFilter, channelStatusFilter].filter(Boolean),
              },
            });
            const countRes = channelsRepo.count({
              logging: (str) => {
                console.log(str);
              },
              //@ts-ignore
              where: {
                [Op.and]: [userFilter, channelStatusFilter].filter(Boolean),
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
}
