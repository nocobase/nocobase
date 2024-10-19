/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { createMockServer } from '@nocobase/test';
import { ChannelsCollectionDefinition as ChannelsDefinition } from '@nocobase/plugin-notification-manager';
import { InAppMessagesDefinition as MessagesDefinition } from '../../../types';
import { createChannels, createMessages } from './db-funcs';

const database = new Database({
  dialect: 'postgres',
  database: 'nocobase_notifications_inapp',
  username: 'nocobase',
  password: 'nocobase',
  host: 'localhost',
  port: 5432,
});

const initServer = async () => {
  const app = await createMockServer({
    plugins: ['users', 'auth', 'notification-manager', 'notification-in-app'],
  });
  return app;
};

export const main = async () => {
  const app = await initServer();
  const db: Database = app.db;
  const channelsRepo = db.getRepository(ChannelsDefinition.name);
  const messagesRepo = db.getRepository(MessagesDefinition.name);
  const channels = await createChannels({ channelsRepo }, { totalNum: 50 });
  for (const channel of channels) {
    await createMessages(
      { messagesRepo },
      { unreadNum: 30, readNum: 40, channelName: channel.name, startTimeStamp: Date.now(), userId: 1 },
    );
  }
};
