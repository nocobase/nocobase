/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChannelsDefinition } from '.';
import { CollectionOptions } from '@nocobase/client';

export const channelsCollection: CollectionOptions = {
  name: ChannelsDefinition.name,
  title: 'in-app messages',
  fields: [
    {
      name: ChannelsDefinition.fieldNameMap.id,
      type: 'uuid',
      primaryKey: true,
      allowNull: false,
      interface: 'uuid',
      uiSchema: {
        type: 'string',
        title: '{{t("ID")}}',
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      name: ChannelsDefinition.fieldNameMap.senderId,
      type: 'uuid',
      allowNull: false,
      interface: 'uuid',
      uiSchema: {
        type: 'string',
        title: '{{t("Sender ID")}}',
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      name: 'userId',
      type: 'bigInt',
      uiSchema: {
        type: 'number',
        'x-component': 'Input',
        title: '{{t("User ID")}}',
        required: true,
      },
    },
    {
      name: ChannelsDefinition.fieldNameMap.title,
      type: 'text',
      interface: 'input',
      uiSchema: {
        type: 'string',
        'x-component': 'Input',
        title: '{{t("Title")}}',
        required: true,
      },
    },
    {
      name: 'latestMsgId',
      type: 'string',
      interface: 'input',
    },
  ],
};

export type MsgGroup = {
  id: string;
  title: string;
  userId: string;
  unreadMsgCnt: number;
  lastMessageReceiveTime: string;
  lastMessageTitle: string;
};
