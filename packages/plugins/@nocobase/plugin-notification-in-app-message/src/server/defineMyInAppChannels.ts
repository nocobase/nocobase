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
import { ChannelsCollectionDefinition as ChannelsDefinition } from '@nocobase/plugin-notification-manager';
import { InAppMessagesDefinition as MessagesDefinition } from '../types';

export default function defineMyInAppChannels(app: Application) {
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
          const channelsFieldName = {
            name: channelsCollection.getRealFieldName(ChannelsDefinition.fieldNameMap.name, true),
          };
          const messagesFieldName = {
            channelName: messagesCollection.getRealFieldName(MessagesDefinition.fieldNameMap.channelName, true),
            status: messagesCollection.getRealFieldName(MessagesDefinition.fieldNameMap.status, true),
            userId: messagesCollection.getRealFieldName(MessagesDefinition.fieldNameMap.userId, true),
            receiveTimestamp: messagesCollection.getRealFieldName(
              MessagesDefinition.fieldNameMap.receiveTimestamp,
              true,
            ),
            title: messagesCollection.getRealFieldName(MessagesDefinition.fieldNameMap.title, true),
          };
          const userId = ctx.state.currentUser.id;
          const userFilter = userId
            ? {
                name: {
                  [Op.in]: Sequelize.literal(`(
                                SELECT messages.${messagesFieldName.channelName}
                                FROM ${messagesTableName} AS messages
                                WHERE
                                   messages.${messagesFieldName.userId} = ${userId}
                            )`),
                },
              }
            : null;

          const latestMsgReceiveTimestampSQL = `(
                                SELECT messages.${messagesFieldName.receiveTimestamp}
                                FROM ${messagesTableName} AS messages
                                WHERE
                                    messages.${messagesFieldName.channelName} = ${channelsTableAliasName}.${channelsFieldName.name}
                                    AND messages.${messagesFieldName.userId} = ${userId}
                                ORDER BY messages.${messagesFieldName.receiveTimestamp} DESC
                                LIMIT 1
                            )`;
          const latestMsgReceiveTSFilter = filter?.latestMsgReceiveTimestamp?.$lt
            ? Sequelize.literal(`${latestMsgReceiveTimestampSQL} < ${filter.latestMsgReceiveTimestamp.$lt}`)
            : null;
          const channelIdFilter = filter?.id ? { id: filter.id } : null;
          const statusMap = {
            all: 'read|unread',
            unread: 'unread',
            read: 'read',
          };

          const filterChannelsByStatusSQL = ({ status }) => {
            const sql = Sequelize.literal(`(
              SELECT  messages.${messagesFieldName.channelName}
              FROM ${messagesTableName} AS messages
              WHERE messages.${messagesFieldName.status} = '${status}'
              AND messages.${messagesFieldName.userId} = ${userId}
          )`);
            return { name: { [Op.in]: sql } };
          };
          const channelStatusFilter =
            filter.status === 'all' || !filter.status
              ? null
              : filterChannelsByStatusSQL({ status: statusMap[filter.status] });

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
                                    messages.${messagesFieldName.channelName} = ${channelsTableAliasName}.${channelsFieldName.name}
                                    AND messages.${messagesFieldName.userId} = ${userId}
                            )`),
                    'totalMsgCnt',
                  ],
                  [Sequelize.literal(`'${userId}'`), 'userId'],
                  [
                    Sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM ${messagesTableName} AS messages
                                WHERE
                                    messages.${messagesFieldName.channelName} = ${channelsTableAliasName}.${channelsFieldName.name}
                                    AND messages.${messagesFieldName.status} = 'unread'
                                    AND messages.${messagesFieldName.userId} = ${userId}
                            )`),
                    'unreadMsgCnt',
                  ],
                  [Sequelize.literal(latestMsgReceiveTimestampSQL), 'latestMsgReceiveTimestamp'],
                  [
                    Sequelize.literal(`(
                      SELECT messages.${messagesFieldName.title}
                              FROM ${messagesTableName} AS messages
                              WHERE
                                  messages.${messagesFieldName.channelName} = ${channelsTableAliasName}.${channelsFieldName.name}
                                  AND messages.${messagesFieldName.userId} = ${userId}
                              ORDER BY messages.${messagesFieldName.receiveTimestamp} DESC
                              LIMIT 1
                  )`),
                    'latestMsgTitle',
                  ],
                ],
              },
              //@ts-ignore
              where: {
                [Op.and]: [userFilter, latestMsgReceiveTSFilter, channelIdFilter, channelStatusFilter].filter(Boolean),
              },
              sort: ['-latestMsgReceiveTimestamp'],
            });

            const countRes = channelsRepo.count({
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
